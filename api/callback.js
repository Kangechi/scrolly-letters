import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto'

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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Method is not allowed'})
    }

    try {
        const rawBody = await getRawBody(req)

        const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(rawBody)
        .digest('hex')

        if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).json({error: 'Invalid Signature'})
    }

    const event = JSON.parse(rawBody)

    // TEMP diagnostic — tells us the real event name Paystack sends for a
    // cancelled/declined charge, so we can add a matching failure branch
    // below instead of guessing. Safe to remove once we've captured it.
    console.log('Paystack webhook event:', event.event)

    if (event.event === 'charge.success') {
        const cardId = event.data?.metadata?.cardId

        if (cardId) {
            const supabase = createClient(
                process.env.VITE_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            )
            await supabase
            .from('cards')
            .update({paid: true})
            .eq('id', cardId)
        }
    }
    return res.status(200).json({recieved: true})

    } catch (err) {
        return res.status(500).json({error: err.message})
    }
    
}
