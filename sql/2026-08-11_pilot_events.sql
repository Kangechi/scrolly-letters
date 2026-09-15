-- ============================================================
-- PILOT EVENTS — LinkedIn Local "Beyond the Paycheck" + Hackhouse Demo Day
--
-- Four things, in the order they matter:
--   1 · comped        — tell a free pilot apart from a sale, forever
--   2 · poster_url    — a card can finally carry its own artwork
--   3 · event_clicks  — the host learns whether anyone tapped the ticket
--   4 · update_event  — the allowlist learns about poster_url
--
-- WHAT THIS MIGRATION DELIBERATELY DOES NOT DO: touch `paid` or
-- `paid_until`. The Paystack webhook is still the only writer of those,
-- by construction. Comping the two pilots is a hand-written UPDATE at the
-- bottom of this file that YOU run with YOUR dates — not something the
-- application can ever do on its own.
-- ============================================================


-- ── 1 · comped ──────────────────────────────────────────────
--
-- `paid = true` on a free event is a lie the data tells quietly. Six months
-- from now "how many events did we sell?" returns 2 events you gave away.
-- One boolean is the whole cost of never having to remember that.
--
-- It is NOT in the update_event allowlist below, for the same reason `paid`
-- isn't: a host must not be able to comp their own event.
alter table public.events
  add column if not exists comped boolean not null default false;

comment on column public.events.comped is
  'True when this event was given away rather than paid for. Never written by the app — set by hand for pilots and sponsorships. Exclude from revenue counts.';


-- ── 2 · poster_url ──────────────────────────────────────────
--
-- Both pilots arrived with artwork already made, and until now a card had
-- nowhere to put it. Nullable: most events will never have a poster, and a
-- card must look finished without one.
alter table public.events
  add column if not exists poster_url text;

comment on column public.events.poster_url is
  'Public URL of the event poster in the event-posters bucket. NULL is normal — the card renders without it.';


-- ── 2b · the ticket gate ────────────────────────────────────
--
-- When true, the invite's button leaves for /card/:id/ticket instead of
-- opening the scenes. The guest commits to a ticket before they see the
-- lineup, the venue or the date.
--
-- DEFAULT FALSE IS THE WHOLE POINT. Every event already in the wild keeps
-- opening the way its host expects. The two pilots switch it on by hand.
-- If the flow proves itself, changing this default is how it cascades to
-- everything — one line, and no existing row has to be touched.
alter table public.events
  add column if not exists ticket_gate boolean not null default false;

comment on column public.events.ticket_gate is
  'True = the card will not open until the guest goes through the ticket step. Default false; the pilots opt in.';

-- What the GUEST pays the HOST for a seat, in whole KES.
--
-- NOT the same money as pricing.js. That file holds what a host pays US
-- (KES 200 per 14-day unit) and lives in one shared constant precisely
-- because it must never drift. This is the host's own price for their own
-- event, so it belongs to the row, not to a constant.
--
-- NULL means free to attend — a real state, not missing data. The gate
-- still runs for a free event; it just asks the guest to reserve.
alter table public.events
  add column if not exists ticket_price integer;

comment on column public.events.ticket_price is
  'Guest-facing ticket price in whole KES. NULL or 0 = free to attend. Unrelated to pricing.js, which is what the host pays us.';


-- ── 3 · event_clicks ────────────────────────────────────────
--
-- The host's question is "did the card do anything?" The honest answer we
-- can give is "N people tapped through to your ticket page" — never "N
-- people bought", which lives inside their ticketing platform and is not
-- ours to know. Naming the table `event_clicks` rather than `conversions`
-- keeps that boundary visible in the schema itself.
--
-- ANONYMOUS BY CONSTRUCTION. There is no guest_id, no ip, no user_agent.
-- Not because they'd be hard to collect, but because collecting them turns
-- a counter into a surveillance log, and a card that reports who clicked is
-- a different product from the one you're selling.
create table if not exists public.event_clicks (
  id         bigint generated always as identity primary key,
  event_id   uuid        not null references public.events(id) on delete cascade,
  cta_id     text        not null,
  clicked_at timestamptz not null default now(),

  -- Cheap insurance against a typo becoming a permanently miscounted
  -- metric: a bad cta_id fails loudly at insert instead of quietly
  -- creating a fourth category nobody notices for a month.
  constraint event_clicks_cta_id_check
    check (cta_id in ('ticket', 'cohort', 'open'))
);

-- The only query anyone runs: "this event's clicks, newest first."
create index if not exists event_clicks_event_id_clicked_at_idx
  on public.event_clicks (event_id, clicked_at desc);

alter table public.event_clicks enable row level security;

-- Guests are anonymous, so the INSERT has to be open to anon. That is the
-- entire attack surface: someone can inflate a click count. They cannot
-- read one back, because no SELECT policy exists on this table at all —
-- and RLS denies by default. The host reads through the RPC below instead.
drop policy if exists "anyone may log a click" on public.event_clicks;
create policy "anyone may log a click"
  on public.event_clicks
  for insert
  to anon, authenticated
  with check (true);


