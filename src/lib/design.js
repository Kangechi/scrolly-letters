import { STYLES, lookClass } from './styles'

/* ============================================================
   DESIGN — everything the studio can change beyond looks and arrivals:
   the opening, the backdrop, each scene's SHAPE, stickers, and colours.

   Stored as ONE nullable jsonb column (cards.design) plus the three colour
   columns events already use (accent, accent_2, bg). Same safety rules as
   styles.js: every value is checked against a list here, and anything
   unknown resolves to "render the way you always have".

   Pure data + pure functions — no React.
   ============================================================ */

/* ── Scene shapes ─────────────────────────────────────────────
   A SHAPE changes what a scene IS; an ARRIVAL (styles.js) changes how its
   words come in. They combine: a folded letter can still type itself out. */
export const SHAPE_META = {
  message: { letter:    { label: 'Folded letter', blurb: 'unfolds one crease at a time, like paper' } },
  memory:  { polaroid:  { label: 'Polaroid',      blurb: 'a taped photo print that develops as it lands' } },
  who:     { note:      { label: 'Torn note',     blurb: 'a strip of ruled paper, handwritten' } },
  closing: { signature: { label: 'Signature',     blurb: 'signed off by hand' } },
}

export function resolveShape(type, design) {
  const pick = design?.scenes?.[type]
  return pick && SHAPE_META[type]?.[pick] ? pick : null
}

/* ── Openings — what the recipient sees before the card ── */
export const OPENINGS = {
  classic:  { label: 'Classic',             blurb: '“Someone sent you something special” and a Read Me button' },
  envelope: { label: 'Wax-sealed envelope', blurb: 'tap the seal — the flap folds back and the letter rises out' },
}
export const resolveOpening = (design) =>
  (design?.opening && OPENINGS[design.opening] ? design.opening : 'classic')

/* ── Backdrops — the layer behind the scenes ──
   A look brings its own (STYLES[x].backdropId); picking one here overrides it. */
export const BACKDROPS = {
  aurora:   { label: 'Aurora',      blurb: 'the classic drifting colour' },
  paper:    { label: 'Ruled paper', blurb: 'warm paper, faint lines' },
  film:     { label: 'Film',        blurb: 'heavy grain and a soft vignette' },
  halftone: { label: 'Halftone',    blurb: 'a printed dot field' },
}
export function resolveBackdrop(style, design) {
  const pick = design?.backdrop
  if (pick && BACKDROPS[pick]) return pick
  return STYLES[style]?.backdropId ?? 'aurora'
}

/* ── Stickers — a curated set, so a row can't smuggle in arbitrary text ── */
export const STICKERS = ['🌸', '✨', '💌', '🎈', '🌙', '⭐', '🦋', '🍰', '🌻', '💛', '🎀', '🕊️']
export const MAX_STICKERS = 5
export function resolveStickers(design) {
  return (Array.isArray(design?.stickers) ? design.stickers : [])
    .filter((s) => STICKERS.includes(s))
    .slice(0, MAX_STICKERS)
}

/** The wrapper classes for look + backdrop + stickers, and whether the card
    needs its decor layer at all. A plain card gets '' and no layer. */
export function decorClasses(style, design) {
  const look = lookClass(style)
  const backdrop = resolveBackdrop(style, design)
  const stickers = resolveStickers(design)
  const layered = Boolean(look) || backdrop !== 'aurora' || stickers.length > 0
  return {
    className: [layered && 'has-look', look, backdrop !== 'aurora' && `bd-${backdrop}`].filter(Boolean).join(' '),
    layered,
    stickers,
    backdrop,
  }
}

/* ── Colours ──────────────────────────────────────────────── */

/** The site's own palette first — Mauve Dusk, flipped dark so the card's
    light words stay readable — then palettes from our other work. */
export const PALETTES = {
  mauve:   { label: 'Mauve Dusk — our palette', accent: '#d98a9a', accent_2: '#e7ddef', bg: '#26192e' },
  crimson: { label: 'Midnight crimson',         accent: '#ac3030', accent_2: '#efdbbf', bg: '#121211' },
  gold:    { label: 'Black & gold',             accent: '#e3b766', accent_2: '#f6ecd6', bg: '#14110c' },
  forest:  { label: 'Forest',                   accent: '#8fbf7a', accent_2: '#f1e9c9', bg: '#12231a' },
  ocean:   { label: 'Deep ocean',               accent: '#5ec4d6', accent_2: '#d6f1f5', bg: '#0b1f33' },
}

