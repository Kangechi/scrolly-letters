import { useState } from 'react'
import { Link } from 'react-router-dom'

/* ============================================================
   CREATE EVENT (Goal 4) — SCAFFOLD.
   For organizations: build an INVITE card (kind: 'event') and later a
   FEEDBACK page for guests. Event letters live in the local bundle
   (src/data/cards_data.jsx), NOT the DB — see CardPage.jsx which reads
   local events first. Mirror that shape.

   You'll wire the real logic tomorrow — the TODOs mark exactly where.
   ============================================================ */

const initialForm = {
  eventName: '',
  host: '',
  eventDate: '',       // 'YYYY-MM-DD' — CardPage Countdown expects this
  emoji: '🎉',
  landingTitle: '',    // e.g. "You're invited"
  landingSub: '',
  ctaLabel: 'Open ✨',
  // TODO: theme, scenes, feedback toggle…
}

export default function CreateEvent() {
  const [form, setForm] = useState(initialForm)

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  // TODO tomorrow:
  //   1. Build the full form (all fields above + theme picker).
  //   2. Assemble an event object matching the cards_data.jsx 'event' shape.
  //   3. Decide storage: bundle vs a new Supabase 'events' table.
  //   4. Add a live preview (reuse the card scenes) + a feedback page route.

  return (
    <div className="shop-page" style={{ justifyContent: 'flex-start' }}>
      <span className="shop-page-emoji">🎉</span>
      <h1 className="shop-page-title">Create an event</h1>
      <p className="shop-page-sub">Invites and feedback pages for your event.</p>

      {/* Minimal starter fields — extend tomorrow */}
      <div className="create-card" style={{ maxWidth: 480, width: '100%' }}>
        <input
          className="create-input"
          placeholder="Event name (e.g. LinkedIn Local Nairobi)"
          value={form.eventName}
          onChange={set('eventName')}
        />
        <input
          className="create-input"
          placeholder="Host / organization"
          value={form.host}
          onChange={set('host')}
        />
        <input
          className="create-input"
          type="date"
          value={form.eventDate}
          onChange={set('eventDate')}
        />
      </div>

      <Link to="/" className="cta-button">Back home</Link>
    </div>
  )
}
