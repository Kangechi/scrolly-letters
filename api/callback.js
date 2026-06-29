import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Method is not allowed'})
    }

    try {
        const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex')

        if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).json({error: 'Invalid Signature'})
    }

    const event = req.body

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