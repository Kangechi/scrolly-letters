

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Method not allowed'})
    }

    const {phone,  cardId} = req.body
    
    if (!phone || !cardId) {
        return res.status(400).json({error: 'phone and cardId are required'})

    }
    //Paystack needs the +254 format of the phone number hence a function
    function formatPhone(raw) {
        let cleaned = raw.replace(/\D/g, '')
        if (cleaned.startsWith('0'))   cleaned = '254' + cleaned.slice(1) // 0725942987   → 254725942987
        if (!cleaned.startsWith('254')) cleaned = '254' + cleaned          // 725942987    → 254725942987
        return '+' + cleaned                                              // → +254725942987 (E.164)
    }

    try {
        const charge = await fetch('https://api.paystack.co/charge', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email:  `${cardId}@scrolly-letters.app`, 
                amount: 2000,
                currency: 'KES',
                mobile_money: {
                    phone: formatPhone(phone),
                    provider: 'mpesa'
                },
                metadata: {cardId}
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