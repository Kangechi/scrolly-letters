import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {

  // Safaricom sends POST requests to this URL after the user responds to the USSD prompt.
  // This is called a "webhook" or "callback" — Safaricom calls YOU, not the other way around.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {

    // ─── STEP 1: Read Safaricom's callback body ───────────────────────────────
    // Safaricom sends the result nested inside Body.stkCallback.
    // This is their fixed format — every STK Push result looks like this:
    //
    // {
    //   "Body": {
    //     "stkCallback": {
    //       "MerchantRequestID": "...",
    //       "CheckoutRequestID": "ws_CO_123",
    //       "ResultCode": 0,           ← 0 = success, anything else = failure/cancel
    //       "ResultDesc": "The service request is processed successfully."
    //     }
    //   }
    // }
    //
    // The ?. (optional chaining) safely accesses nested properties.
    // If req.body is undefined or Body doesn't exist, callback becomes undefined
    // instead of throwing a TypeError crash.

    const callback = req.body?.Body?.stkCallback

    if (!callback) {
      return res.status(400).json({ error: 'Invalid callback body' })
    }

    const { CheckoutRequestID, ResultCode } = callback

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // ─── STEP 2: Handle failed/cancelled payments ─────────────────────────────
    // ResultCode 0 = success. Anything else = the user cancelled, entered wrong PIN,
    // had insufficient funds, or the request timed out.
    // We record the failure but DON'T unlock the card.

    if (ResultCode !== 0) {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('checkout_request_id', CheckoutRequestID)

      // We still return 200 to Safaricom — they expect 200 to confirm we received the callback.
      // Returning 4xx/5xx would make Safaricom retry sending the callback repeatedly.
      return res.status(200).json({ message: 'Payment failure recorded' })
    }

    // ─── STEP 3: Look up which card this payment belongs to ───────────────────
    // Safaricom only tells us CheckoutRequestID — not the cardId.
    // We stored the mapping in the payments table when the STK Push was initiated (api/pay.js).
    // Now we retrieve it: "which card was being paid for with this CheckoutRequestID?"

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('card_id')
      .eq('checkout_request_id', CheckoutRequestID)
      .single()

    if (paymentError || !payment) {
      return res.status(200).json({ message: 'Payment record not found — possibly duplicate callback' })
    }

    // ─── STEP 4: Mark the payment as confirmed ────────────────────────────────
    await supabase
      .from('payments')
      .update({ status: 'confirmed' })
      .eq('checkout_request_id', CheckoutRequestID)

    // ─── STEP 5: Unlock the card ──────────────────────────────────────────────
    // This is the moment everything leads to.
    // Setting paid = true on the card is what the browser's polling will detect.
    // Once the browser sees paid = true, the share options unlock.

    const { error: cardError } = await supabase
      .from('cards')
      .update({ paid: true })
      .eq('id', payment.card_id)

    if (cardError) {
      return res.status(500).json({ error: 'Failed to update card: ' + cardError.message })
    }

    // Always return 200 to Safaricom — confirms we handled the callback successfully
    return res.status(200).json({ message: 'Card unlocked successfully' })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
