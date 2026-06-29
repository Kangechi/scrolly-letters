import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Outro({ data, isPreview }) {
  // One variable drives the whole modal: idle → phone → waiting → paid (or failed)
  const [paymentStep, setPaymentStep] = useState('idle')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  // Get the cardId from the URL: /card/xK9p2a → "xK9p2a"
  const cardId = window.location.pathname.split('/').pop()

  // ── 1. ALREADY-PAID CHECK ──────────────────────────────────
  // If this card was paid for already, skip straight to share options.
  useEffect(() => {
    if (isPreview) return
    supabase
      .from('cards')
      .select('paid')
      .eq('id', cardId)
      .single()
      .then(({ data: card }) => {
        if (card?.paid) setPaymentStep('paid')
      })
  }, [isPreview, cardId])

  // ── 2. POLLING ─────────────────────────────────────────────
  // While waiting, ask Supabase every 2s "is this card paid yet?"
  // The webhook (callback.js) sets paid=true once Paystack confirms.
  useEffect(() => {
    if (paymentStep !== 'waiting') return

    const interval = setInterval(() => {
      supabase
        .from('cards')
        .select('paid')
        .eq('id', cardId)
        .single()
        .then(({ data: card }) => {
          if (card?.paid) {
            setPaymentStep('paid')
            clearInterval(interval)
          }
        })
    }, 2000)

    // Give up after 2 minutes so the user isn't stuck on a spinner
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setPaymentStep('failed')
      setError('Payment timed out. Please try again.')
    }, 120000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [paymentStep, cardId])

  // ── 3. START PAYMENT ───────────────────────────────────────
  async function handlePay() {
    if (!phone.trim()) {
      setError('Please enter your M-Pesa number')
      return
    }
    setError(null)
    setPaymentStep('waiting')

    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, cardId })
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Something went wrong')
        setPaymentStep('phone')
      }
      // on success we stay in 'waiting' — polling takes over
    } catch (err) {
      setError('Network error. Please try again.')
      setPaymentStep('phone')
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp() {
    const message = `Someone made you a scrolly letter 💌\n${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`)
  }

  return (
    <div className="scene-card">
      <h2 className="scene-label">{data.sub}</h2>
      <h5 className="scene-label">{data.text}</h5>
      <p className="scene-text">{data.line}</p>

      {!isPreview && (
        <button className="cta-button" onClick={() => setPaymentStep('phone')}>
          Share this card ✨
        </button>
      )}

      {!isPreview && paymentStep !== 'idle' && (
        <div
          className="share-backdrop"
          onClick={() => { if (paymentStep !== 'waiting') setPaymentStep('idle') }}
        >
          <div className="share-modal" onClick={e => e.stopPropagation()}>

            {paymentStep !== 'waiting' && (
              <button className="share-modal-close" onClick={() => setPaymentStep('idle')}>✕</button>
            )}

            {/* STEP: enter phone */}
            {paymentStep === 'phone' && (
              <>
                <p className="scene-label">Share this card</p>
                <p className="scene-sub" style={{ marginBottom: '1rem' }}>
                  A one-time fee of KES 20 unlocks sharing
                </p>
                <input
                  className="create-input"
                  type="tel"
                  placeholder="M-Pesa number e.g. 0712 345 678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
                {error && <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>}
                <button className="cta-button" onClick={handlePay}>
                  Pay KES 20 via M-Pesa
                </button>
              </>
            )}

            {/* STEP: waiting for payment */}
            {paymentStep === 'waiting' && (
              <>
                <p className="scene-label">Check your phone 📱</p>
                <p className="scene-sub">
                  An M-Pesa prompt was sent to {phone}. Enter your PIN to complete payment.
                </p>
                <div className="payment-spinner" />
                <p className="scene-sub" style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                  Waiting for confirmation…
                </p>
              </>
            )}

            {/* STEP: paid — share unlocked */}
            {paymentStep === 'paid' && (
              <>
                <p className="scene-label">Payment confirmed ✅</p>
                <p className="scene-sub" style={{ marginBottom: '1.5rem' }}>
                  Choose how you'd like to share your card
                </p>
                <button className="cta-button" onClick={handleWhatsApp}>
                  Share on WhatsApp 💬
                </button>
                <button className="cta-button cta-button--ghost" onClick={handleCopy}>
                  {copied ? 'Copied! ✓' : 'Copy link'}
                </button>
              </>
            )}

            {/* STEP: failed */}
            {paymentStep === 'failed' && (
              <>
                <p className="scene-label">Payment unsuccessful</p>
                <p className="scene-sub" style={{ marginBottom: '1.5rem' }}>
                  {error || 'Something went wrong. Please try again.'}
                </p>
                <button className="cta-button" onClick={() => { setError(null); setPaymentStep('phone') }}>
                  Try again
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
