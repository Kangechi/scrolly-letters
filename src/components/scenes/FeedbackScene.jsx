/* ============================================================
   FEEDBACK SCENE — the closing scene of an event card.

   THIS SCENE IS TWO HALVES, AND THEY ARE NOW INDEPENDENT:

     ┌─ the ASK ──────────┐   stars + a textarea + "send to the team".
     │                    │   Writes to events_feedback. Optional.
     ├─ the CTA(s) ───────┤   one or more buttons out to a ticket page,
     └────────────────────┘   a cohort application, whatever. Optional.

   Both halves were always here — the CTA was just hardcoded to sit
   underneath the form. Making them independent is what lets one scene
   type serve two completely different endings:

     invite mode    ask: false  →  "Save your seat" + [Get your ticket]
     feedback mode  ask: true   →  "How was it?" + stars + [Send]

   WHY NOT A NEW `cta` SCENE TYPE? Because a new type has to be added to
   EVENT_SCENE_TYPES, to SCENE_MAP, and to the CHECK inside the
   update_event RPC — three places, one of which is a database migration.
   A boolean on a scene that already renders both halves costs none of
   that. Revisit if a host ever wants a CTA in the MIDDLE of a card,
   which is the thing this shape genuinely cannot do.

   THE PILOTS BOTH RUN WITH ask: false. Neither LinkedIn Local nor Demo
   Day wants a question before the event — they want a ticket sold.
   ============================================================ */

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { trackClick, CTA_IDS } from '../../lib/trackClick'

/* ── Reading the CTAs out of scene data ──────────────────────
   Events saved BEFORE this change have `cta: { label, href }`. Events
   saved after have `ctas: [{ id, label, href }]`. Both must render, because
   there is no migration that rewrites old sections JSONB — and there
   shouldn't be: a data migration that touches every host's copy to save a
   six-line function is a bad trade.

   Same column-first-then-baked-in-fallback shape parseEventForm already
   uses for ticket_url. */
function readCtas(data) {
  if (Array.isArray(data.ctas)) {
    return data.ctas.filter((c) => c && c.label)
  }
  if (data.cta && data.cta.label) {
    return [{ id: CTA_IDS.TICKET, label: data.cta.label, href: data.cta.href }]
  }
  return []
}

export default function FeedbackScene({ data, eventId: eventIdProp }) {
  /* The id comes from the route when nothing passes it in. Kept as a prop
     first so the create-page preview — which has no /event/:id URL to read —
     can render this scene without silently writing feedback to whatever the
     last path segment happens to be. */
  const eventId = eventIdProp || window.location.pathname.split('/').pop()

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('idle')

  /* `ask` defaults to TRUE when the key is absent. Every event saved before
     this change has no `ask` key and expects the form — defaulting to false
     would silently strip the feedback form off existing cards. New events
     set it explicitly. */
  const showAsk = data.ask !== false
  const ctas = readCtas(data)

  async function handleSubmit() {
    if (!rating && !comment.trim()) return
    setStatus('submitting')

    const { error } = await supabase.from('events_feedback').insert({
      event_id: eventId,
      rating: rating || null,
      comment: comment.trim() || null,
    })

    setStatus(error ? 'error' : 'done')
  }

  /* One renderer for the buttons, used by all three states below, so a CTA
     can never end up styled or tracked differently depending on which
     branch drew it. The FIRST button is solid and the rest are ghosts —
     that's how "buy a ticket" stays visually louder than "join the cohort"
     without either being hidden. */
  function renderCtas({ allGhost = false } = {}) {
    return ctas.map((cta, i) => (
      <a
        key={cta.id || i}
        className={`cta-button ${allGhost || i > 0 ? 'cta-button--ghost' : ''}`}
        href={cta.href || '#'}
        target="_blank"
        rel="noreferrer"
        /* No preventDefault, nothing awaited: the browser navigates on this
           click exactly as fast as it would with no handler at all. */
        onClick={() => trackClick(eventId, cta.id || CTA_IDS.TICKET)}
      >
        {cta.label}
      </a>
    ))
  }

  /* ── state: the guest already sent their feedback ────────── */
  if (status === 'done') {
    return (
      <div className="scene-card">
        <span className="scene-label">{data.doneLabel || 'The team got this'}</span>
        <p className="scene-sub">
          {data.doneText || 'Thank you, your feedback goes back to better the next events'}
        </p>
        {renderCtas()}
      </div>
    )
  }

  /* ── state: invite mode — no ask, just the way in ─────────
     Note what is NOT here: no stars, no textarea, no submit button, and no
     events_feedback write. A card ending in a ticket does not open a
     feedback channel the host isn't reading. */
  if (!showAsk) {
    return (
      <div className="scene-card">
        <span className="scene-label">{data.label || 'Save your seat'}</span>
        {data.prompt && <p className="scene-sub">{data.prompt}</p>}
        {renderCtas()}
      </div>
    )
  }

  /* ── state: feedback mode — the original scene ───────────── */
  return (
    <div className="scene-card">
      <span className="scene-label">{data.label || 'Tell the team'}</span>
      <p className="scene-sub">{data.prompt || 'How was it? Your feedback goes to the host'}</p>

      <div className="rating-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`rating-star ${n <= rating ? 'rating-star--on' : ''}`}
            onClick={() => setRating(n)}
            aria-label={`Rate ${n} out of 5`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        className="create-input"
        rows={4}
        placeholder={data.placeholder || 'Share a thought about the event'}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      {status === 'error' && (
        <p style={{ color: '#f87171', fontSize: '0.85rem' }}>Could not send. Please try again</p>
      )}

      <button className="cta-button" onClick={handleSubmit} disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending' : data.submitLabel || 'Send to the team'}
      </button>

      {/* Ghost styling for every CTA here: the submit button above is the
          primary action in feedback mode, so a solid ticket button would
          compete with it. */}
      {renderCtas({ allGhost: true })}
    </div>
  )
}
