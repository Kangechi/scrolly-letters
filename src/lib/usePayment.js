import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const TIMEOUT_S = 120

/* One variable drives the whole checkout:
     checking → idle → sending → waiting → paid
                  ↖──────── failed ←───────┘          */
export function usePayment(cardId) {
  const [step, setStep] = useState('checking')
  const [error, setError] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_S)

  // 1 · Is it already paid? (refresh, back button, a second tab)
  useEffect(() => {
    if (!cardId) return
    let cancelled = false
    supabase.from('cards').select('paid').eq('id', cardId).maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setStep(data?.paid ? 'paid' : 'idle')
      })
    return () => { cancelled = true }
  }, [cardId])

  // 2 · While waiting: poll, tick the countdown, give up at zero
  useEffect(() => {
    if (step !== 'waiting') return

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('cards').select('paid, payment_failed').eq('id', cardId).maybeSingle()
      if (data?.paid) setStep('paid')
      else if (data?.payment_failed) {
        setError('Payment was not completed. Please try again.')
        setStep('failed')
      }
    }, 1500)

    const tick = setInterval(() => setSecondsLeft((s) => Math.max(s - 1, 0)), 1000)

    const giveUp = setTimeout(() => {
      setError('Payment timed out. Please try again.')
      setStep('failed')
    }, TIMEOUT_S * 1000)

    // Cleanup runs the moment `step` stops being 'waiting' — this is what
    // stops the polling. No step change, no cleanup; no cleanup, a leak.
    return () => {
      clearInterval(poll)
      clearInterval(tick)
      clearTimeout(giveUp)
    }
  }, [step, cardId])

  // 3 · Start a charge. `extra` carries opensAt — never an amount.
  async function pay(phone, extra = {}) {
    if (!phone.trim()) {
      setError('Please enter your M-Pesa number')
      return
    }
    setError(null)
    setStep('sending')
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, cardId, ...extra }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Something went wrong')
        setStep('failed')
        return
      }
      setSecondsLeft(TIMEOUT_S)   // reset HERE, not inside the effect
      setStep('waiting')
    } catch {
      setError('Network error. Please try again.')
      setStep('failed')
    }
  }

  return { step, error, secondsLeft, pay }
}