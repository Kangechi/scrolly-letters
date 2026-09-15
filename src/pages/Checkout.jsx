import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { priceForCard } from '../lib/pricing'
import { usePayment } from '../lib/usePayment'
import CreatePreview from '../components/CreatePreview'
import { toLocalInput, formatOpensAt } from '../lib/opensAt'

/* ============================================================
   CHECKOUT — /card/:id/checkout. The sender's last stop.
   Preview on the LEFT (what you're paying for), pay on the RIGHT.

   Everything here is read from the saved row by id, so a refresh, a back
   button or a second tab all land in the right state. The page never holds
   the price as its own number — it asks priceForCard(row), the same
   function pay.js charges with. Display and charge cannot disagree.

   Once paid, the right-hand panel becomes the Send panel.
   ============================================================ */

export default function Checkout() {
  const { id } = useParams()
  const payment = usePayment(id)
  const paid = payment.step === 'paid'

  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [scheduled, setScheduled] = useState(false)
  const [opensAtLocal, setOpensAtLocal] = useState('')
  const [formError, setFormError] = useState(null)
  const [copied, setCopied] = useState(false)
  // Computed once, not every render — the earliest time the picker offers.
  const [minLocal] = useState(() => toLocalInput(new Date()))

  // Load the row. Re-read when payment lands, so the Send panel shows the
  // opens_at the SERVER saved — not what this tab happened to type.
  useEffect(() => {
    let cancelled = false
    supabase.from('cards').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setCard(data)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [id, paid])

  if (loading) {
    return <div className="landing"><p className="landing-sub">Loading your card…</p></div>
  }

  if (!card) {
    return (
      <div className="landing">
        <div className="landing-inner">
          <span className="landing-emoji">🫤</span>
          <h2 className="landing-title">Card not found</h2>
          <p className="landing-sub">This checkout link doesn’t lead anywhere.</p>
          <Link to="/create" className="cta-button">Make a card →</Link>
        </div>
      </div>
    )
  }

  const priceKes = priceForCard(card) / 100
  const cardUrl = `${window.location.origin}/card/${id}`
  const busy = payment.step === 'sending' || payment.step === 'waiting'
  const isWishlist = card.sections?.some((s) => s.type === 'wishlist')
  const occasion = card.occasion?.toLowerCase() || 'little'

  function handlePay() {
    if (scheduled && !opensAtLocal) {
      setFormError('Pick when the card should open — or untick “Schedule it”.')
      return
    }
    setFormError(null)
    // The browser reads "2026-09-20T18:30" in the SENDER's timezone and turns
    // it into one absolute instant. The server never has to guess a zone.
    const opensAt = scheduled ? new Date(opensAtLocal).toISOString() : null
    payment.pay(phone, { opensAt })
  }

  function handleCopy() {
    navigator.clipboard.writeText(cardUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp() {
    const when = card.opens_at ? ` It opens ${formatOpensAt(card.opens_at)}.` : ''
    const opener = isWishlist
      ? `${card.recipient || 'Someone'} shared their ${occasion} wishlist 🎁`
      : 'Someone made you a scrolly letter 💌'
    const message = `${opener}${when}\n${cardUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`)
  }

  return (
    <div className={`create-layout checkout-layout theme-${card.theme}`}>
      {/* LEFT — exactly what the recipient will scroll through */}
      <div>
        <CreatePreview
          sections={card.sections}
          theme={card.theme}
          emoji={card.emoji}
          style={card.style}
          overrides={card.style_overrides}
          design={card.design}
          colors={card.accent ? { accent: card.accent, accent_2: card.accent_2, bg: card.bg } : null}
        />
      </div>

      {/* RIGHT — pay, then send */}
      <div className="scene-card create-card checkout-pay">
        <h1 className="scene-headline">{paid ? 'Send it 💌' : 'Checkout'}</h1>
        <p className="scene-sub">
          {isWishlist
            ? <>A {occasion} wishlist from {card.recipient || 'you'}</>
            : <>A {occasion} card for {card.recipient || 'someone special'}</>}
        </p>

        {payment.step === 'checking' && <p className="scene-sub">One moment…</p>}

        {/* ── PAY: idle, or retrying after a failure ── */}
        {(payment.step === 'idle' || payment.step === 'failed') && (
          <>
            <p className="checkout-price">KES {priceKes}</p>

            <label className="checkout-schedule">
              <input
                type="checkbox"
                checked={scheduled}
                onChange={(e) => setScheduled(e.target.checked)}
              />
              Schedule it — keep the card locked until a date
            </label>
            {scheduled && (
              <input
                className="create-input"
                type="datetime-local"
                min={minLocal}
                value={opensAtLocal}
                onChange={(e) => setOpensAtLocal(e.target.value)}
              />
            )}

            <label className="scene-label">M-Pesa number</label>
            <input
              className="create-input"
              type="tel"
              placeholder="e.g. 0712 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            {(formError || payment.error) && (
              <p className="create-error">{formError || payment.error}</p>
            )}

            <button className="cta-button" onClick={handlePay} disabled={busy}>
              {payment.step === 'failed' ? 'Try again' : `Pay KES ${priceKes} via M-Pesa`}
            </button>
          </>
        )}

        {/* ── SENDING: before we know the STK push went out ── */}
        {payment.step === 'sending' && (
          <>
            <p className="scene-label">Starting payment…</p>
            <p className="scene-sub">Sending a payment request to {phone}. This can take up to 15 seconds.</p>
            <div className="payment-spinner" />
          </>
        )}

        {/* ── WAITING: the prompt is on their phone ── */}
        {payment.step === 'waiting' && (
          <>
            <p className="scene-label">Check your phone 📱</p>
            <p className="scene-sub">An M-Pesa prompt was sent to {phone}. Enter your PIN to finish.</p>
            <div className="payment-spinner" />
            <p className="scene-sub" style={{ fontSize: '0.8rem', opacity: 0.6 }}>
              Waiting for confirmation… {Math.floor(payment.secondsLeft / 60)}:
              {String(payment.secondsLeft % 60).padStart(2, '0')} left
            </p>
          </>
        )}

        {/* ── PAID: the Send panel ── */}
        {paid && (
          <>
            <p className="scene-label">Paid ✅ — your card is ready</p>
            <p className="scene-sub">
              {card.opens_at
                ? <>It stays locked until <strong>{formatOpensAt(card.opens_at)}</strong>. Send the link whenever you like.</>
                : 'It opens the moment they tap the link.'}
            </p>
            <input
              className="create-input"
              readOnly
              value={cardUrl}
              onFocus={(e) => e.target.select()}
            />
            <button className="cta-button" onClick={handleWhatsApp}>Share on WhatsApp 💬</button>
            <button className="cta-button cta-button--ghost" onClick={handleCopy}>
              {copied ? 'Copied! ✓' : 'Copy link'}
            </button>
            <Link to={`/card/${id}`} className="checkout-view-link">Open the card →</Link>
          </>
        )}
      </div>
    </div>
  )
}
