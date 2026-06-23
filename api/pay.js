import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {

  // Only accept POST requests — anything else gets rejected immediately
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, cardId } = req.body

  if (!phone || !cardId) {
    return res.status(400).json({ error: 'phone and cardId are required' })
  }

  try {

    // ─── STEP 1: Get OAuth token from Safaricom ───────────────────────────────
    // Safaricom requires HTTP Basic Auth to issue a token.
    // Format: base64("ConsumerKey:ConsumerSecret")
    // Buffer is a Node.js global — it handles binary/encoding operations.
    // .toString('base64') converts the combined string into base64 encoding.

    const auth = Buffer.from(
      `${process.env.DARAJA_CONSUMER_KEY}:${process.env.DARAJA_CONSUMER_SECRET}`
    ).toString('base64')

    const tokenRes = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    )
    const { access_token } = await tokenRes.json()

    if (!access_token) {
      return res.status(500).json({ error: 'Failed to get Safaricom token' })
    }

    // ─── STEP 2: Format the phone number ─────────────────────────────────────
    // Safaricom requires 254XXXXXXXXX (Kenya country code, no +, no leading 0)
    // Examples: 0712345678 → 254712345678 | +254712345678 → 254712345678
    // .replace(/\D/g, '') strips every non-digit character (spaces, dashes, +)

    function formatPhone(raw) {
      const cleaned = raw.replace(/\D/g, '')
      if (cleaned.startsWith('254')) return cleaned
      if (cleaned.startsWith('0')) return '254' + cleaned.slice(1)
      return '254' + cleaned
    }

    // ─── STEP 3: Build timestamp + password ──────────────────────────────────
    // Safaricom requires every STK Push request to include:
    //   Timestamp: current time as YYYYMMDDHHmmss (14 digits, no separators)
    //   Password:  base64(ShortCode + Passkey + Timestamp)
    //
    // new Date().toISOString() gives "2025-06-20T14:30:00.000Z"
    // .replace(/[-T:.Z]/g, '') strips the -  T  :  .  Z characters
    // leaving "20250620143000000" — .slice(0, 14) trims to exactly 14 digits

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14)

    const password = Buffer.from(
      `${process.env.DARAJA_SHORTCODE}${process.env.DARAJA_PASSKEY}${timestamp}`
    ).toString('base64')

    // ─── STEP 4: Fire the STK Push ────────────────────────────────────────────
    // This is the call that sends a USSD prompt to the user's phone.
    // Safaricom returns a CheckoutRequestID — their internal reference for this payment.
    // TransactionType 'CustomerPayBillOnline' = Paybill payment
    // PartyA = the customer's number (who is paying)
    // PartyB = your business short code (who receives the money)
    // CallBackURL = where Safaricom sends the result after the user pays (or cancels)
    // AccountReference = any string you want — we use cardId to track which card

    const stkRes = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          BusinessShortCode: process.env.DARAJA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: 15,
          PartyA: formatPhone(phone),
          PartyB: process.env.DARAJA_SHORTCODE,
          PhoneNumber: formatPhone(phone),
          CallBackURL: process.env.DARAJA_CALLBACK_URL,
          AccountReference: cardId,
          TransactionDesc: 'Scrolly Letters sharing fee'
        })
      }
    )

    const stkData = await stkRes.json()

    // ResponseCode '0' means Safaricom accepted the request and sent the USSD prompt.
    // Any other code means something went wrong before the user even saw a prompt.
    if (stkData.ResponseCode !== '0') {
      return res.status(400).json({ error: stkData.ResponseDescription || 'STK Push failed' })
    }

    // ─── STEP 5: Save the mapping to Supabase ────────────────────────────────
    // We now know CheckoutRequestID ("ws_CO_123") belongs to cardId ("xK9p2a").
    // We record this BEFORE the user pays, so when Safaricom's callback arrives
    // with "ws_CO_123 was paid", we can look up which card to unlock.
    // Without this record, the callback is useless — we'd have no way to connect
    // a payment to a card.
    //
    // Note: We use SUPABASE_SERVICE_ROLE_KEY here (not VITE_SUPABASE_ANON_KEY).
    // The service role key bypasses all RLS policies — the server can write freely.
    // process.env works here because this is Node.js server code, not browser code.
    // VITE_ prefix has no special meaning in Node — it's just a regular env var name.

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { error: dbError } = await supabase.from('payments').insert({
      card_id: cardId,
      checkout_request_id: stkData.CheckoutRequestID,
      status: 'pending'
    })

    if (dbError) {
      return res.status(500).json({ error: 'Database error: ' + dbError.message })
    }

    // Return the CheckoutRequestID to the browser so it knows what payment to track
    return res.status(200).json({
      checkoutRequestId: stkData.CheckoutRequestID
    })

  } catch (err) {
    // Catch any unexpected error (network failure, Safaricom down, etc.)
    // Without this, an unhandled error would crash the function with no useful response
    return res.status(500).json({ error: err.message })
  }
}
