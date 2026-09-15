import { useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase'
import CreatePreview from '../components/CreatePreview'
import OpeningPreview from '../components/OpeningPreview'
import CreateSwitcher from '../components/CreateSwitcher'
import { OCCASIONS, THEMES, EMOJIS, initialState, reducer, buildSections } from '../lib/cardForm'
import {
  STYLES, LOOK_ORDER, ARRIVAL_META, PICKABLE_SCENES, resolveArrival, toStoredStyle,
} from '../lib/styles'
import {
  SHAPE_META, OPENINGS, BACKDROPS, STICKERS, MAX_STICKERS, PALETTES, THEME_SWATCH,
  resolveBackdrop, resolveOpening, resolveShape, brandStyleOf, cleanColors, themeColors,
  tooLightForText, toStoredDesign,
} from '../lib/design'
import { priceForCard, productOf } from '../lib/pricing'

/* ============================================================
   CUSTOMIZE — the studio (Create Studio, Phase 3 → v2). The premium path.

   Built like the Motion Lab, in the site's Mauve Dusk palette:
     LEFT   a categories list (Your card · The opening · Scenes), each item
            showing its current value underneath — pick one to edit it
     CENTRE the stage: the card in a phone frame, or its opening
     RIGHT  the rail: Controls for the selected item | How it works
   and a bottom bar with the live price and "Create & pay →".

   Everything is chosen from vetted lists — looks, palettes, shapes,
   arrivals, backdrops, stickers — except colours, where the sender can pick
   any three and gets a readability warning instead of a wall. The preview
   resolves every choice through the SAME functions the live card uses.
   ============================================================ */

/* Sample words, so the first thing you see is a card moving. Real values —
   the preview shows exactly what would be saved — and one button clears them. */
const SAMPLE = {
  occasion: 'Birthday',
  theme: 'hue',
  emoji: '✨',
  recipient: 'Amani',
  heroSub: 'For the one who makes ordinary days feel like a holiday',
  whoText: 'The first person I call.\nThe last one to give up on me.',
  message: 'You never ask for much.\nSo here is a whole card, just for you.\nThank you for every small, patient thing.',
  memoryText: 'That rainy evening in Naivasha when the car broke down and you made it the best night of the trip.',
  closing: 'Always in your corner',
}
const WRITTEN_FIELDS = ['recipient', 'heroSub', 'whoText', 'message', 'memoryText', 'closing']

const SCENE_NAMES = {
  hero: 'Opening line', who: 'Who you are to me', message: 'Message', memory: 'Memory', closing: 'Closing',
}

/* The rail's "How it works" tab — the lab's teaching notes, for senders. */
const NOTES = {
  words: 'Everything the card says. Sample words are filled in so you can watch the card move — they are real, so clear them before you create.',
  look: 'A look is a set of choices designed together: a typeface, a backdrop and how each scene’s words arrive. Start from one — everything in it can still be changed in the other categories.',
  colours: 'Themes are ready-made. Palettes include Mauve Dusk, the site’s own colours. “Your own” lets you pick any three — the card’s words are light, so keep the background dark enough to read.',
  backdrop: 'The layer behind the scenes. Pure CSS — the ruled lines are a repeating gradient and the halftone is one dot tiled every 14px — so it costs nothing to load.',
  stickers: `Up to ${MAX_STICKERS}, placed down the sides of the card so they never sit on the words. Each floats on its own gentle loop.`,
  opening: 'What they see before the card. The envelope is the one from the anniversary card: tap the wax seal, the flap folds back and the letter rises out. Then the card begins.',
  scene: 'Shape changes what a scene IS — a folded letter, a polaroid, a torn note, a signature. Arrival changes how its words come in. Both come from vetted lists, so the card can’t end up broken.',
}

const TITLES = {
  words: ['Words', 'the letter itself'],
  look: ['Look', 'a starting point, designed as a whole'],
  colours: ['Colours', 'themes, palettes, or your own'],
  backdrop: ['Backdrop', 'the layer behind the scenes'],
  stickers: ['Stickers', 'a few things floating down the sides'],
  opening: ['Opening', 'what they see before the card'],
}

export default function Customize() {
  const [state, dispatch] = useReducer(reducer, { ...initialState, ...SAMPLE })
  const [look, setLook] = useState('handwritten')
  const [overrides, setOverrides] = useState({})
  // The studio opens showing off: envelope, a polaroid memory, two stickers.
  const [design, setDesign] = useState({
    opening: 'envelope', backdrop: null, scenes: { memory: 'polaroid' }, stickers: ['🌸', '✨'],
  })
  const [colors, setColors] = useState(null)        // null → use the theme
  const [paletteId, setPaletteId] = useState(null)
  const [active, setActive] = useState('look')
  const [tab, setTab] = useState('controls')
  const [replayKey, setReplayKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value })
  const replay = () => setReplayKey((k) => k + 1)

  // ── Derived every render, never stored, so nothing can drift ──
  const sections = buildSections(state)
  const stored = toStoredStyle(look, overrides)
  const storedDesign = toStoredDesign(design, look)
  const cleaned = cleanColors(colors)
  const colorStyle = brandStyleOf(cleaned)
  const priceKes = priceForCard({ sections, ...stored, design: storedDesign, ...(cleaned || {}) }) / 100

  const activeScene = active.startsWith('scene:') ? active.slice(6) : null
  const selectedIndex = activeScene ? sections.findIndex((s) => s.type === activeScene) : -1
  const currentColors = cleaned || themeColors(state.theme)

  // ── Handlers ──
  function choose(id) {
    setActive(id)
    setTab('controls')
  }
  function chooseLook(id) {
    setLook(id)
    replay()
  }
  function patchDesign(patch) {
    setDesign((d) => ({ ...d, ...patch }))
    replay()
  }
  function setSceneShape(type, value) {
    setDesign((d) => ({ ...d, scenes: { ...d.scenes, [type]: value } }))
    replay()
  }
  function pickArrival(type, value) {
    setOverrides((o) => ({ ...o, [type]: value }))
    replay()
  }
  function toggleSticker(s) {
    setDesign((d) => {
      const has = d.stickers.includes(s)
      if (!has && d.stickers.length >= MAX_STICKERS) return d
      return { ...d, stickers: has ? d.stickers.filter((x) => x !== s) : [...d.stickers, s] }
    })
  }
  function pickTheme(t) {
    setField('theme', t)
    setColors(null)
    setPaletteId(null)
  }
  function pickPalette(id) {
    const { accent, accent_2, bg } = PALETTES[id]
    setColors({ accent, accent_2, bg })
    setPaletteId(id)
  }
  function setColor(key, value) {
    setColors((c) => ({ ...(c || themeColors(state.theme)), [key]: value }))
    setPaletteId(null)
  }
  function selectScene(i) {
    const type = sections[i]?.type
    if (PICKABLE_SCENES.includes(type)) choose(`scene:${type}`)
  }
  function clearSample() {
    WRITTEN_FIELDS.forEach((f) => setField(f, ''))
  }

  async function handleCreate() {
    if (!state.message.trim()) {
      setError('Write your message first — it’s the heart of the card.')
      choose('words')
      return
    }
    setError(null)
    setSubmitting(true)

    const id = nanoid(6)
    const row = {
      id,
      recipient: state.recipient,
      occasion: state.occasion,
      theme: state.theme,
      emoji: state.emoji,
      sections,
      ...stored,                  // style, style_overrides
      design: storedDesign,       // opening, backdrop, shapes, stickers
      ...(cleaned || {}),         // accent, accent_2, bg — only when chosen
      requires_payment: true,
    }
    // `product` is a label for humans reading the table; the server still
    // derives the PRICE from the row itself.
    const { error } = await supabase.from('cards').insert({ ...row, product: productOf(row) })
    setSubmitting(false)

    if (error) {
      setError(/style|design|accent|column/.test(error.message)
        ? 'The studio isn’t switched on in the database yet — run sql/2026-09-15_create_studio_styles.sql.'
        : error.message)
      return
    }
    navigate(`/card/${id}/checkout`)
  }

  // ── Sidebar ──
  function sceneSummary(type) {
    const shape = resolveShape(type, design)
    const arrival = resolveArrival(type, look, overrides)
    return [shape && SHAPE_META[type][shape].label, arrival ? ARRIVAL_META[arrival].label : 'plain fade']
      .filter(Boolean).join(' · ')
  }
  const groups = [
    {
      label: 'Your card',
      items: [
        { id: 'words', label: 'Words', sub: state.recipient ? `for ${state.recipient}` : 'the letter itself' },
        { id: 'look', label: 'Look', sub: STYLES[look].label },
        { id: 'colours', label: 'Colours', sub: paletteId ? PALETTES[paletteId].label : cleaned ? 'your own' : `theme · ${state.theme}` },
        { id: 'backdrop', label: 'Backdrop', sub: BACKDROPS[resolveBackdrop(look, design)].label },
        { id: 'stickers', label: 'Stickers', sub: design.stickers.length ? design.stickers.join(' ') : 'none' },
      ],
    },
    {
      label: 'The opening',
      items: [{ id: 'opening', label: 'Opening', sub: OPENINGS[resolveOpening(design)].label }],
    },
    {
      label: 'Scenes',
      items: sections
        .filter((s) => PICKABLE_SCENES.includes(s.type))
        .map((s) => ({ id: `scene:${s.type}`, label: SCENE_NAMES[s.type], sub: sceneSummary(s.type) })),
    },
  ]

  const [title, blurb] = activeScene
    ? [SCENE_NAMES[activeScene], 'its shape, and how its words arrive']
    : TITLES[active]

  // ── Rail: one controls panel per item ──
  function OptionList({ options, current, onPick }) {
    return (
      <div className="arrival-list">
        {options.map((opt) => (
          <button
            key={opt.value ?? 'default'}
            type="button"
            className={`arrival-option ${current === opt.value ? 'arrival-option--on' : ''}`}
            aria-pressed={current === opt.value}
            onClick={() => onPick(opt.value)}
          >
            <span className="arrival-option-name">{opt.label}</span>
            {opt.blurb && <span className="arrival-option-blurb">{opt.blurb}</span>}
          </button>
        ))}
      </div>
    )
  }

  function renderControls() {
    if (active === 'words') {
      return (
        <div className="studio-form">
          <label className="studio-label">Occasion</label>
          <select className="create-input" value={state.occasion} onChange={(e) => setField('occasion', e.target.value)}>
            {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <label className="studio-label">Recipient</label>
          <input className="create-input" value={state.recipient} placeholder="Who is this for?"
            onChange={(e) => setField('recipient', e.target.value)} />
          <label className="studio-label">Opening line</label>
          <input className="create-input" value={state.heroSub} placeholder="A little tagline under the headline"
            onChange={(e) => setField('heroSub', e.target.value)} />
          <label className="studio-label">Who you are to me <em>optional</em></label>
          <textarea className="create-input create-textarea" value={state.whoText}
            onChange={(e) => setField('whoText', e.target.value)} />
          <label className="studio-label">Message</label>
          <textarea className="create-input create-textarea" value={state.message}
            onChange={(e) => setField('message', e.target.value)} />
          <label className="studio-label">A memory <em>optional</em></label>
          <textarea className="create-input create-textarea" value={state.memoryText}
            onChange={(e) => setField('memoryText', e.target.value)} />
          <label className="studio-label">Closing line</label>
          <input className="create-input" value={state.closing}
            onChange={(e) => setField('closing', e.target.value)} />
          <label className="studio-label">Emoji</label>
          <div className="st-stickers">
            {EMOJIS.map((e) => (
              <button key={e} type="button" className={`st-sticker ${state.emoji === e ? 'st-sticker--on' : ''}`}
                aria-pressed={state.emoji === e} onClick={() => setField('emoji', e)}>{e}</button>
            ))}
          </div>
          <button type="button" className="studio-btn studio-btn--quiet" onClick={clearSample}>
            Clear the sample words
          </button>
        </div>
      )
    }

    if (active === 'look') {
      return (
        <div className="look-list">
          {LOOK_ORDER.map((id) => (
            <button key={id} type="button" className={`look-option ${look === id ? 'look-option--on' : ''}`}
              aria-pressed={look === id} onClick={() => chooseLook(id)}>
              <span className="look-option-name">{STYLES[id].label}</span>
              <span className="look-option-blurb">{STYLES[id].blurb}</span>
              <span className="look-option-backdrop">Backdrop · {STYLES[id].backdrop}</span>
            </button>
          ))}
        </div>
      )
    }

    if (active === 'colours') {
      return (
        <>
          <div className="st-ctrl">
            <div className="st-ctrl-head"><b>Themes</b> ready-made</div>
            <div className="st-swatches">
              {THEMES.map((t) => {
                const [a, b, bg] = THEME_SWATCH[t]
                return (
                  <button key={t} type="button" title={t} aria-label={`Theme ${t}`}
                    className={`st-swatch ${!cleaned && state.theme === t ? 'st-swatch--on' : ''}`}
                    style={{ background: `linear-gradient(135deg, ${a}, ${b} 50%, ${bg} 51%)` }}
                    onClick={() => pickTheme(t)} />
                )
              })}
            </div>
          </div>

          <div className="st-ctrl">
            <div className="st-ctrl-head"><b>Palettes</b> including ours</div>
            <div className="st-palettes">
              {Object.entries(PALETTES).map(([id, p]) => (
                <button key={id} type="button"
                  className={`st-palette ${paletteId === id ? 'st-palette--on' : ''}`}
                  aria-pressed={paletteId === id} onClick={() => pickPalette(id)}>
                  <span className="st-palette-dots" aria-hidden="true">
                    <i style={{ background: p.bg }} /><i style={{ background: p.accent }} /><i style={{ background: p.accent_2 }} />
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="st-ctrl">
            <div className="st-ctrl-head"><b>Your own</b> any three colours</div>
            <div className="st-colors">
              {[['accent', 'Accent'], ['accent_2', 'Second'], ['bg', 'Background']].map(([key, label]) => (
                <label key={key} className="st-color">
                  <input type="color" value={currentColors[key]} onChange={(e) => setColor(key, e.target.value)} />
                  {label}
                </label>
              ))}
            </div>
            {tooLightForText(currentColors.bg) && (
              <p className="st-warn" role="status">
                This background is light — the card’s words are near-white, so they may be hard to read.
                Try a darker background.
              </p>
            )}
          </div>
        </>
      )
    }

    if (active === 'backdrop') {
      const lookDefault = STYLES[look].backdropId
      return (
        <OptionList
          current={design.backdrop}
          onPick={(v) => patchDesign({ backdrop: v })}
          options={[
            { value: null, label: `Look default — ${BACKDROPS[lookDefault].label}`, blurb: `whatever ${STYLES[look].label} uses` },
            ...Object.entries(BACKDROPS).map(([value, b]) => ({ value, ...b })),
          ]}
        />
      )
    }

    if (active === 'stickers') {
      return (
        <div className="st-ctrl">
          <div className="st-ctrl-head"><b>{design.stickers.length}</b> of {MAX_STICKERS} chosen</div>
          <div className="st-stickers">
            {STICKERS.map((s) => (
              <button key={s} type="button" className={`st-sticker ${design.stickers.includes(s) ? 'st-sticker--on' : ''}`}
                aria-pressed={design.stickers.includes(s)} onClick={() => toggleSticker(s)}>{s}</button>
            ))}
          </div>
          <button type="button" className="studio-btn studio-btn--quiet" onClick={() => patchDesign({ stickers: [] })}>
            Remove all stickers
          </button>
        </div>
      )
    }

    if (active === 'opening') {
      return (
        <OptionList
          current={resolveOpening(design)}
          onPick={(v) => patchDesign({ opening: v })}
          options={Object.entries(OPENINGS).map(([value, o]) => ({ value, ...o }))}
        />
      )
    }

    if (activeScene) {
      const shapes = SHAPE_META[activeScene]
      const lookDefault = resolveArrival(activeScene, look, null)
      return (
        <>
          {shapes && (
            <div className="st-ctrl">
              <div className="st-ctrl-head"><b>Shape</b> what the scene is</div>
              <OptionList
                current={resolveShape(activeScene, design)}
                onPick={(v) => setSceneShape(activeScene, v)}
                options={[
                  { value: null, label: 'Card', blurb: 'the classic scene card' },
                  ...Object.entries(shapes).map(([value, s]) => ({ value, ...s })),
                ]}
              />
            </div>
          )}
          <div className="st-ctrl">
            <div className="st-ctrl-head"><b>Arrival</b> how the words come in</div>
            <OptionList
              current={overrides[activeScene] ?? null}
              onPick={(v) => pickArrival(activeScene, v)}
              options={[
                {
                  value: null,
                  label: `Look default — ${lookDefault ? ARRIVAL_META[lookDefault].label : 'Plain fade'}`,
                  blurb: `whatever ${STYLES[look].label} chose`,
                },
                ...Object.entries(ARRIVAL_META).map(([value, m]) => ({ value, ...m })),
                { value: 'none', label: 'Plain fade', blurb: 'the classic Scrolly reveal' },
              ]}
            />
          </div>
        </>
      )
    }
    return null
  }

  return (
    <div className="studio studio--lab">
      {/* ───────────── LEFT: categories, like the lab's sidebar ───────────── */}
      <aside className="studio-rail studio-looks st-sidebar">
        <div className="studio-head">
          <CreateSwitcher />
          <h1>Customize <span aria-hidden="true">✦</span></h1>
          <p>Pick anything on the left. Tap any scene on the card to jump to it.</p>
        </div>
        <div className="st-sidebar-scroll">
          {groups.map((g) => (
            <div className="st-cat" key={g.label}>
              <div className="st-cat-label">{g.label}</div>
              {g.items.map((it) => (
                <button key={it.id} type="button" className={`st-item ${active === it.id ? 'st-item--on' : ''}`}
                  aria-current={active === it.id ? 'true' : undefined} onClick={() => choose(it.id)}>
                  {it.label}
                  <span className="st-item-sub">{it.sub}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* ───────────── CENTRE: the stage ───────────── */}
      <main className="studio-stage">
        <div className="studio-topbar">
          <span className="studio-topbar-look">{title}</span>
          <span className="studio-topbar-hint">{blurb}</span>
          <button type="button" className="studio-btn" onClick={replay}>↻ Replay</button>
        </div>
        <div className="st-stage-wrap">
          <div className="st-phone">
            {active === 'opening' ? (
              <OpeningPreview
                key={replayKey}
                opening={resolveOpening(design)}
                theme={state.theme}
                colorStyle={colorStyle}
                emoji={state.emoji}
                recipient={state.recipient}
              />
            ) : (
              <CreatePreview
                sections={sections}
                theme={state.theme}
                emoji={state.emoji}
                style={stored.style}
                overrides={stored.style_overrides}
                design={design}
                colors={cleaned}
                replayKey={replayKey}
                selectedIndex={selectedIndex >= 0 ? selectedIndex : null}
                onSelectScene={selectScene}
              />
            )}
          </div>
        </div>
      </main>

      {/* ───────────── RIGHT: the rail ───────────── */}
      <aside className="studio-rail studio-panel">
        <div className="studio-tabs" role="tablist">
          {[['controls', 'Controls'], ['notes', 'How it works']].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id}
              className={`studio-tab ${tab === id ? 'studio-tab--on' : ''}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'controls'
          ? renderControls()
          : <p className="st-notes">{NOTES[activeScene ? 'scene' : active]}</p>}
      </aside>

      {/* ───────────── BOTTOM: price + create ───────────── */}
      <footer className="studio-bar">
        <div className="studio-bar-price">
          <span className="studio-bar-kes">KES {priceKes}</span>
          <span className="studio-bar-sub">Custom card · pay at checkout · schedule it there too</span>
        </div>
        {error && <p className="create-error studio-bar-error">{error}</p>}
        <button type="button" className="st-cta" onClick={handleCreate} disabled={submitting}>
          {submitting ? 'Creating…' : 'Create & pay →'}
        </button>
      </footer>
    </div>
  )
}