-- ── 4 · get_event_clicks ────────────────────────────────────
--
-- Mirrors get_event_feedback: security definer, keyed on manage_id, so
-- knowing the manage link is what grants access. Returns AGGREGATES ONLY —
-- there are no per-click rows in the return type, so this function cannot
-- become a way to watch guests in real time even if someone wanted it to.
create or replace function public.get_event_clicks(p_manage_id text)
returns table (cta_id text, clicks bigint, last_click timestamptz)
language sql
security definer
set search_path = public, pg_temp
as $$
  select c.cta_id,
         count(*)         as clicks,
         max(c.clicked_at) as last_click
    from public.event_clicks c
    join public.events e on e.id = c.event_id
   where e.manage_id = p_manage_id
   group by c.cta_id
   order by clicks desc;
$$;

-- security definer + a public schema = the classic Postgres footgun. Revoke
-- first, then grant only what the app actually calls with.
revoke all on function public.get_event_clicks(text) from public;
grant execute on function public.get_event_clicks(text) to anon, authenticated;


-- ── 5 · update_event learns about poster_url ────────────────
--
-- THE ALLOWLIST IS STILL THE SECURITY. This replaces the function body from
-- 2026-08-07 with one line added. `paid`, `paid_until`, `comped`, `id` and
-- `manage_id` remain absent by construction.
--
-- NOTE: the scene-type guard is unchanged and still lists five types. The
-- ticket-only ending is a `feedback` scene with its ask half switched off,
-- NOT a new type — which is exactly why this migration doesn't have to
-- touch that list.
create or replace function public.update_event(p_manage_id text, p_patch jsonb)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rows int;
begin
  if p_patch ? 'sections' then
    if jsonb_typeof(p_patch->'sections') <> 'array' then
      raise exception 'sections must be a JSON array';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(p_patch->'sections') s
      where coalesce(s->>'type', '') not in ('hero','who','message','memory','feedback')
    ) then
      raise exception 'sections contains an unsupported scene type';
    end if;
  end if;

  update public.events e
  set
    host          = coalesce(p_patch->>'host',          e.host),
    landing_title = coalesce(p_patch->>'landing_title', e.landing_title),
    landing_sub   = coalesce(p_patch->>'landing_sub',   e.landing_sub),
    cta_label     = coalesce(p_patch->>'cta_label',     e.cta_label),
    ticket_url    = coalesce(p_patch->>'ticket_url',    e.ticket_url),
    emoji         = coalesce(p_patch->>'emoji',         e.emoji),
    accent        = coalesce(p_patch->>'accent',        e.accent),
    accent_2      = coalesce(p_patch->>'accent_2',      e.accent_2),
    bg            = coalesce(p_patch->>'bg',            e.bg),
    -- NEW. '' clears the poster (back to no artwork); absent leaves it alone.
    poster_url    = coalesce(p_patch->>'poster_url',    e.poster_url),

    -- The gate and its price are HOST-editable, unlike paid/comped: a host
    -- deciding whether their own guests pay first is a content decision,
    -- not a money-integrity one. `::boolean` and `::integer` casts mean a
    -- junk value raises here instead of quietly writing NULL.
    ticket_gate   = case
                      when p_patch ? 'ticket_gate'
                        then (p_patch->>'ticket_gate')::boolean
                      else e.ticket_gate
                    end,
    ticket_price  = case
                      when p_patch ? 'ticket_price'
                        then nullif(p_patch->>'ticket_price', '')::integer
                      else e.ticket_price
                    end,

    event_date    = case
                      when p_patch ? 'event_date'
                        then nullif(p_patch->>'event_date', '')::date
                      else e.event_date
                    end,
    sections      = coalesce(p_patch->'sections', e.sections)
  where e.manage_id = p_manage_id;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;


-- ============================================================
-- COMP THE TWO PILOTS
--
-- Run this by hand, once, with your real manage_ids and your real dates.
-- Left commented on purpose: a migration that silently makes events free
-- when someone re-runs the file is a bug waiting for a bad afternoon.
--
-- paid_until is when the CARD dies, not when the event starts — give it a
-- week or so after the event so people can still open the link afterwards.
-- ============================================================

-- update public.events
--    set paid         = true,
--        comped       = true,
--        paid_until   = '2026-09-11',       -- LinkedIn Local: event 4 Sep
--        ticket_gate  = true,
--        ticket_price = 500                 -- your number, or NULL if free
--  where manage_id = 'PASTE_LINKEDIN_MANAGE_ID';

-- update public.events
--    set paid         = true,
--        comped       = true,
--        paid_until   = '2026-09-27',       -- Demo Day: event 20 Sep
--        ticket_gate  = true,
--        ticket_price = null                -- free to attend, still gated
--  where manage_id = 'PASTE_DEMODAY_MANAGE_ID';
