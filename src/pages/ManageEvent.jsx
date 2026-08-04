import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CreatePreview from '../components/CreatePreview'

/* ============================================================
   MANAGE EVENT — the host's page, reached by the SECRET manage_id.

   Why this page exists: RLS hides an unpaid draft from everyone, including
   the person who made it — the anon key carries no proof of authorship. So
   before this page, a host was asked to pay KES 500 for an event they had
   never seen. That is the gap this closes.

   Auth model: a CAPABILITY URL. Holding the 21-character manage_id IS the
   permission — there is no login. The read goes through the
   `get_event_for_manage` security-definer RPC, which is keyed on that secret,
   NOT on the public 6-char invite id.

   Flow:  preview the draft → edit it → pay to publish → (later) read feedback
   ============================================================ */

/* Matches update_event(p_manage_id text, p_patch jsonb) — same `p_manage_id`
   convention as the existing get_event_feedback. Returns boolean: false means
   no event matched that manage_id. */
const UPDATE_RPC = 'update_event'
const UPDATE_ARGS = (manageId, patch) => ({ p_manage_id: manageId, p_patch: patch })

/* The fields a host may fix after invites have gone out: typos, a moved
   venue, a changed date. Deliberately NOT the scene copy — that is a bigger
   editor, and these are the "don't break sent invites" repairs from Spec v1. */
const EDITABLE = [
  { key: 'host',          label: 'Host / organisation', type: 'text' },
  { key: 'landing_title', label: 'Invite headline',     type: 'text' },
  { key: 'landing_sub',   label: 'Invite subtitle',     type: 'text' },
  { key: 'event_date',    label: 'Event date',          type: 'date' },
  { key: 'cta_label',     label: 'Button label',        type: 'text' },
  { key: 'ticket_url',    label: 'Ticket / signup link', type: 'url' },
]

/* Lifecycle, derived from the row. We can compute this on the client here —
   unlike CardPage — precisely because the manage RPC returned the whole row.
   Same state machine the RLS policy enforces server-side. */
function lifecycle(ev) {
  if (!ev.paid || !ev.paid_until) return 'draft'
  return new Date(ev.paid_until) > new Date() ? 'live' : 'ended'
}

const BADGE = {
  draft: { label: 'Draft · not published', tone: 'draft' },
  live:  { label: 'Live',                  tone: 'live'  },
  ended: { label: 'Ended',                 tone: 'ended' },
}