/** The ready-made themes as hex, for swatches and as a starting point when
    someone switches to "your own". Mirrors the .theme-x classes in index.css. */
export const THEME_SWATCH = {
  hue:      ['#c084fc', '#f472b6', '#1a0a2e'],
  mint:     ['#34d399', '#22d3ee', '#0a1f1a'],
  warm:     ['#f59e0b', '#ea580c', '#343817'],
  lovely:   ['#db3e8c', '#ffafeb', '#8d51a8'],
  exec:     ['#f4d08f', '#ede3dd', '#0e2a3f'],
  arsenal:  ['#eadfe0', '#ef0107', '#023474'],
  bubbly:   ['#d99201', '#905a01', '#58761b'],
  blue:     ['#7096d1', '#bad6eb', '#334eac'],
  bold:     ['#1a2730', '#45586c', '#f09475'],
  electric: ['#0090a3', '#87f1ff', '#5fafce'],
  burnt:    ['#b28565', '#908786', '#635d5c'],
}
export const themeColors = (theme) => {
  const [accent, accent_2, bg] = THEME_SWATCH[theme] || THEME_SWATCH.hue
  return { accent, accent_2, bg }
}

const HEX = /^#[0-9a-f]{6}$/i

/** Only well-formed #rrggbb triples survive. These values end up inside an
    inline style, so nothing else — no url(), no stray semicolons — gets in. */
export function cleanColors(c) {
  if (!c || !HEX.test(c.accent || '') || !HEX.test(c.accent_2 || '') || !HEX.test(c.bg || '')) return null
  return { accent: c.accent.toLowerCase(), accent_2: c.accent_2.toLowerCase(), bg: c.bg.toLowerCase() }
}

/** --card-bg has no default: only the .theme-x classes set it. Custom colours
    must supply one, or every scene card goes transparent. A touch of the
    accent mixed into the background keeps the cards distinct from the page. */
export const cardBgOf = (c) => `color-mix(in srgb, ${c.bg} 86%, ${c.accent})`

export function brandStyleOf(c) {
  const k = cleanColors(c)
  if (!k) return undefined
  return { '--accent': k.accent, '--accent-2': k.accent_2, '--bg': k.bg, '--card-bg': cardBgOf(k) }
}

/** The inline colour style for any row. Events keep their exact existing
    behaviour; cards go through cleanColors. */
export function colorStyleOf(card) {
  if (!card) return undefined
  if (card.kind === 'event') {
    return card.accent ? { '--accent': card.accent, '--accent-2': card.accent_2, '--bg': card.bg } : undefined
  }
  return brandStyleOf(card)
}

/** WCAG relative luminance, 0 (black) → 1 (white). */
export function luminance(hex) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** The card's words are near-white (#f4f0ea, luminance ≈ 0.88). For the 4.5:1
    contrast body text needs, the background must sit below ≈ 0.16. */
export const tooLightForText = (bg) => HEX.test(bg || '') && luminance(bg) > 0.16

/* ── Storage ─────────────────────────────────────────────── */

/** What to SAVE: defaults dropped, so an untouched studio stores null and a
    card prices by what was actually customised. */
export function toStoredDesign(d, style) {
  const out = {}
  if (d?.opening && d.opening !== 'classic' && OPENINGS[d.opening]) out.opening = d.opening
  const lookDefault = STYLES[style]?.backdropId ?? 'aurora'
  if (d?.backdrop && BACKDROPS[d.backdrop] && d.backdrop !== lookDefault) out.backdrop = d.backdrop
  const scenes = Object.fromEntries(
    Object.entries(d?.scenes || {}).filter(([type, v]) => v && SHAPE_META[type]?.[v])
  )
  if (Object.keys(scenes).length) out.scenes = scenes
  const stickers = resolveStickers(d)
  if (stickers.length) out.stickers = stickers
  return Object.keys(out).length ? out : null
}
