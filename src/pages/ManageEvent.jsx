import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CreatePreview from '../components/CreatePreview'
import {
  EVENT_EMOJIS,
  EMPTY_EVENT_FORM,
  buildEventSections,
  parseEventForm,
  formToColumns,
} from '../lib/eventSections'
import {
  UNIT_DAYS,
  EVENT_UNIT_PRICE_KES,
  eventPriceKes,
  eventDays,
} from '../lib/pricing'

/* ============================================================
   MANAGE EVENT — the host's page, reached by the SECRET manage_id.

   Why this page exists: RLS hides an unpaid draft from everyone, including
   the person who made it — the anon key carries no proof of authorship. So
   before this page, a host was asked to pay for an event they had never seen.
   That is the gap this closes.

   Auth model: a CAPABILITY URL. Holding the 21-character manage_id IS the
   permission — there is no login. The read goes through the
   `get_event_for_manage` security-definer RPC, which is keyed on that secret,
   NOT on the public 6-char invite id. Paying uses the SAME secret, for the
   same reason: authorising a charge should need what authorising an edit needs.

   Flow:  preview → edit everything → pay to publish → share → feedback
   ============================================================ */

/* Matches update_event(p_manage_id text, p_patch jsonb). Returns boolean:
   false means no event matched that manage_id. */
const UPDATE_RPC = 'update_event'

/* THE WHOLE EVENT IS EDITABLE NOW — every scene in SCENE_MAP that events use
   (hero · who · message · memory · feedback), plus branding and the ticket
   link. Grouped, because a flat list of 15 inputs is not an editor, it's a
   form. Each group maps to a place the host can actually point at on the
   preview beside it. */
const FIELD_GROUPS = [
  {
    title: 'The invite',
    hint: 'The first screen, before a guest opens anything.',
    fields: [
      { key: 'host',         label: 'Host / organisation', type: 'text' },
      { key: 'landingTitle', label: 'Invite headline',     type: 'text' },
      { key: 'landingSub',   label: 'Invite subtitle',     type: 'text' },
      { key: 'eventDate',    label: 'Event date',          type: 'date' },
    ],
  },
  {
    title: 'The scenes',
    hint: 'Everything a guest scrolls through. Leave one blank to drop that scene entirely.',
    fields: [
      { key: 'heroHeadline',    label: 'Hero headline',              type: 'text' },
      { key: 'heroSub',         label: 'Hero sub-line',              type: 'text' },
      { key: 'expectedText',    label: 'What to expect',             type: 'textarea' },
      { key: 'missText',        label: 'Why you shouldn’t miss it',  type: 'textarea' },
      { key: 'detailsText',     label: 'Details (date · venue · price)', type: 'textarea' },
      { key: 'questionsPrompt', label: 'Questions-to-host prompt',   type: 'textarea' },
    ],
  },
  {
    title: 'The ticket button',
    hint: 'Where the button at the end of the invite sends your guests.',
    fields: [
      { key: 'ctaLabel',  label: 'Button label',         type: 'text' },
      { key: 'ticketUrl', label: 'Ticket / signup link', type: 'url' },
    ],
  },
]

/* How many 14-day units to offer. Deliberately a short list: a free-text
   number invites "0.5" and "1e9". The SERVER clamps regardless — this is
   convenience, not enforcement. */
const UNIT_CHOICES = [1, 2, 4]

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

/* Field-by-field rather than JSON.stringify: two objects with identical
   values but different key insertion order stringify differently, and the
   form's key order depends on where it was built. */
function sameForm(a, b) {
  if (!a || !b) return false
  return Object.keys(EMPTY_EVENT_FORM).every((k) => (a[k] ?? '') === (b[k] ?? ''))
}

