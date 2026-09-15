import { useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase'
import CreatePreview from '../components/CreatePreview'
import CreateSwitcher from '../components/CreateSwitcher'
// Shared with /customize so both build a card the same way.
import { OCCASIONS, THEMES, EMOJIS, initialState, reducer, buildSections } from '../lib/cardForm'

export default function Create() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [buildSection, setBuildSection] = useState(null)
  const navigate = useNavigate()
  const sections = buildSections(state)

  function setField(field, value) {
    dispatch({ type: 'SET_FIELD', field, value })
  }

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)

    const id = nanoid(6)

    const { error } = await supabase.from('cards').insert({
      id,
      recipient: state.recipient,
      occasion: state.occasion,
      theme: state.theme,
      emoji: state.emoji,
      sections,
      // Pay-first: this card stays "not sent yet" until the webhook marks it
      // paid. `product` is a label only — the price is derived from the row.
      requires_payment: true,
      product: 'card',
    })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    // To the checkout, not the card: the link is handed over after payment.
    navigate(`/card/${id}/checkout`)
  }

  return (
    <div className={`create-layout theme-${state.theme}`}>
      <div className="scene-card create-card">
        <CreateSwitcher tone="dark" />
        <h1 className="scene-headline">Create a Card</h1>
        <p className="scene-sub">Fill in the details below — we'll turn it into a scrolly card.</p>

        <label className="scene-label">Occasion</label>
        <select
          className="create-input"
          value={state.occasion}
          onChange={(e) => setField('occasion', e.target.value)}
        >
          {OCCASIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>

        <label className="scene-label">Recipient</label>
        <input
          className="create-input"
          type="text"
          placeholder="Who is this for?"
          value={state.recipient}
          onChange={(e) => setField('recipient', e.target.value)}
        />

        <label className="scene-label">Emoji</label>
        <div className="create-pill-row">
          {EMOJIS.map((e) => (
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

        <label className="scene-label">Theme</label>
        <div className="create-pill-row">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className={`create-pill theme-${t} ${state.theme === t ? 'create-pill--active' : ''}`}
              onClick={() => setField('theme', t)}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="scene-label">Hero sub-line</label>
        <input
          className="create-input"
          type="text"
          placeholder="A little tagline under the headline"
          value={state.heroSub}
          onChange={(e) => setField('heroSub', e.target.value)}
        />
        <label className="scene-label">Who you are to me</label>
        <textarea
          className="create-input create-textarea"
          placeholder="Who I see you as"
          value={state.whoText}
          onChange={(e) => setField('whoText', e.target.value)}
        />

        <label className="scene-label">Message</label>
        <textarea
          className="create-input create-textarea"
          placeholder="The main message of the card"
          value={state.message}
          onChange={(e) => setField('message', e.target.value)}
        />

        <label className="scene-label">Memory</label>
        <textarea
          className="create-input create-textarea"
          placeholder="A memory of you I hold tight"
          value={state.memoryText}
          onChange={(e) => setField('memoryText', e.target.value)}
        />
        <label className="scene-label">Closing line</label>
        <input
          className="create-input"
          type="text"
          placeholder="One last line to sign off with"
          value={state.closing}
          onChange={(e) => setField('closing', e.target.value)}
        />

        <button
          type="button"
          className="preview-scroll-btn"
          onClick={() => document.getElementById('card-preview')
            .scrollIntoView({ behavior: 'smooth' })}
        >
          See your card preview ↓
        </button>
        
        {error && <p className="create-error">{error}</p>}

        <button className="cta-button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Card ✨'}
        </button>
      </div>
      <div id='card-preview'>
      <CreatePreview sections={sections} theme={state.theme} emoji={state.emoji}/>
      </div>
    </div>
  )
}
