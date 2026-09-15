/* ============================================================
   TICKET CHECKOUT — the gate between the invite and the card.

   THE FLOW THIS BELONGS TO:
     /card/:id           landing — "You're invited", countdown, [Get your seat]
        ↓ (event has ticket_gate = true and this device has no ticket)
     /card/:id/ticket    THIS PAGE — the ticket, then pay
        ↓ (granted)
     /card/:id           scenes: who's pitching, why not to miss it, details

   ⚠ THIS CHECKOUT IS SIMULATED, AND IT SAYS SO ON THE PAGE.
   No card details are collected — there are no inputs on this page at all.
   No money moves. Nothing is sent to Paystack. The Pay button waits a beat
   and grants a local flag.

   That is a deliberate design constraint, not a shortcut left half-done: a
   page that LOOKS like a real checkout and asks for real card numbers while
   doing nothing with them is the single most harmful thing this repo could
   ship. If you wire real payments later, replace this file wholesale with a
   Paystack redirect — do not "upgrade" it by adding card fields here.

   WHOSE MONEY IS THIS ANYWAY:
   This is a GUEST paying a HOST for a seat. It is not the host paying us
   for the card — that is EVENT_UNIT_PRICE_KES in src/lib/pricing.js and it
   travels a completely different path. Do not import pricing.js here. The
   ticket price belongs to the event, because the host sets it and the money
   is theirs.
   ============================================================ */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AmbientBackground from '../components/AmbientBackground'
import { grantTicket, hasTicket, simulatedReference } from '../lib/ticketAccess'
import { trackClick, CTA_IDS } from '../lib/trackClick'

/* How long the simulated charge "takes". Long enough to read as work being
   done, short enough that nobody taps the button twice. Real Paystack
   redirects feel like this. */
const SIMULATED_DELAY_MS = 1600

export default function TicketCheckout() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('idle') // idle | paying | done

  useEffect(() => {
    let cancelled = false

    /* Already been through this on this device? Don't make them do it
       twice — send them straight in. This is the same check CardPage runs,
       repeated here because this URL is shareable and someone will
       eventually land on it directly. */
    if (hasTicket(id)) {
      navigate(`/card/${id}`, { replace: true, state: { ticketGranted: true } })
      return
    }

    /* RLS already restricts `events` to paid AND unexpired, so a row coming
       back is live by definition — the same reasoning CardPage relies on. */
    supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setEvent(data ?? null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, navigate])

  /* The event's own colours, exactly as CardPage applies them, so the
     checkout doesn't feel like a different product wearing the same URL. */
  const brandStyle = event?.accent
    ? { '--accent': event.accent, '--accent-2': event.accent_2, '--bg': event.bg }
    : undefined

  function handlePay() {
    if (status !== 'idle') return
    setStatus('paying')

    /* Counted before the wait, not after: this is the moment the guest chose
       to buy, and it is the number the host actually asked for. Fire and
       forget — see trackClick.js for why nothing here is awaited. */
    trackClick(id, CTA_IDS.TICKET)

    setTimeout(() => {
      const reference = simulatedReference()
      grantTicket(id, { reference })
      setStatus('done')

      /* replace: true so the browser's Back button returns to the invite,
         not to a checkout for a ticket they now hold. */
      navigate(`/card/${id}`, { replace: true, state: { ticketGranted: true } })
    }, SIMULATED_DELAY_MS)
  }

  if (loading) {
    return (
      <div className="landing">
        <p className="landing-sub">Loading…</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="landing">
        <div className="landing-inner">
          <span className="landing-emoji">🫤</span>
          <h2 className="landing-title">Ticket not found</h2>
          <p className="landing-sub">This link doesn’t lead anywhere — check it and try again.</p>
        </div>
      </div>
    )
  }

  /* A null price is a real state, not missing data: plenty of events are free
     to attend, and the gate still has a job to do for them — it makes the
     guest commit before the card opens. */
  const price = Number.isFinite(event.ticket_price) ? event.ticket_price : null
  const isFree = price === null || price === 0

  return (
    <div className="landing checkout" style={brandStyle}>
      <AmbientBackground emoji={event.emoji} />

      <div className="landing-inner checkout-inner">
        {/* Said before anything else on the page, and never removed. */}
        <p className="checkout-sim">Demo checkout · no money moves, no card details asked for</p>

        <div className="checkout-card">
          <span className="checkout-host">{event.host || 'Your invitation'}</span>
          <h2 className="checkout-title">{event.landing_title || 'You’re invited'}</h2>
          {event.landing_sub && <p className="checkout-sub">{event.landing_sub}</p>}

          <div className="checkout-line">
            <span className="checkout-line-label">1 × {isFree ? 'seat' : 'ticket'}</span>
            <span className="checkout-line-value">
              {isFree ? 'Free' : `KES ${price.toLocaleString()}`}
            </span>
          </div>

          <div className="checkout-line checkout-line--total">
            <span className="checkout-line-label">Total</span>
            <span className="checkout-line-value">
              {isFree ? 'Free' : `KES ${price.toLocaleString()}`}
            </span>
          </div>

          <button className="cta-button checkout-pay" onClick={handlePay} disabled={status !== 'idle'}>
            {status === 'idle' && (isFree ? 'Reserve my seat' : `Pay KES ${price.toLocaleString()}`)}
            {status === 'paying' && 'Processing…'}
            {status === 'done' && 'Done ✓'}
          </button>

          <p className="checkout-fine">
            {event.ticket_url
              ? 'Tickets are handled by the organiser. In the live version this button opens their ticket page.'
              : 'In the live version this button opens the organiser’s ticket page.'}
          </p>
        </div>

        {/* No "skip" link, by design: the gate is the point. The way back is
            the browser's own Back button, which returns to the invite. */}
      </div>
    </div>
  )
}
