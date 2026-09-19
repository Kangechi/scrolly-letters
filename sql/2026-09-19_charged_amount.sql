-- ============================================================
-- PAY-FIRST · PRICE-DRIFT FIX — record what we asked for
--
-- RUN BY HAND in the Supabase SQL editor BEFORE deploying the code that
-- ships with it. api/pay.js now writes charged_amount and refuses to start a
-- charge if that write fails — so with the code live and this column
-- missing, card payments stop with "Could not prepare this card for
-- payment" (loud, on purpose) instead of silently losing the schedule.
-- Idempotent: safe to run again.
-- ============================================================

-- THE PROBLEM. The webhook used to re-price the card when Paystack replied.
-- Anyone who pressed "Pay" just before a price change paid the OLD price,
-- and the webhook — expecting the NEW one — refused to credit a real
-- payment. Rare, silent, found on a bank statement.
--
-- THE FIX. pay.js writes the amount down at the moment it asks for it; the
-- webhook checks the payment against that recorded number.
alter table public.cards
  add column if not exists charged_amount integer;   -- minor units (KES × 100)

comment on column public.cards.charged_amount is
  'Minor units requested by api/pay.js for the latest charge. Written only by the server; the webhook credits only this amount.';

-- Keep the browser out of it. Re-creates the insert trigger's FUNCTION with
-- one new line; the trigger itself (cards_force_unpaid) is unchanged. Without
-- this, a tampered insert could set charged_amount: 1 and pay one shilling.
create or replace function public.cards_force_unpaid()
returns trigger
language plpgsql
as $$
begin
  new.paid           := false;
  new.payment_failed := false;
  new.opens_at       := null;
  new.charged_amount := null;
  return new;
end;
$$;

-- ── Verify (read-only) ─────────────────────────────────────
-- select column_name from information_schema.columns
--  where table_name = 'cards' and column_name = 'charged_amount';   → 1 row