export default function ManageEvent() {
  const { manageId } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_EVENT_FORM)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // ── payment state — one variable drives the flow, same shape as Outro.jsx
  const [units, setUnits] = useState(1)
  const [phone, setPhone] = useState('')
  const [payStep, setPayStep] = useState('idle') // idle | sending | waiting | failed
  const [payError, setPayError] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(120)
  const [showExtend, setShowExtend] = useState(false)

  /* The saved state of the form, for the dirty check. Derived from the row so
     it re-baselines automatically after a successful save. */
  const baseline = useMemo(() => (event ? parseEventForm(event) : null), [event])
  const dirty = baseline ? !sameForm(form, baseline) : false

  /* Sections rebuilt from the CURRENT form, not from the saved row — this is
     what makes the preview live: type into "What to expect" and the scene
     appears beside you before anything is saved. Same function the save path
     uses, so what you see is exactly what gets written. */
  const previewSections = useMemo(() => buildEventSections(form), [form])
  const brandStyle = {
    '--accent': form.accent,
    '--accent-2': form.accent_2,
    '--bg': form.bg,
  }

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
        // parseEventForm digs the scene copy back OUT of the sections JSONB.
        // Without it the textareas would load empty and the next save would
        // silently wipe scenes the host had already written.
        if (row) setForm(parseEventForm(row))
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [manageId])

  // ── PAYMENT POLLING ────────────────────────────────────────
  // The webhook is the only thing that knows money moved, and it writes to
  // the DB, not to this browser. So the page asks the DB. Same manage RPC as
  // the initial load — no new read path, no new policy to get wrong.
  useEffect(() => {
    if (payStep !== 'waiting') return

    const interval = setInterval(async () => {
      const { data } = await supabase.rpc('get_event_for_manage', { p_manage_id: manageId })
      const row = Array.isArray(data) ? data[0] : data
      if (!row) return

      if (row.paid && row.paid_until && new Date(row.paid_until) > new Date()) {
        setEvent(row)
        setPayStep('idle')
        setShowExtend(false)
        setNotice({ ok: true, text: 'Payment confirmed — your event is live. Share the invite link below.' })
      } else if (row.payment_failed) {
        // The webhook already told us this attempt died. No reason to sit out
        // the full two minutes waiting for a timeout we can skip.
        setPayStep('failed')
        setPayError('Payment was not completed. Please try again.')
      }
    }, 2000)

    // No "is it still waiting?" guard needed: this effect only runs while
    // payStep === 'waiting', and the cleanup below clears the timeout the
    // moment that stops being true.
    const timeout = setTimeout(() => {
      setPayStep('failed')
      setPayError('Payment timed out. If money left your account, refresh this page in a minute before retrying.')
    }, 120000)

    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [payStep, manageId])

  // Purely visual countdown, ticking alongside the poll above. It does NOT
  // reset the clock here — handlePay does that on the way in. Resetting in an
  // effect body is a setState during render, which cascades a second render
  // for something the event handler already knew.
  useEffect(() => {
    if (payStep !== 'waiting') return
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(s - 1, 0)), 1000)
    return () => clearInterval(tick)
  }, [payStep])

  async function handleSave() {
    setSaving(true)
    setNotice(null)

    /* TWO OUTPUTS, ONE INPUT. The columns and the sections JSONB are both
       generated from `form` in the same breath, so `ticket_url` and the CTA
       href baked into the feedback scene cannot disagree — which is exactly
       the bug that made "Saved ✓" a lie about the ticket link. */
    const patch = { ...formToColumns(form), sections: buildEventSections(form) }

    const { data, error } = await supabase.rpc(UPDATE_RPC, {
      p_manage_id: manageId,
      p_patch: patch,
    })
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
    setNotice({
      ok: true,
      text: event.paid
        ? 'Saved. Anyone opening the invite sees this now.'
        : 'Saved. Publish when you’re ready and guests will see this.',
    })
  }

  async function handlePay() {
    if (!phone.trim()) {
      setPayError('Please enter your M-Pesa number')
      return
    }
    /* Paying does not save. Letting a host pay with unsaved edits publishes a
       version they aren't looking at — and the edit window is exactly when
       they're most likely to have some. */
    if (dirty) {
      setPayError('You have unsaved edits — save them first so you publish what you can see.')
      return
    }
    setPayError(null)
    setSecondsLeft(120)
    setPayStep('sending')

    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        /* NO AMOUNT. We send units and the secret; the server resolves the
           event, clamps the units and works out the money itself. An amount
           in this body would be a price the customer gets to choose. */
        body: JSON.stringify({ kind: 'event', manageId, units, phone }),
      })
      const result = await res.json()
      if (!res.ok) {
        setPayError(result.error || 'Could not start payment')
        setPayStep('failed')
        return
      }
      setPayStep('waiting')
    } catch {
      setPayError('Network error. Please try again.')
      setPayStep('failed')
    }
  }

  function copyInvite() {
    navigator.clipboard.writeText(`${window.location.origin}/card/${event.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value })

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
  const paying = payStep === 'sending' || payStep === 'waiting'

  /* The pay form. Shared by "publish this draft", "reopen this ended event"
     and "add more time to a live one" — the server-side extension always
     runs from MAX(now, paid_until), so topping up never burns time you have. */
  const payForm = (
    <div className="create-card manage-card">
      <label className="scene-label">How long should it stay live?</label>
      <div className="create-pill-row">
        {UNIT_CHOICES.map((u) => (
          <button
            key={u}
            type="button"
            className={`create-pill ${units === u ? 'create-pill--active' : ''}`}
            onClick={() => setUnits(u)}
            disabled={paying}
          >
            {eventDays(u)} days
          </button>
        ))}
      </div>

      <p className="manage-total">
        KES {eventPriceKes(units)}
        <span> · {eventDays(units)} days</span>
      </p>

      <label className="scene-label">M-Pesa number</label>
      <input
        className="create-input"
        type="tel"
        placeholder="e.g. 0712 345 678"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={paying}
      />

      {payStep === 'sending' && (
        <>
          <div className="payment-spinner" />
          <p className="manage-note">Sending a payment request to {phone}. This can take up to 15 seconds.</p>
        </>
      )}

      {payStep === 'waiting' && (
        <>
          <div className="payment-spinner" />
          <p className="manage-note">
            <strong>Check your phone 📱</strong><br />
            Enter your M-Pesa PIN to complete payment.<br />
            Waiting… {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} left
          </p>
        </>
      )}

      {payError && <p className="manage-notice manage-notice--bad">{payError}</p>}

      {!paying && (
        <button className="cta-button" onClick={handlePay}>
          {payStep === 'failed' ? 'Try again' : `Pay KES ${eventPriceKes(units)} via M-Pesa`}
        </button>
      )}

      <p className="manage-note manage-note--hint">
        KES {EVENT_UNIT_PRICE_KES} buys {UNIT_DAYS} days. Buy several at once — the price is per {UNIT_DAYS}-day unit, not a subscription, so nothing renews and nothing is charged again.
      </p>
    </div>
  )

  return (
    <div className="shop-page manage-page" style={{ justifyContent: 'flex-start' }}>
      <span className={`manage-badge manage-badge--${badge.tone}`}>{badge.label}</span>
      <h1 className="shop-page-title">{form.landingTitle || 'Your event'}</h1>
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
            Now LIVE: it renders the form you are typing into, not the last
            saved row. Same buildEventSections() the save uses. */}
        <section className="manage-block manage-block--preview">
          <h2 className="manage-h">Preview</h2>
          <div className="manage-preview">
            <CreatePreview
              sections={previewSections}
              emoji={form.emoji}
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
            {dirty
              ? 'Unsaved changes — this is what guests will see once you save.'
              : 'This is exactly what your guests see.'}
          </p>
        </section>

        <div className="manage-col">
          {/* ── EDIT ────────────────────────────────────────────
              Everything. Branding, the invite screen, every scene, and where
              the ticket button points. */}
          <section className="manage-block">
            <h2 className="manage-h">Edit your event</h2>
            <div className="create-card manage-card">

              {/* Brand: colours and emoji aren't text inputs, so they get
                  their own block rather than being forced into FIELD_GROUPS. */}
              <div className="manage-group">
                <p className="manage-group-title">Your brand</p>
                <p className="manage-group-hint">These drive every colour in the invite.</p>

                <label className="scene-label">Brand colours</label>
                <div className="create-pill-row">
                  <input type="color" value={form.accent}   onChange={setField('accent')} />
                  <input type="color" value={form.accent_2} onChange={setField('accent_2')} />
                  <input type="color" value={form.bg}       onChange={setField('bg')} />
                </div>

                <label className="scene-label">Emoji</label>
                <div className="create-pill-row">
                  {EVENT_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className={`create-pill ${form.emoji === e ? 'create-pill--active' : ''}`}
                      onClick={() => setForm({ ...form, emoji: e })}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {FIELD_GROUPS.map((group) => (
                <div className="manage-group" key={group.title}>
                  <p className="manage-group-title">{group.title}</p>
                  <p className="manage-group-hint">{group.hint}</p>

                  {group.fields.map((f) => (
                    <div key={f.key}>
                      <label className="scene-label" htmlFor={`f-${f.key}`}>{f.label}</label>
                      {f.type === 'textarea' ? (
                        <textarea
                          id={`f-${f.key}`}
                          className="create-input create-textarea"
                          value={form[f.key] || ''}
                          onChange={setField(f.key)}
                        />
                      ) : (
                        <input
                          id={`f-${f.key}`}
                          className="create-input"
                          type={f.type}
                          value={form[f.key] || ''}
                          onChange={setField(f.key)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}

              <button className="cta-button" onClick={handleSave} disabled={saving || !dirty}>
                {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved ✓'}
              </button>
              {notice && (
                <p className={`manage-notice ${notice.ok ? '' : 'manage-notice--bad'}`}>
                  {notice.text}
                </p>
              )}
            </div>
          </section>

          {/* ── PUBLISH ───────────────────────────────────────── */}
          <section className="manage-block">
            <h2 className="manage-h">{state === 'live' ? 'Share it' : 'Publish'}</h2>

            {state === 'live' ? (
              <>
                <div className="create-card manage-card">
                  <label className="scene-label">Public invite link</label>
                  <input className="create-input" readOnly value={`${window.location.origin}/card/${event.id}`} />
                  <button className="cta-button" onClick={copyInvite}>
                    {copied ? 'Copied ✓' : 'Copy invite link'}
                  </button>
                  <p className="manage-note">
                    Live until {new Date(event.paid_until).toLocaleDateString()}. After that the link shows a
                    farewell note — guests never see a broken page.
                  </p>
                  {!showExtend && (
                    <button className="cta-button cta-button--ghost" onClick={() => setShowExtend(true)}>
                      Add more time
                    </button>
                  )}
                </div>
                {/* Sibling, not a child: payForm is itself a .create-card, and
                    nesting one inside another doubles the padding and border. */}
                {showExtend && payForm}
              </>
            ) : (
              <>
                <p className="manage-note">
                  {state === 'ended'
                    ? 'Publish again to reopen this event to guests.'
                    : 'Guests can’t open the invite until you publish.'}
                </p>
                {payForm}
              </>
            )}
          </section>
        </div>
      </div>

      <p className="manage-note manage-note--keep">
        🔒 Keep this page’s URL private — anyone with it can edit your event and buy time on it.
      </p>

      {/* Full-screen preview. On a phone this is the ONLY sane way to read a
          scrolly card: the frame owns the whole viewport, so there is no
          ambiguity about which thing a swipe is scrolling. */}
      {expanded && (
        <div className="manage-fullpreview" role="dialog" aria-modal="true" aria-label="Event preview">
          <CreatePreview
            sections={previewSections}
            emoji={form.emoji}
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
