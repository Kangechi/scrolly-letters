import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto'
import { EVENT_UNIT_PRICE_MINOR, UNIT_DAYS, clampUnits, priceForCard } from '../src/lib/pricing.js'

/* ============================================================
   CALLBACK — the Paystack webhook. THE ONLY WRITER of `paid` / `paid_until`.

   That is a deliberate design rule, not a coincidence: this is the only place
   in the whole system that knows money actually moved, and the only one
   holding the service-role key. `update_event` was built so that it *cannot*
   reach those columns, so there is exactly one door.

   Three guards, because every one of these failures is SILENT — the request
   succeeds, the logs look clean, and you find out on a bank statement:

     1. HMAC signature  — is this really Paystack, or someone POSTing JSON?
     2. Amount match    — did they pay what we would have charged for N units?
     3. Idempotency     — webhooks RETRY. Crediting a retry is free hosting.
   ============================================================ */

export const config = {
  api: { bodyParser: false }
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

/* Paystack round-trips whatever it stored, which means metadata sometimes
   comes back as a JSON *string* rather than an object. Normalise once, at the
   boundary — the alternative is `metadata.kind` being undefined on some
   requests and nobody noticing until an event silently never goes live. */
function readMetadata(data) {
  let meta = data?.metadata
  if (typeof meta === 'string') {
    try { meta = JSON.parse(meta) } catch { meta = null }
  }
  return meta && typeof meta === 'object' ? meta : {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method is not allowed' })
  }

  try {
    const rawBody = await getRawBody(req)

    // GUARD 1 — proof this came from Paystack. Computed over the RAW body,
    // which is why bodyParser is off: re-serialising the JSON changes the
    // bytes and the hash stops matching.
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex')

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ error: 'Invalid Signature' })
    }

    const event = JSON.parse(rawBody)
    const meta = readMetadata(event.data)

    // Charges made before `kind` existed carry only cardId — treat them as cards.
    const kind = meta.kind || (meta.cardId ? 'card' : null)
    const isCharge = typeof event.event === 'string' && event.event.startsWith('charge.')
    const isSuccess = event.event === 'charge.success'

    // Anything else Paystack sends (transfers, subscriptions, refunds) is not
    // ours to act on. 200 so it stops retrying.
    if (!isCharge || !kind) {
      return res.status(200).json({ recieved: true, ignored: 'not-ours' })
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // ── CARDS ────────────────────────────────────────────────
    if (kind === 'card') {
      const cardId = meta.cardId
      if (!cardId) return res.status(200).json({ recieved: true })

      if (isSuccess) {
        const { data: card } = await supabase
          .from('cards').select('*').eq('id', cardId).maybeSingle()
        if (!card) return res.status(200).json({ recieved: true, ignored: 'no-card' })

        // GUARD 2 for cards — same rule events already follow. The price is
        // re-derived from the row, so a card can't be credited for less than
        // its product costs.
        const expected = priceForCard(card)
        if (Number(event.data?.amount) !== expected || event.data?.currency !== 'KES') {
          console.warn('Card charge amount mismatch — not crediting', {
            cardId, paid: event.data?.amount, expected,
          })
          return res.status(200).json({ recieved: true, ignored: 'amount-mismatch' })
        }
        await supabase.from('cards').update({ paid: true }).eq('id', cardId)
      } else {
        // Any OTHER charge event about one of our cards — wrong PIN,
        // cancelled, timeout — means this attempt did not succeed. The
        // polling client stops on this flag instead of waiting out 2 minutes.
        await supabase.from('cards').update({ payment_failed: true }).eq('id', cardId)
      }
      return res.status(200).json({ recieved: true })
    }

    // ── EVENTS ───────────────────────────────────────────────
    const eventId = meta.eventId
    if (!eventId) return res.status(200).json({ recieved: true })

    if (!isSuccess) {
      await supabase.from('events').update({ payment_failed: true }).eq('id', eventId)
      return res.status(200).json({ recieved: true })
    }

    const units = clampUnits(meta.units)
    const expected = units * EVENT_UNIT_PRICE_MINOR

    // GUARD 2 — pay.js computed the amount, but this is the first moment we
    // learn what was actually PAID. Verify rather than assume: metadata is
    // echoed back to us, so treating `units` as authority without checking it
    // against the money would make the whole server-side pricing pointless.
    if (Number(event.data?.amount) !== expected || event.data?.currency !== 'KES') {
      console.warn('Event charge amount mismatch — not crediting', {
        eventId, paid: event.data?.amount, expected, currency: event.data?.currency,
      })
      return res.status(200).json({ recieved: true, ignored: 'amount-mismatch' })
    }

    const reference = event.data?.reference
    if (!reference) return res.status(200).json({ recieved: true })

    /* GUARD 3 — idempotency, and the extension, in ONE call.
       apply_event_payment inserts the ledger row and extends paid_until
       inside a single transaction. Doing it as two round-trips from here
       would leave a real hole: if the extend failed after the ledger insert
       succeeded, the retry would see a duplicate reference, skip, and the
       event would stay a draft that has been paid for. */
    const { data: outcome, error } = await supabase.rpc('apply_event_payment', {
      p_event_id: eventId,
      p_reference: reference,
      p_units: units,
      p_amount: expected,
      p_days: UNIT_DAYS,
    })

    // Throw so Paystack retries — a DB blip should not cost someone their
    // event. The reference guard makes a retry safe by construction.
    if (error) throw new Error(error.message)

    return res.status(200).json({ recieved: true, outcome })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
