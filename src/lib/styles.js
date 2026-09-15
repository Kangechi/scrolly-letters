/* ============================================================
   STYLES — the looks a card can wear (Create Studio, Phase 2).

   Code, not database rows: adding a look is a deploy, reverting one is a
   revert. A card stores only a NAME (cards.style) and an optional map of
   per-scene picks (cards.style_overrides). Everything else lives here.

   Resolution is total. An unknown look, a partial look, a misspelt look, or
   a scene type a look never mentions ALL fall back to `null` — which means
   "render exactly as today, CSS stagger and all". No card can render blank
   because of this file.

   Pure data + pure functions: imported by the React app AND (via pricing)
   safe for the /api routes. No React in here.
   ============================================================ */

/** The vetted arrivals — the only names a look or an override may use.
    Components live in src/components/arrivals/. */
export const ARRIVAL_META = {
  letterReveal: { label: 'Letter by letter', blurb: 'each character arrives on its own beat' },
  maskReveal:   { label: 'Rise into frame',  blurb: 'lines slide up out of a hidden edge' },
  inkReveal:    { label: 'Ink',              blurb: 'written left to right, like a pen' },
  typewriter:   { label: 'Typewriter',       blurb: 'typed out, caret and all' },
  scramble:     { label: 'Decode',           blurb: 'letters scramble, then settle' },
}

/** A look = a backdrop + a coherent arrival for each scene type, designed
    together. `cinematic` is DELIBERATELY partial (no memory, no closing) so
    the fallback path runs in production from day one, not on the day
    someone forgets an entry. */
export const STYLES = {
  plain: {
    label: 'Plain',
    blurb: 'The classic Scrolly card',
    backdrop: 'Aurora',
    backdropId: 'aurora',
    arrivals: {},
  },
  handwritten: {
    label: 'Handwritten',
    blurb: 'Ink on warm, ruled paper',
    backdrop: 'Ruled paper',
    backdropId: 'paper',
    arrivals: {
      hero: 'inkReveal', who: 'inkReveal', message: 'inkReveal',
      memory: 'inkReveal', closing: 'letterReveal',
    },
  },
  cinematic: {
    label: 'Cinematic',
    blurb: 'Film grain, lines rising into frame',
    backdrop: 'Film',
    backdropId: 'film',
    arrivals: { hero: 'maskReveal', who: 'maskReveal', message: 'letterReveal' },
  },
  collage: {
    label: 'Collage',
    blurb: 'Decoded headlines, typed notes',
    backdrop: 'Halftone',
    backdropId: 'halftone',
    arrivals: {
      hero: 'scramble', who: 'letterReveal', message: 'typewriter',
      memory: 'maskReveal', closing: 'scramble',
    },
  },
}

/** Display order in the studio's Looks rail. */
export const LOOK_ORDER = ['plain', 'handwritten', 'cinematic', 'collage']

/** Scene types a sender may re-pick an arrival for. `feedback` is events-only. */
export const PICKABLE_SCENES = ['hero', 'who', 'message', 'memory', 'closing']

/** Which arrival does this scene get?
    Read the chain right to left — it's a safety argument:
      per-scene override → the look's choice → null (today's CSS reveal).
    The override 'none' forces the plain reveal for one scene. Any name not in
    ARRIVAL_META (typo, removed arrival, hostile row) resolves to null. */
export function resolveArrival(type, style, overrides) {
  const pick = overrides?.[type] ?? STYLES[style]?.arrivals?.[type] ?? null
  return pick && ARRIVAL_META[pick] ? pick : null
}

/** CSS class for a look's backdrop. Only real, non-plain looks get one —
    "hadnwritten" gets nothing and renders as a plain card. */
export function lookClass(style) {
  return style && style !== 'plain' && STYLES[style] ? `look-${style}` : ''
}

/** What to STORE. Plain with no picks stores nothing, so it prices as a
    plain card (productOf in pricing.js reads these same two columns). */
export function toStoredStyle(look, overrides) {
  const cleaned = Object.fromEntries(
    Object.entries(overrides || {}).filter(([, v]) => v != null)
  )
  return {
    style: look && look !== 'plain' ? look : null,
    style_overrides: Object.keys(cleaned).length ? cleaned : null,
  }
}
