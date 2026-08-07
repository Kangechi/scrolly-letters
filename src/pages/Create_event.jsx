import { useState, useReducer } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase'
import {
  EVENT_EMOJIS,
  EMPTY_EVENT_FORM,
  buildEventSections,
  formToColumns,
} from '../lib/eventSections'

/* ============================================================
   CREATE EVENT — self-serve event builder.
   Flow: fill form → assemble scenes → pay KES 200 / 14 days → publish.
   Storage: the Supabase `events` table (NOT the local bundle — that
   holds only the two demo events). Two capabilities per event:
     • id        (nanoid 6)  → public invite URL
     • manage_id (nanoid 21) → secret edit + feedback URL

   The form shape, the scene builder and the column mapping all now live in
   `lib/eventSections.js` — because the MANAGE page needs the exact same
   three, and a second copy of them is how `ticket_url` and the CTA baked
   into `sections` drifted apart in the first place.
   ============================================================ */

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

export default function CreateEvent() {
  const [state, dispatch] = useReducer(reducer, EMPTY_EVENT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const sections = buildEventSections(state)

  function setField(field, value) {
    dispatch({ type: 'SET_FIELD', field, value })
  }
  // event-handler factory: bind('host') === (e) => setField('host', e.target.value)
  const bind = (field) => (e) => setField(field, e.target.value)

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)

    const id = nanoid(6)          // public invite URL
    const manage_id = nanoid(21)  // secret manage URL

    const { error } = await supabase.from('events').insert({
      id,
      manage_id,
      ...formToColumns(state),
      sections,
      // `paid` stays false (DB default). Only the Paystack webhook flips it.
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    /* Straight to the host's page instead of showing two raw URLs.
       The old panel handed over an invite link that CANNOT work yet — RLS
       hides an unpaid draft — so the first thing a host did was click a
       dead link. Now they land on the thing they actually need next:
       preview → edit → pay to publish. */
    navigate(`/manage/${manage_id}`, { replace: true })
  }

  return (
    <div className="shop-page" style={{ justifyContent: 'flex-start' }}>
      <span className="shop-page-emoji">🎉</span>
      <h1 className="shop-page-title">Create an event</h1>
      <p className="shop-page-sub">Invites and feedback pages for your event.</p>

      <div className="create-card" style={{ maxWidth: 480, width: '100%' }}>

        {/* ── BRAND ───────────────────────────────── */}
        <label className="scene-label">Pick your brand colours</label>
        <div className="create-pill-row" style={{ gap: '1rem', alignContent: 'center', justifyContent: 'center'}}>
          <input  type="color" value={state.accent}   onChange={bind('accent')} />
          <input type="color" value={state.accent_2} onChange={bind('accent_2')} />
          <input type="color" value={state.bg}       onChange={bind('bg')} />
        </div>

        <label className="scene-label">Emoji</label>
        <div className="create-pill-row">
          {EVENT_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={`create-pill ${state.emoji === e ? 'create-pill--active' : ''}`}
              onClick={() => setField('emoji', e)}
            >
              {e}
            </button>
          ))}
        </div>

        {/* ── THE INVITE (landing screen) ──────────── */}
        <label className="scene-label">Host / organization</label>
        <input className="create-input" placeholder="e.g. Builder Night Out!"
          value={state.host} onChange={bind('host')} />

        <label className="scene-label">Landing title</label>
        <input className="create-input" placeholder="You’re invited"
          value={state.landingTitle} onChange={bind('landingTitle')} />

        <label className="scene-label">Landing subtitle</label>
        <input className="create-input" placeholder="A night of building, drinks and networking"
          value={state.landingSub} onChange={bind('landingSub')} />

        <label className="scene-label">Event date</label>
        <input className="create-input" type="date"
          value={state.eventDate} onChange={bind('eventDate')} />

        <label className="scene-label">Ticket / RSVP link</label>
        <input className="create-input" type="url" placeholder="https://…"
          value={state.ticketUrl} onChange={bind('ticketUrl')} />

        <label className="scene-label">CTA button label</label>
        <input className="create-input" placeholder="Get your ticket →"
          value={state.ctaLabel} onChange={bind('ctaLabel')} />

        {/* ── THE SCENES ──────────────────────────── */}
        <label className="scene-label">Hero headline</label>
        <input className="create-input" placeholder="Time to breathe as a community"
          value={state.heroHeadline} onChange={bind('heroHeadline')} />

        <label className="scene-label">Hero sub-line</label>
        <input className="create-input" placeholder="People with the same experiences having a conversation"
          value={state.heroSub} onChange={bind('heroSub')} />

        <label className="scene-label">What to expect</label>
        <textarea className="create-input create-textarea"
          placeholder="What the night delivers, who’s in the room"
          value={state.expectedText} onChange={bind('expectedText')} />

        <label className="scene-label">Why you shouldn’t miss it</label>
        <textarea className="create-input create-textarea"
          placeholder="The don’t-miss-it pitch"
          value={state.missText} onChange={bind('missText')} />

        <label className="scene-label">Details (date · venue · price)</label>
        <textarea className="create-input create-textarea"
          placeholder="24th July · 5:30PM · Easton · KES 2,200"
          value={state.detailsText} onChange={bind('detailsText')} />

        <label className="scene-label">Questions-to-host prompt</label>
        <textarea className="create-input create-textarea"
          value={state.questionsPrompt} onChange={bind('questionsPrompt')} />

        {error && <p className="create-error">{error}</p>}

        <button className="cta-button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save event draft ✨'}
        </button>
      </div>

      <Link to="/" className="cta-button">Back home</Link>
    </div>
  )
}
