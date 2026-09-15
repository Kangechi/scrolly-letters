import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase'
import CreatePreview from '../components/CreatePreview'
import CreateSwitcher from '../components/CreateSwitcher'
import { OCCASIONS, THEMES } from '../lib/cardForm'
import { STYLES, LOOK_ORDER, toStoredStyle } from '../lib/styles'
import { priceForCard } from '../lib/pricing'
import {
  SAMPLE_WISHLIST, WISH_EMOJIS, MAX_ITEMS, newItem, validateWishlist, buildWishlistSections,
} from '../lib/wishlistForm'

/* ============================================================
   WISHLIST — the third service in the create section (Phase 4).
   Create it, give it a look, pay at the same checkout, send one link.
   Friends open it, scroll, and tap "I'll get this".

   Same studio shell as /customize (the .studio classes), so the three
   services feel like one product:
     LEFT   looks + colours
     CENTRE the live list — exactly what friends will see
     RIGHT  Wishes (the items editor) | Details (name, occasion, note)
   Looks only here — no per-scene picks. The list is the point; the words
   around it are a frame.
   ============================================================ */

export default function Wishlist() {
  const [form, setForm] = useState(SAMPLE_WISHLIST)
  const [look, setLook] = useState('plain')
  const [tab, setTab] = useState('wishes')
  const [replayKey, setReplayKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }))
  const setItem = (id, field, value) =>
    setForm((f) => ({ ...f, items: f.items.map((it) => (it.id === id ? { ...it, [field]: value } : it)) }))

  function addItem() {
    const item = newItem()        // id generated OUTSIDE the state updater
    setForm((f) => (f.items.length >= MAX_ITEMS ? f : { ...f, items: [...f.items, item] }))
  }
  const removeItem = (id) => setForm((f) => ({ ...f, items: f.items.filter((it) => it.id !== id) }))
  function moveItem(id, dir) {
    setForm((f) => {
      const i = f.items.findIndex((it) => it.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= f.items.length) return f
      const items = [...f.items]
      ;[items[i], items[j]] = [items[j], items[i]]    // swap in place on the copy
      return { ...f, items }
    })
  }

  function chooseLook(id) {
    setLook(id)
    setReplayKey((k) => k + 1)
  }

  const sections = buildWishlistSections(form)
  const stored = toStoredStyle(look, null)
  const priceKes = priceForCard({ sections, ...stored }) / 100

  async function handleCreate() {
    const problem = validateWishlist(form)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setSubmitting(true)

    const id = nanoid(6)
    const { error } = await supabase.from('cards').insert({
      id,
      recipient: form.owner.trim(),   // on a wishlist, "recipient" = whose wishes
      occasion: form.occasion,
      theme: form.theme,
      emoji: form.emoji,
      sections,
      ...stored,
      requires_payment: true,
      product: 'wishlist',
    })
    setSubmitting(false)

    if (error) {
      setError(/style/.test(error.message)
        ? 'The studio isn’t switched on in the database yet — run sql/2026-09-15_create_studio_styles.sql.'
        : error.message)
      return
    }
    navigate(`/card/${id}/checkout`)
  }

  return (
    <div className={`studio theme-${form.theme}`}>
      {/* ───────────── LEFT ───────────── */}
      <aside className="studio-rail studio-looks">
        <div className="studio-head">
          <CreateSwitcher />
          <h1>Wishlist <span aria-hidden="true">🎁</span></h1>
          <p>List what you’d love. Friends tap “I’ll get this” so nobody doubles up — and nobody sees who.</p>
        </div>

        <h2 className="studio-h">Look</h2>
        <div className="look-list">
          {LOOK_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              className={`look-option ${look === id ? 'look-option--on' : ''}`}
              aria-pressed={look === id}
              onClick={() => chooseLook(id)}
            >
              <span className="look-option-name">{STYLES[id].label}</span>
              <span className="look-option-blurb">{STYLES[id].blurb}</span>
            </button>
          ))}
        </div>

        <h2 className="studio-h">Colours</h2>
        <div className="create-pill-row">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className={`create-pill theme-${t} ${form.theme === t ? 'create-pill--active' : ''}`}
              onClick={() => setField('theme', t)}
            >
              {t}
            </button>
          ))}
        </div>
      </aside>

      {/* ───────────── CENTRE ───────────── */}
      <main className="studio-stage">
        <div className="studio-topbar">
          <span className="studio-topbar-look">{STYLES[look].label}</span>
          <span className="studio-topbar-hint">This is exactly what your friends will see</span>
          <button type="button" className="studio-btn" onClick={() => setReplayKey((k) => k + 1)}>↻ Replay</button>
        </div>
        <div className="st-stage-wrap">
          <div className="st-phone">
            <CreatePreview
              sections={sections}
              theme={form.theme}
              emoji={form.emoji}
              style={stored.style}
              replayKey={replayKey}
            />
          </div>
        </div>
      </main>

      {/* ───────────── RIGHT ───────────── */}
      <aside className="studio-rail studio-panel">
        <div className="studio-tabs" role="tablist">
          {[['wishes', `Wishes (${form.items.length})`], ['details', 'Details']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`studio-tab ${tab === id ? 'studio-tab--on' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'wishes' && (
          <div className="wish-edit-list">
            {form.items.map((it, i) => (
              <div className="wish-edit" key={it.id}>
                <div className="wish-edit-top">
                  <select
                    className="create-input"
                    aria-label="Emoji"
                    value={it.emoji}
                    onChange={(e) => setItem(it.id, 'emoji', e.target.value)}
                  >
                    {WISH_EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <input
                    className="create-input"
                    placeholder="What is it?"
                    value={it.name}
                    onChange={(e) => setItem(it.id, 'name', e.target.value)}
                  />
                </div>
                <div className="wish-edit-row">
                  <input
                    className="create-input"
                    inputMode="numeric"
                    placeholder="Price (KES)"
                    value={it.price}
                    onChange={(e) => setItem(it.id, 'price', e.target.value.replace(/[^\d]/g, ''))}
                  />
                  <input
                    className="create-input"
                    type="url"
                    placeholder="Link (optional)"
                    value={it.link}
                    onChange={(e) => setItem(it.id, 'link', e.target.value)}
                  />
                </div>
                <input
                  className="create-input"
                  placeholder="A note — size, colour… (optional)"
                  value={it.note}
                  onChange={(e) => setItem(it.id, 'note', e.target.value)}
                />
                <div className="wish-edit-actions">
                  <button type="button" className="studio-btn" onClick={() => moveItem(it.id, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button type="button" className="studio-btn" onClick={() => moveItem(it.id, 1)} disabled={i === form.items.length - 1} aria-label="Move down">↓</button>
                  <button type="button" className="studio-btn" onClick={() => removeItem(it.id)}>Remove</button>
                </div>
              </div>
            ))}
            <button type="button" className="studio-btn studio-btn--quiet" onClick={addItem} disabled={form.items.length >= MAX_ITEMS}>
              {form.items.length >= MAX_ITEMS ? `That’s the maximum (${MAX_ITEMS})` : '+ Add a wish'}
            </button>
          </div>
        )}

        {tab === 'details' && (
          <div className="studio-form">
            <label className="studio-label">Your name</label>
            <input className="create-input" value={form.owner} placeholder="Whose wishes are these?"
              onChange={(e) => setField('owner', e.target.value)} />

            <label className="studio-label">Occasion</label>
            <select className="create-input" value={form.occasion} onChange={(e) => setField('occasion', e.target.value)}>
              {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>

            <label className="studio-label">A note <em>optional</em></label>
            <textarea className="create-input create-textarea" value={form.note}
              onChange={(e) => setField('note', e.target.value)} />

            <label className="studio-label">Closing line</label>
            <input className="create-input" value={form.closing}
              onChange={(e) => setField('closing', e.target.value)} />

            <label className="studio-label">Emoji</label>
            <div className="create-pill-row">
              {WISH_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`create-pill ${form.emoji === e ? 'create-pill--active' : ''}`}
                  onClick={() => setField('emoji', e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ───────────── BOTTOM ───────────── */}
      <footer className="studio-bar">
        <div className="studio-bar-price">
          <span className="studio-bar-kes">KES {priceKes}</span>
          <span className="studio-bar-sub">One wishlist · pay at checkout · schedule it there too</span>
        </div>
        {error && <p className="create-error studio-bar-error">{error}</p>}
        <button type="button" className="st-cta" onClick={handleCreate} disabled={submitting}>
          {submitting ? 'Creating…' : 'Create & pay →'}
        </button>
      </footer>
    </div>
  )
}
