-- ============================================================
-- 2026-08-07 · Events: full editing + payment routing (KES 200 / 14 days)
--
-- Run this whole file ONCE in the Supabase SQL editor. It is written to be
-- re-runnable (create or replace / if not exists) so a partial run is safe.
--
-- Why this file exists at all: the tracker once recorded `update_event` as
-- built when it had only ever been *designed*. An RPC written into a doc is
-- not an RPC in the database. From now on the SQL lives in the repo.
--
-- WHAT THIS CHANGES
--   1. events.payment_failed        — fast-fail signal for the manage page
--   2. update_event()               — can now edit branding + sections
--   3. event_payments               — the money ledger (idempotency lives here)
--   4. apply_event_payment()        — atomic "credit this payment once"
-- ============================================================


-- ── 1 · payment_failed ──────────────────────────────────────
-- Mirrors cards.payment_failed. Without it, a host whose PIN was wrong sits
-- on a spinner for the full two-minute timeout instead of being told at once.
alter table public.events
  add column if not exists payment_failed boolean not null default false;


-- ── 2 · update_event — now covers branding and the scenes ───
--
-- THE ALLOWLIST *IS* THE SECURITY. `paid`, `paid_until`, `id` and `manage_id`
-- are absent from this function by construction, so no patch — however
-- crafted — can reach them. That is stronger than a check somebody could
-- later forget to update, and it is what makes "the webhook is the only
-- writer of paid/paid_until" a true statement rather than a convention.
--
-- New this migration: emoji / accent / accent_2 / bg / sections.
create or replace function public.update_event(p_manage_id text, p_patch jsonb)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rows int;
begin
  -- Validate the sections payload BEFORE touching the row, and raise rather
  -- than silently ignoring it. A save that quietly discards half the patch is
  -- the same class of lie as the ticket_url bug this migration exists to fix.
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
    -- `->>` returns NULL when the key is absent, so coalesce = "leave alone".
    -- An explicit "" in the patch is NOT null, so clearing a field still works.
    host          = coalesce(p_patch->>'host',          e.host),
    landing_title = coalesce(p_patch->>'landing_title', e.landing_title),
    landing_sub   = coalesce(p_patch->>'landing_sub',   e.landing_sub),
    cta_label     = coalesce(p_patch->>'cta_label',     e.cta_label),
    ticket_url    = coalesce(p_patch->>'ticket_url',    e.ticket_url),
    emoji         = coalesce(p_patch->>'emoji',         e.emoji),
    accent        = coalesce(p_patch->>'accent',        e.accent),
    accent_2      = coalesce(p_patch->>'accent_2',      e.accent_2),
    bg            = coalesce(p_patch->>'bg',            e.bg),

    -- event_date needs the key-exists test rather than coalesce: ''::date
    -- throws, and "clear the date" must be expressible.
    event_date    = case
                      when p_patch ? 'event_date'
                        then nullif(p_patch->>'event_date', '')::date
                      else e.event_date
                    end,

    sections      = case
                      when p_patch ? 'sections' then p_patch->'sections'
                      else e.sections
                    end
  where e.manage_id = p_manage_id;

  get diagnostics v_rows = row_count;

  -- false = no row matched that manage_id, so the UI can say so instead of
  -- reporting a successful save that changed nothing.
  return v_rows > 0;
end;
$$;

grant execute on function public.update_event(text, jsonb) to anon, authenticated;


-- ── 3 · event_payments — the money ledger ───────────────────
--
-- One row per Paystack reference. The UNIQUE constraint on `reference` is the
-- entire idempotency mechanism: a retried webhook cannot insert twice, so it
-- cannot extend paid_until twice. Webhooks retry as a matter of course — this
-- is not an edge case, it is normal traffic.
create table if not exists public.event_payments (
  id         bigint generated always as identity primary key,
  event_id   text        not null references public.events(id) on delete cascade,
  reference  text        not null unique,
  units      int         not null,
  amount     int         not null,          -- minor units (cents), as charged
  created_at timestamptz not null default now()
);

create index if not exists event_payments_event_id_idx
  on public.event_payments(event_id);

-- RLS on, and NO policies at all. That is intentional: a table with RLS
-- enabled and zero policies is readable by nobody through the anon key. Only
-- the service-role key (the webhook) touches it, and service-role bypasses
-- RLS. Payment history is not public data.
alter table public.event_payments enable row level security;


-- ── 4 · apply_event_payment — credit a payment, exactly once ─
--
-- Both statements in one function = one transaction. If the UPDATE fails, the
-- ledger INSERT rolls back with it, so the retry finds no duplicate and can
-- try again. Split across two round-trips from Node, a failure between them
-- would leave a paid event permanently stuck as a draft.
--
-- greatest(coalesce(paid_until, now()), now()) is decision #4: extend from
-- whichever is LATER, so topping up a live event adds to the time remaining
-- instead of burning it.
create or replace function public.apply_event_payment(
  p_event_id  text,
  p_reference text,
  p_units     int,
  p_amount    int,
  p_days      int
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.event_payments (event_id, reference, units, amount)
  values (p_event_id, p_reference, p_units, p_amount)
  on conflict (reference) do nothing;

  -- FOUND is false when the conflict swallowed the insert: we have already
  -- credited this reference. Report it and change nothing.
  if not found then
    return 'duplicate';
  end if;

  update public.events
  set paid           = true,
      payment_failed = false,
      paid_until     = greatest(coalesce(paid_until, now()), now())
                       + make_interval(days => p_units * p_days)
  where id = p_event_id;

  if not found then
    raise exception 'event % not found', p_event_id;
  end if;

  return 'applied';
end;
$$;

-- CRITICAL: this function MINTS PAID TIME. A security-definer function runs
-- as its owner, so leaving it callable by anon would hand every visitor a
-- free-hosting endpoint — worse than the client-supplied-amount hole, because
-- it skips Paystack entirely. Only the webhook's service-role key may call it.
revoke all on function public.apply_event_payment(text, text, int, int, int) from public;
revoke all on function public.apply_event_payment(text, text, int, int, int) from anon, authenticated;
grant execute on function public.apply_event_payment(text, text, int, int, int) to service_role;


-- ── VERIFY (run these after, they should all return rows) ───
-- select proname, pg_get_function_arguments(oid) from pg_proc
--   where proname in ('update_event','apply_event_payment','get_event_for_manage','event_status','get_event_feedback');
-- select column_name from information_schema.columns
--   where table_name = 'events' and column_name = 'payment_failed';