export default function ManageEvent() {
  const { manageId } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  /* While the full-screen preview is open, stop the page behind it scrolling.
     Without this, swiping past the end of the preview scrolls the manage page
     underneath — and closing leaves you somewhere you never navigated to. */
  useEffect(() => {
    if (!expanded) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [expanded])

  useEffect(() => {
    let cancelled = false
    // `loading` already starts true; setting it here again would be a
    // synchronous setState inside an effect (cascading render).

    supabase
      .rpc('get_event_for_manage', { p_manage_id: manageId })
      .then(({ data, error }) => {
        if (cancelled) return
        const row = Array.isArray(data) ? data[0] : data
        setEvent(error ? null : row || null)
        if (row) {
          setForm(Object.fromEntries(EDITABLE.map(f => [f.key, row[f.key] ?? ''])))
        }
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [manageId])

  async function handleSave() {
    setSaving(true)
    setNotice(null)

    // Send only what actually changed — a smaller patch is a smaller blast radius.
    const patch = Object.fromEntries(
      EDITABLE
        .map(f => f.key)
        .filter(k => (form[k] || '') !== (event[k] || ''))
        .map(k => [k, k === 'event_date' ? (form[k] || null) : form[k]])
    )

    if (Object.keys(patch).length === 0) {
      setSaving(false)
      setNotice({ ok: true, text: 'Nothing to save — no changes yet.' })
      return
    }

    const { data, error } = await supabase.rpc(UPDATE_RPC, UPDATE_ARGS(manageId, patch))
    setSaving(false)

    if (error) {
      setNotice({ ok: false, text: `Could not save: ${error.message}` })
      return
    }
    // The RPC returns false when no row matched — a save that quietly
    // changed nothing is worse than one that says so.
    if (data === false) {
      setNotice({ ok: false, text: 'That manage link no longer matches an event.' })
      return
    }
    setEvent({ ...event, ...patch })
    setNotice({ ok: true, text: 'Saved. Anyone opening the invite sees this now.' })
  }

  function copyInvite() {
    navigator.clipboard.writeText(`${window.location.origin}/card/${event.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <div className="shop-page"><p className="shop-page-sub">Loading your event…</p></div>
  }

  /* A wrong manage_id matches nothing. Say as little as possible — this page
     is reached by a secret, so a detailed error would be a hint. */
  if (!event) {
    return (
      <div className="shop-page">
        <span className="shop-page-emoji">🔑</span>
        <h1 className="shop-page-title">Link not recognised</h1>
        <p className="shop-page-sub">
          This manage link doesn’t match an event. Check you copied all of it.
        </p>
        <Link to="/event" className="cta-button">Create an event →</Link>
      </div>
    )
  }

  const state = lifecycle(event)
  const badge = BADGE[state]
  const brandStyle = event.accent
    ? { '--accent': event.accent, '--accent-2': event.accent_2, '--bg': event.bg }
    : undefined

  return (
    <div className="shop-page manage-page" style={{ justifyContent: 'flex-start' }}>
      <span className={`manage-badge manage-badge--${badge.tone}`}>{badge.label}</span>
      <h1 className="shop-page-title">{event.landing_title || 'Your event'}</h1>
      <p className="shop-page-sub">
        {state === 'draft' && 'Only you can see this. Publish it to hand out the invite link.'}
        {state === 'live'  && `Live until ${new Date(event.paid_until).toLocaleDateString()}.`}
        {state === 'ended' && 'The published window has closed. Anyone opening the invite sees a farewell note.'}
      </p>

      {/* Two columns on desktop — the same split the create page uses, and the
          reason the preview can finally be full height: the card is built for a
          tall frame, so boxing it into a thumbnail was showing a squeezed slice
          of it rather than the thing the host is about to pay for. */}
      <div className="manage-layout">

        {/* ── PREVIEW ───────────────────────────────────────────
            The whole point of the page: see it before paying for it. */}
        <section className="manage-block manage-block--preview">
          <h2 className="manage-h">Preview</h2>
          <div className="manage-preview">
            <CreatePreview
              sections={event.sections || []}
              emoji={event.emoji}
              brandStyle={brandStyle}
            />
          </div>
          <button
            type="button"
            className="manage-expand"
            onClick={() => setExpanded(true)}
          >
            Open full preview ⤢
          </button>
          <p className="manage-note manage-note--hint">
            This is exactly what your guests see.
          </p>
        </section>

        <div className="manage-col">
          {/* ── EDIT ────────────────────────────────────────────
              Fixes that must not break invites already sent. */}
          <section className="manage-block">
            <h2 className="manage-h">Details</h2>
            <div className="create-card manage-card">
              {EDITABLE.map(f => (
                <div key={f.key}>
                  <label className="scene-label">{f.label}</label>
                  <input
                    className="create-input"
                    type={f.type}
                    value={form[f.key] || ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <button className="cta-button" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {notice && (
                <p className={`manage-notice ${notice.ok ? '' : 'manage-notice--bad'}`}>
                  {notice.text}
                </p>
              )}
            </div>
          </section>

          {/* ── PUBLISH ─────────────────────────────────────────
              Payment lands here tomorrow. The button is deliberately inert
              rather than hidden, so the flow reads correctly today. */}
          <section className="manage-block">
            <h2 className="manage-h">{state === 'live' ? 'Share it' : 'Publish'}</h2>

            {state === 'live' ? (
              <div className="create-card manage-card">
                <label className="scene-label">Public invite link</label>
                <input className="create-input" readOnly value={`${window.location.origin}/card/${event.id}`} />
                <button className="cta-button" onClick={copyInvite}>
                  {copied ? 'Copied ✓' : 'Copy invite link'}
                </button>
              </div>
            ) : (
              <div className="create-card manage-card">
                <p className="manage-note">
                  {state === 'ended'
                    ? 'Publish again to reopen this event to guests.'
                    : 'KES 500 keeps your event live for 14 days. Guests can’t open the invite until then.'}
                </p>
                <button className="cta-button" disabled title="Payment lands in the next session">
                  Pay to publish — coming next
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      <p className="manage-note manage-note--keep">
        🔒 Keep this page’s URL private — anyone with it can edit your event.
      </p>

      {/* Full-screen preview. On a phone this is the ONLY sane way to read a
          scrolly card: the frame owns the whole viewport, so there is no
          ambiguity about which thing a swipe is scrolling. */}
      {expanded && (
        <div className="manage-fullpreview" role="dialog" aria-modal="true" aria-label="Event preview">
          <CreatePreview
            sections={event.sections || []}
            emoji={event.emoji}
            brandStyle={brandStyle}
          />
          <button
            type="button"
            className="manage-fullpreview-close"
            onClick={() => setExpanded(false)}
            autoFocus
          >
            Close ✕
          </button>
        </div>
      )}
    </div>
  )
}
