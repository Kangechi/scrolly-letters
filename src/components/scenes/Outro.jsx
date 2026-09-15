import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { CARD_PRICE_KES } from '../../lib/pricing'
import ArrivalLines from '../arrivals/ArrivalLines'
import Signature from '../shapes/Signature'

/* Two generations of card pass through here:
     LEGACY  (requires_payment false) — the sender pays HERE to unlock sharing,
             exactly as before. Untouched.
     NEW     (requires_payment true)  — already paid at /card/:id/checkout, so
             whoever reaches this scene is the RECIPIENT. Offering them a pay
             button would be wrong; offering them "make your own" is the
             recipient → creator loop the tracker says is unmeasured.
   The pay modal below only ever runs for legacy cards, whose price is always
   the plain-card price. */
export default function Outro({ data, isPreview, card, arrival = null, play = true, shape = null }) {
  const newFlow = card?.requires_payment === true
  // One variable drives the whole modal: idle → phone → waiting → paid (or failed)
  const [paymentStep, setPaymentStep] = useState('idle')
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(120)

  // Get the cardId from the URL: /card/xK9p2a → "xK9p2a"
  const cardId = window.location.pathname.split('/').pop()

  // ── 1. ALREADY-PAID CHECK ──────────────────────────────────
  // Just remembers the fact — does NOT open the modal. Every scene
  // mounts immediately on page load (scroll-reveal only fades them
  // visually), so touching paymentStep here would pop the modal open
  // before the reader has scrolled anywhere near the end.
  useEffect(() => {
    if (isPreview || newFlow) return
    supabase
      .from('cards')
      .select('paid')
      .eq('id', cardId)
      .single()
      .then(({ data: card }) => {
        if (card?.paid) setAlreadyPaid(true)
      })
  }, [isPreview, newFlow, cardId])

  // ── 2. POLLING ─────────────────────────────────────────────
  // While waiting, ask Supabase every 2s "is this card paid yet?"
  // The webhook (callback.js) sets paid=true once Paystack confirms.
  useEffect(() => {
    if (paymentStep !== 'waiting') return

    const interval = setInterval(() => {
      supabase
        .from('cards')
        .select('paid, payment_failed')
        .eq('id', cardId)
        .single()
        .then(({ data: card }) => {
          if (card?.paid) {
            setPaymentStep('paid')
            clearInterval(interval)
          } else if (card?.payment_failed) {
            // webhook confirmed this attempt failed — no need to wait out
            // the full timeout, we already know the answer
            setPaymentStep('failed')
            setError('Payment was not completed. Please try again.')
            clearInterval(interval)
          }
        })
    }, 1000)

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

  // ── 2b. COUNTDOWN — purely visual, ticks alongside the polling above so
  // the reader can see how long they actually have left before timeout.
  useEffect(() => {
    if (paymentStep !== 'waiting') return
    setSecondsLeft(120)

    const tick = setInterval(() => {
      setSecondsLeft((s) => Math.max(s - 1, 0))
    }, 1000)

    return () => clearInterval(tick)
  }, [paymentStep])

  // ── 3. START PAYMENT ───────────────────────────────────────
  async function handlePay() {
    if (!phone.trim()) {
      setError('Please enter your M-Pesa number')
      return
    }
    setError(null)
    setPaymentStep('sending')   // ← no countdown yet, we haven't sent the STK push

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
        return
      }
      // Paystack confirmed the push was sent — THIS is when the real wait starts
      setPaymentStep('waiting')
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
      {/* Shape: a handwritten sign-off instead of the stacked headline.
          The buttons below are the same either way. */}
      {shape === 'signature' ? (
        <Signature pre={data.sub} line={data.line} arrival={arrival} play={play} />
      ) : (
        <>
          <span className="scene-label">{data.sub}</span>
          <span className="scene-label">{data.text}</span>
          <h1 className="scene-headline stacked">
            <ArrivalLines fx={arrival} play={play} lines={data.line.split(' ')} lineClassName="stack-word" />
          </h1>
        </>
      )}

      {!isPreview && !newFlow && (
        <button className="cta-button" onClick={() => setPaymentStep(alreadyPaid ? 'paid' : 'phone')}>
          Share this card ✨
        </button>
      )}

      {!isPreview && newFlow && (
        <Link
          to={card?.sections?.some((s) => s.type === 'wishlist') ? '/wishlist' : '/create'}
          className="cta-button cta-button--ghost"
        >
          Make one of your own ✨
        </Link>
      )}

      {!isPreview && paymentStep !== 'idle' && (
        <div
          className="share-backdrop"
          onClick={() => { if (paymentStep !== 'waiting' && paymentStep !== 'sending') setPaymentStep('idle') }}
        >
          <div className="share-modal" onClick={e => e.stopPropagation()}>

            {paymentStep !== 'waiting' && paymentStep !== 'sending' && (
              <button className="share-modal-close" onClick={() => setPaymentStep('idle')}>✕</button>
            )}

            {/* STEP: enter phone */}
            {paymentStep === 'phone' && (
              <>
                <p className="scene-label">Share this card</p>
                <p className="scene-sub" style={{ marginBottom: '1rem' }}>
                  A one-time fee of KES {CARD_PRICE_KES} unlocks sharing
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
                  Pay KES {CARD_PRICE_KES} via M-Pesa
                </button>
              </>
            )}

            {/* STEP: sending — before we know the STK push actually went out */}
            {paymentStep === 'sending' && (
              <>
                <p className="scene-label">Starting payment…</p>
                <p className="scene-sub">
                  Sending a payment request for {phone}. This can take up to 15 seconds.
                </p>
                <div className="payment-spinner" />
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
                  Waiting for confirmation… {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} left
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
