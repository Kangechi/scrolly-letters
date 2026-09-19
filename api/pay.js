import { createClient } from "@supabase/supabase-js"
import {
    EVENT_UNIT_PRICE_MINOR,
    clampUnits,
    priceForCard,
} from '../src/lib/pricing.js'

/* ============================================================
   PAY — starts a Paystack M-Pesa charge. Two KINDS of thing get charged for:

     kind: 'card'   → one personal card, unlocks sharing        (unchanged)
     kind: 'event'  → N × 14-day units of an event being live   (new)

   THE TRUST BOUNDARY. Everything below the fold in this file exists because
   of one rule: **the browser is not allowed to say what something costs.**
   It sends what it wants (units) and who it is (a secret); the server decides
   the price. A client-supplied `amount` would let anyone buy a year of
   hosting for one shilling — and it would appear in Paystack as a completely
   ordinary successful payment. Nothing would ever error.

   Second rule, same shape: the event is resolved BY `manage_id`, never by the
   public invite id. Possession of the 21-char secret is what authorises an
   edit, so it is also what authorises spending money on the same row. If the
   client passed an event id, anyone could trigger charges against any event.
   ============================================================ */

function admin() {
    return createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )
}

//Paystack needs the +254 format of the phone number hence a function
function formatPhone(raw) {
    let cleaned = raw.replace(/\D/g, '')
    if (cleaned.startsWith('0'))   cleaned = '254' + cleaned.slice(1) // 0725942987   → 254725942987
    if (!cleaned.startsWith('254')) cleaned = '254' + cleaned          // 725942987    → 254725942987
    return '+' + cleaned                                              // → +254725942987 (E.164)
}

/* Each pricer returns { amount, email, metadata } — or { error, status }.
   The amount is computed here and NOWHERE else on the request path. */


const MAX_SCHEDULE_DAYS = 366

/* The browser proposes a time; the server decides whether it's legal.
   Returns { value } — an ISO string, or null for "open immediately" —
   or { error }. */
function parseOpensAt(raw) {
    if (raw == null || raw === '') return { value: null }

    const t = new Date(raw).getTime()
    if (Number.isNaN(t)) return { error: 'That schedule date is not valid' }

    const now = Date.now()
    if (t > now + MAX_SCHEDULE_DAYS * 24 * 60 * 60 * 1000) {
        return { error: 'Schedule it within a year' }
    }
    // A time that has already passed isn't an error — the moment has come.
    if (t <= now) return { value: null }

    return { value: new Date(t).toISOString() }
}


async function priceCard({ cardId, opensAt }) {
    if (!cardId) return { error: 'cardId is required', status: 400 }
    const supabase = admin()

    // select('*'), not a column list: the `style` columns don't exist until
    // phase 2, and naming a missing column makes PostgREST fail the whole query.
    const { data: card } = await supabase
        .from('cards').select('*').eq('id', cardId).maybeSingle()
    if (!card) return { error: 'Card not found', status: 404 }

    if (card.paid) return { error: "This card is already paid", status: 409}

    const when = parseOpensAt(opensAt)
    if (when.error) return { error: when.error, status: 400 }

    // Priced ONCE, here, and written down with the card. The webhook checks the
    // payment against this recorded number rather than re-pricing — so a price
    // change between "Pay" and Paystack's reply can't strand a real payment.
    const amount = priceForCard(card)

    const { error: prepError } = await supabase
         .from('cards')
         .update({payment_failed: false, opens_at: when.value, charged_amount: amount})
         .eq('id', cardId)

    // Fail loudly. If this write silently failed (e.g. a column missing because
    // a migration wasn't run), the charge would still go out — and the card's
    // schedule and recorded price would be quietly lost.
    if (prepError) return { error: 'Could not prepare this card for payment', status: 500 }

         return {
            amount,
            email: `${cardId}@scrolly-letters.app`,
            metadata: {kind: 'card', cardId},
         }
}

async function priceEvent({ manageId, units }) {
    if (!manageId) return { error: 'manageId is required', status: 400 }

    const supabase = admin()

    // The server does the lookup, so the caller never names the event it is
    // paying for — it proves it may pay by holding the secret.
    const { data: ev } = await supabase
        .from('events')
        .select('id')
        .eq('manage_id', manageId)
        .maybeSingle()

    // Deliberately vague. This endpoint is reached with a secret, so a precise
    // message ("no such event" vs "wrong key") is a hint about which secrets
    // are real — the same reasoning as the manage page's error copy.
    if (!ev) return { error: 'Event not found', status: 404 }

    // Clamped, not trusted. units:999999 arrives here as 12.
    const n = clampUnits(units)

    await supabase.from('events').update({ payment_failed: false }).eq('id', ev.id)

    return {
        amount: n * EVENT_UNIT_PRICE_MINOR,
        email: `${ev.id}@scrolly-letters.app`,
        // The webhook needs three things later: which branch to take, which
        // row to credit, and how much time was bought. It gets them here
        // because a webhook body is otherwise just money with no context.
        metadata: { kind: 'event', eventId: ev.id, units: n },
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Method not allowed'})
    }

    const { kind = 'card', phone } = req.body || {}

    if (!phone) {
        return res.status(400).json({error: 'phone is required'})
    }

    try {
        const priced = kind === 'event'
            ? await priceEvent(req.body)
            : await priceCard(req.body)

        if (priced.error) {
            return res.status(priced.status).json({ error: priced.error })
        }

        const charge = await fetch('https://api.paystack.co/charge', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email:  priced.email,
                amount: priced.amount,
                currency: 'KES',
                mobile_money: {
                    phone: formatPhone(phone),
                    provider: 'mpesa'
                },
                metadata: priced.metadata
            })
        })
        const data = await charge.json()

        if (!data.status) {
            return res.status(400).json({error: data.message || "Could not start payment", details: data})
        }

        return res.status(200).json({reference: data.data?.reference})
    }
    catch (err) {
        return res.status(500).json({error: err.message})
    }
}
