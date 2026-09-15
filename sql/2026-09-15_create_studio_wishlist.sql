-- ============================================================
-- CREATE STUDIO · PHASE 4 — wishlist claims
--
-- RUN BY HAND in the Supabase SQL editor before anyone opens a wishlist.
-- Idempotent: safe to run again.
--
-- A wishlist is a `cards` row whose sections include
--   { type: 'wishlist', items: [{ id, name, emoji, price, link, note }] }
-- The items live in the card. This file only adds the CLAIMS — "someone is
-- getting this" — so friends don't buy the same thing twice.
--
--   1 · wish_claims      — one row per claimed item. No names, ever.
--   2 · claim_wish       — claim an item; returns a secret undo token
--   3 · unclaim_wish     — undo, only with that token
--   4 · get_wish_claims  — which item ids are taken (ids only)
--
-- Same shape as event_clicks / get_event_clicks (2026-08-11): RLS on, NO
-- policies at all, so the anon key can't touch the table directly. Every
-- read and write goes through a security-definer function that decides
-- exactly what is allowed.
-- ============================================================


-- ── 1 · wish_claims ────────────────────────────────────────
--
-- What is deliberately NOT here: a name, a phone, an IP. The owner of the
-- list opens the same link as everyone else, so anything stored here would
-- be visible to the person the surprise is for. "Taken" is all we keep.
--
-- `token_hash`, not the token: whoever claims gets a random token back and
-- keeps it in their own browser. We store only its SHA-256, so even a leak of
-- this table can't be used to unclaim anything.
create table if not exists public.wish_claims (
  id          bigint generated always as identity primary key,
  card_id     text        not null references public.cards(id) on delete cascade,
  item_id     text        not null,
  token_hash  text        not null,
  claimed_at  timestamptz not null default now(),
  -- One claim per item. Two friends tapping at the same moment: the database
  -- decides who won, not whichever browser rendered first.
  constraint wish_claims_one_per_item unique (card_id, item_id)
);

alter table public.wish_claims enable row level security;
-- No policies. RLS with zero policies = deny everything to anon/authenticated.


-- ── 2 · claim_wish ─────────────────────────────────────────
--
-- Refuses unless: the card exists, is PAID, is not still time-locked, and the
-- item id really is one of this card's wishlist items (so nobody can fill
-- the table with junk ids). Errors are short codes the app maps to copy.
create or replace function public.claim_wish(p_card_id text, p_item_id text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_card  public.cards;
  v_token text;
begin
  select * into v_card from public.cards where id = p_card_id;
  if not found or not coalesce(v_card.paid, false) then
    raise exception 'not_found';
  end if;

  if v_card.opens_at is not null and v_card.opens_at > now() then
    raise exception 'locked';
  end if;

  if not exists (
    select 1
      from jsonb_array_elements(v_card.sections) s,
           jsonb_array_elements(coalesce(s -> 'items', '[]'::jsonb)) it
     where s ->> 'type' = 'wishlist'
       and it ->> 'id' = p_item_id
  ) then
    raise exception 'no_such_item';
  end if;

  -- gen_random_uuid() is built into Postgres 13+, so no pgcrypto needed.
  -- 122 random bits — unguessable.
  v_token := replace(gen_random_uuid()::text, '-', '');

  insert into public.wish_claims (card_id, item_id, token_hash)
  values (p_card_id, p_item_id, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'))
  on conflict (card_id, item_id) do nothing;

  -- ON CONFLICT DO NOTHING inserts zero rows when the item is taken, and
  -- FOUND reports whether the INSERT touched a row.
  if not found then
    raise exception 'already_claimed';
  end if;

  return v_token;
end;
$$;


-- ── 3 · unclaim_wish ───────────────────────────────────────
--
-- Deletes only when the token matches. Returns true if something was undone.
create or replace function public.unclaim_wish(p_card_id text, p_item_id text, p_token text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  with removed as (
    delete from public.wish_claims
     where card_id = p_card_id
       and item_id = p_item_id
       and token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    returning 1
  )
  select exists (select 1 from removed);
$$;


-- ── 4 · get_wish_claims ────────────────────────────────────
--
-- Item ids only. No timestamps, no tokens, no counts per person — the return
-- type itself is the privacy boundary.
create or replace function public.get_wish_claims(p_card_id text)
returns setof text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c.item_id
    from public.wish_claims c
    join public.cards k on k.id = c.card_id
   where c.card_id = p_card_id
     and coalesce(k.paid, false);
$$;


-- security definer + public schema = the classic Postgres footgun.
-- Revoke from everyone first, then grant only what the app calls with.
revoke all on function public.claim_wish(text, text)          from public;
revoke all on function public.unclaim_wish(text, text, text)  from public;
revoke all on function public.get_wish_claims(text)           from public;
grant execute on function public.claim_wish(text, text)         to anon, authenticated;
grant execute on function public.unclaim_wish(text, text, text) to anon, authenticated;
grant execute on function public.get_wish_claims(text)          to anon, authenticated;


-- ── Verify (read-only) ─────────────────────────────────────
-- select proname from pg_proc where proname in ('claim_wish','unclaim_wish','get_wish_claims');
-- → three rows
