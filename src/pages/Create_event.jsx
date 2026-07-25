import { useState, useReducer } from 'react'
import { Link } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase'

/* ============================================================
   CREATE EVENT — self-serve event builder.
   Flow: fill form → assemble scenes → (Unit 4) pay KES 500 → publish.
   Storage: the Supabase `events` table (NOT the local bundle — that
   holds only the two demo events). Two capabilities per event:
     • id        (nanoid 6)  → public invite URL
     • manage_id (nanoid 21) → secret edit + feedback URL
   ============================================================ */

const EVENT_EMOJIS = ['🎉', '🎟️', '♟️', '🤖', '🎤', '🥂', '📅', '✨', '🔥', '💡']

const initialForm = {
  // identity + branding
  host: '',
  emoji: '🎉',
  accent: '#4C86C6',
  accent_2: '#E9B824',
  bg: '#0A3A6B',

  // landing screen
  eventDate: '',
  landingTitle: 'You’re invited',
  landingSub: '',
  ctaLabel: 'Get your ticket →',
  ticketUrl: '',

  // scene text
  heroHeadline: '',
  heroSub: '',
  expectedText: '',
  missText: '',
  detailsText: '',
  questionsPrompt: 'Anything you want to know before the day?',
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

/* Turn the flat form state into the scenes[] array CardPage will render.
   Each object's keys MUST match what its scene component reads:
     hero     → headline, sub
     who      → headline, text
     message  → sub, text
     memory   → label, text
     feedback → label, prompt, cta{label, href}
   Optional middle scenes drop out when left blank (.filter(Boolean)). */
function buildEventSections(state) {
  return [
    {
      type: 'hero',
      headline: state.heroHeadline,
      sub: state.heroSub,
    },
    state.expectedText && {
      type: 'who',
      headline: 'What to expect',
      text: state.expectedText,
    },
    state.missText && {
      type: 'message',
      sub: 'Why you shouldn’t miss it',
      text: state.missText,
    },
    state.detailsText && {
      type: 'memory',
      label: 'Details about the event',
      text: state.detailsText,
    },
    {
      type: 'feedback',
      label: 'Questions for the host?',
      prompt: state.questionsPrompt,
      cta: { label: state.ctaLabel, href: state.ticketUrl || '#' },
    },
  ].filter(Boolean)
}

export default function CreateEvent() {
  const [state, dispatch] = useReducer(reducer, initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [created, setCreated] = useState(null)   // { id, manage_id } after save

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
      host: state.host,
      emoji: state.emoji,
      accent: state.accent,
      accent_2: state.accent_2,
      bg: state.bg,
      event_date: state.eventDate || null,   // '' would break a DATE column
      landing_title: state.landingTitle,
      landing_sub: state.landingSub,
      cta_label: state.ctaLabel,
      ticket_url: state.ticketUrl,
      sections,
      // `paid` stays false (DB default). Unit 4's payment flips it live.
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setCreated({ id, manage_id })   // show the two links (Unit 4 pays first)
  }

  // ── After a successful draft save: show the two capability URLs ──
  if (created) {
    const origin = window.location.origin
    return (
      <div className="shop-page" style={{ justifyContent: 'flex-start' }}>
        <span className="shop-page-emoji">✅</span>
        <h1 className="shop-page-title">Draft saved</h1>
        <p className="shop-page-sub">
          Payment (KES 500) comes next — until then this event is a private draft.
        </p>
        <div className="create-card" style={{ maxWidth: 480, width: '100%' }}>
          <label className="scene-label">Public invite link</label>
          <input className="create-input" readOnly value={`${origin}/card/${created.id}`} />
          <label className="scene-label">Secret manage link (keep this private)</label>
          <input className="create-input" readOnly value={`${origin}/event/manage/${created.manage_id}`} />
        </div>
        <Link to="/" className="cta-button">Back home</Link>
      </div>
    )
  }

  return (
    <div className="shop-page" style={{ justifyContent: 'flex-start' }}>
      <span className="shop-page-emoji">🎉</span>
      <h1 className="shop-page-title">Create an event</h1>
      <p className="shop-page-sub">Invites and feedback pages for your event.</p>

      <div className="create-card" style={{ maxWidth: 480, width: '100%' }}>

        {/* ── BRAND ───────────────────────────────── */}
        <label className="scene-label">Pick your brand colours</label>
        <div className="create-pill-row">
          <input type="color" value={state.accent}   onChange={bind('accent')} />
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
        <input className="create-input" placeholder="e.g. LinkedIn Local Nairobi"
          value={state.host} onChange={bind('host')} />

        <label className="scene-label">Landing title</label>
        <input className="create-input" placeholder="You’re invited"
          value={state.landingTitle} onChange={bind('landingTitle')} />

        <label className="scene-label">Landing subtitle</label>
        <input className="create-input" placeholder="LinkedIn Local · The Unwritten Rules of Business"
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
        <input className="create-input" placeholder="The Unwritten Rules of Business"
          value={state.heroHeadline} onChange={bind('heroHeadline')} />

        <label className="scene-label">Hero sub-line</label>
        <input className="create-input" placeholder="The lessons nobody teaches…"
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
          placeholder="24th July · 5:30PM · Hackhouse · KES 2,200"
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
