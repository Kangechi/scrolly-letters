-- ============================================================
-- CREATE STUDIO · PHASE 1 — pay-first checkout
--
-- APPLIED 15 Sep 2026 by hand in the Supabase SQL editor. This file is the
-- RECORD of what ran, kept so the schema can be rebuilt from the repo.
-- Idempotent: safe to run again.
--
--   1 · requires_payment / product / opens_at — the three new facts a card carries
--   2 · cards_force_unpaid                  — the browser may write words, never money or time
-- ============================================================


-- ── 1 · New columns ────────────────────────────────────────
--
-- `requires_payment default false` is what leaves every existing card alone:
-- old rows read false, so they keep today's behaviour (readable, pay-to-share
-- in Outro). Only cards made through the new checkout set it true.
-- `product` is informational — the PRICE is derived from the row's contents
-- (productOf in src/lib/pricing.js), never from this label.
-- `opens_at` is the time-lock. Written only by api/pay.js (service role).
alter table public.cards
  add column if not exists requires_payment boolean not null default false,
  add column if not exists product text,
  add column if not exists opens_at timestamptz;


-- ── 2 · cards_force_unpaid ─────────────────────────────────
--
-- Anon can insert into `cards`, and nothing stopped an insert carrying
-- `paid: true` — a free card. BEFORE INSERT means we edit `new`, the row
-- about to be written, so whatever the browser sent is overwritten.
-- A trigger CORRECTS rather than rejects, and works regardless of what the
-- RLS policies say. Only the webhook (via UPDATE) may ever set paid.
create or replace function public.cards_force_unpaid()
returns trigger
language plpgsql
as $$
begin
  new.paid           := false;
  new.payment_failed := false;
  new.opens_at       := null;
  return new;
end;
$$;

drop trigger if exists cards_force_unpaid on public.cards;
create trigger cards_force_unpaid
  before insert on public.cards
  for each row execute function public.cards_force_unpaid();


-- ── Verify (read-only) ─────────────────────────────────────
-- select tgname, tgenabled from pg_trigger where tgname = 'cards_force_unpaid';
-- → one row, tgenabled = 'O'
