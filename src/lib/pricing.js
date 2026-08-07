/* ============================================================
   PRICING — ONE source of truth for money.

   Imported by BOTH the React app (to display a price) and the serverless
   routes in /api (to actually charge one). That is the whole point: the
   landing page said "KES 500 monthly" while the spec said "KES 500 per 14
   days" for weeks, because the number lived in two places and drifted. A
   price in two files is a price that will eventually disagree with itself.

   THE TRUST RULE: the client's number is DECORATION. `api/pay.js` recomputes
   the amount from these same constants and never reads an amount off the
   request body. If it did, anyone could POST `amount: 100` and buy a year of
   hosting for one shilling — and it would log as a perfectly normal
   successful payment. Silent, profitable-looking, wrong.
   ============================================================ */

/** One personal card, paid once, unlocks sharing. */
export const CARD_PRICE_KES = 50

/** One EVENT unit. An event is bought in units, not subscribed to. */
export const EVENT_UNIT_PRICE_KES = 200

/** How long one unit keeps an event live. NOT a month — a month is a
    different product: variable length, ambiguous extension, and it implies a
    recurring subscription that nothing in this codebase performs. */
export const UNIT_DAYS = 14

/** Ceiling on units per charge. Clamped on the SERVER: a hostile client can
    send units: 999999, and without this the webhook would happily verify the
    matching (enormous) amount and extend paid_until past the heat death of
    the sun. 12 × 14 = 168 days ≈ 6 months. */
export const MAX_UNITS = 12

/** Paystack charges in the currency's MINOR unit — cents for KES.
    KES 200 → 20000. Getting this wrong by 100× is the kind of bug that only
    shows up on a real bank statement. */
export const toMinor = (kes) => Math.round(kes * 100)

export const CARD_PRICE_MINOR = toMinor(CARD_PRICE_KES)
export const EVENT_UNIT_PRICE_MINOR = toMinor(EVENT_UNIT_PRICE_KES)

/** Coerce whatever the client sent into a legal unit count. Deliberately
    total — it always returns a valid number rather than throwing, because
    every caller's fallback would otherwise be "1" anyway. */
export function clampUnits(raw) {
  const n = Math.floor(Number(raw))
  if (!Number.isFinite(n)) return 1
  return Math.min(Math.max(n, 1), MAX_UNITS)
}

/** Display helpers, so the copy in the UI is generated from the same numbers
    that the charge is. "KES 400 · 28 days" can never say 500 again. */
export const eventPriceKes = (units) => clampUnits(units) * EVENT_UNIT_PRICE_KES
export const eventDays = (units) => clampUnits(units) * UNIT_DAYS
