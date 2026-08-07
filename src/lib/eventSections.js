/* ============================================================
   EVENT SECTIONS — the single source of truth for how an event's
   flat form fields become the `sections` JSONB that the scenes render,
   and how they come back OUT again when a host reopens their event.

   WHY THIS FILE EXISTS (the bug it kills):
   `sections` used to be written exactly once, at creation, inside
   Create_event.jsx. The manage page then edited the *columns*
   (`ticket_url`, `cta_label`, …). But FeedbackScene renders
   `data.cta.href` — which lives in SECTIONS. So a host who changed
   their ticket link saw "Saved ✓" and their guests still went to the
   old URL. No error, no log: the classic wrong-key silent failure.

   THE FIX IS STRUCTURAL, NOT A PATCH. The flat form is the only thing
   anyone edits. `sections` is DERIVED from it on every save:

       form  ──build──▶  sections (JSONB)  ──▶  rendered scenes
         │
         └──────────▶  columns (host, ticket_url, …)

   Two outputs, one input — so they cannot disagree. `parseEventForm`
   is the inverse: it reads a saved row back into the form, which is
   what lets a host reopen an event and still see everything they
   already wrote instead of a blank slate.
   ============================================================ */

export const EVENT_EMOJIS = ['🎉', '🎟️', '♟️', '🤖', '🎤', '🥂', '📅', '✨', '🔥', '💡']

/* The shape of the form, and the defaults a brand-new event starts from.
   Keys are camelCase here (React side); `formToColumns` renames them to the
   table's snake_case at the boundary — mapping once, in one place. */
export const EMPTY_EVENT_FORM = {
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

/* Every scene type an event is allowed to contain. The SQL guard in
   `update_event` carries the SAME list — a patch containing anything else is
   rejected there, so this isn't the only line of defence. SCENE_MAP also has
   `closing` (Outro), deliberately excluded: that scene is the card share +
   payment flow, which an event invite must never render. */
export const EVENT_SCENE_TYPES = ['hero', 'who', 'message', 'memory', 'feedback']

/* Turn the flat form into the sections[] array CardPage/ScrollPage renders.
   Each object's keys MUST match what its scene component reads:
     hero     → headline, sub
     who      → headline, text
     message  → sub, text
     memory   → label, text
     feedback → label, prompt, cta{label, href}
   Optional middle scenes drop out when left blank (.filter(Boolean)), so an
   event with nothing to say about "what to expect" simply has no such scene
   rather than an empty one. */
export function buildEventSections(state) {
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
      // The ONE place the ticket link is written into a scene. Because this
      // now re-runs on every save, it can never fall behind the column.
      cta: { label: state.ctaLabel, href: state.ticketUrl || '#' },
    },
  ].filter(Boolean)
}

/* A missing scene is an expected outcome (blank fields drop out), so return an
   empty object rather than undefined — the caller can then read `.text` off it
   without a guard at every call site. */
function sceneOf(sections, type) {
  const list = Array.isArray(sections) ? sections : []
  return list.find((s) => s?.type === type) || {}
}

/* The inverse of buildEventSections: a saved DB row → the flat form.
   This is what "keeps note of what the host already wrote" — the scene copy
   exists ONLY inside the sections JSONB (there are no hero_headline /
   expected_text columns), so without this a host reopening their event would
   get empty textareas and unknowingly blank their own scenes on the next save. */
export function parseEventForm(row) {
  if (!row) return { ...EMPTY_EVENT_FORM }

  const hero     = sceneOf(row.sections, 'hero')
  const who      = sceneOf(row.sections, 'who')
  const message  = sceneOf(row.sections, 'message')
  const memory   = sceneOf(row.sections, 'memory')
  const feedback = sceneOf(row.sections, 'feedback')

  /* '#' is the placeholder buildEventSections writes when there is no ticket
     link. Reading it back as a real URL would put a literal "#" in the field. */
  const bakedHref = feedback.cta?.href && feedback.cta.href !== '#' ? feedback.cta.href : ''

  return {
    host:      row.host      ?? '',
    emoji:     row.emoji     || EMPTY_EVENT_FORM.emoji,
    accent:    row.accent    || EMPTY_EVENT_FORM.accent,
    accent_2:  row.accent_2  || EMPTY_EVENT_FORM.accent_2,
    bg:        row.bg        || EMPTY_EVENT_FORM.bg,

    eventDate:    row.event_date    ?? '',
    landingTitle: row.landing_title ?? '',
    landingSub:   row.landing_sub   ?? '',
    // Column first, baked-in href as fallback: rows saved BEFORE this fix can
    // have the two disagreeing, and the column is the one the old manage form
    // was actually writing to — so it holds the host's most recent intent.
    ctaLabel:  row.cta_label ?? feedback.cta?.label ?? '',
    ticketUrl: row.ticket_url || bakedHref,

    heroHeadline:    hero.headline ?? '',
    heroSub:         hero.sub      ?? '',
    expectedText:    who.text      ?? '',
    missText:        message.text  ?? '',
    detailsText:     memory.text   ?? '',
    questionsPrompt: feedback.prompt ?? EMPTY_EVENT_FORM.questionsPrompt,
  }
}

/* camelCase form → snake_case table columns. Note what is NOT here:
   `paid`, `paid_until`, `id`, `manage_id`. Money and identity are not
   editable data, and leaving them out of this function means no caller can
   accidentally include them — the same by-construction argument the
   `update_event` RPC's explicit column list makes on the server. */
export function formToColumns(state) {
  return {
    host:          state.host,
    emoji:         state.emoji,
    accent:        state.accent,
    accent_2:      state.accent_2,
    bg:            state.bg,
    // '' would break a DATE column; null is how you say "no date".
    event_date:    state.eventDate || null,
    landing_title: state.landingTitle,
    landing_sub:   state.landingSub,
    cta_label:     state.ctaLabel,
    ticket_url:    state.ticketUrl,
  }
}
