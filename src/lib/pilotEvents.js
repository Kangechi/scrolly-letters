/* ============================================================
   PILOT EVENTS — the two free cards, as data.

   WHY A FILE AND NOT JUST TYPING INTO THE FORM:
   Both pilots are being built while the features they use are still being
   built. Keeping the copy here means the card can be re-created from
   scratch in one line after a schema change, instead of being retyped into
   a form by hand for the fourth time. Once the events are live and the
   hosts are editing them through /manage, THIS FILE STOPS BEING THE TRUTH —
   the database does. Delete it after the pilots rather than letting it rot
   into a second, quietly wrong copy of the events.

   HOW TO USE IT:
     import { PILOT_EVENTS } from '../lib/pilotEvents'
     setForm({ ...EMPTY_EVENT_FORM, ...PILOT_EVENTS.linkedinLocal })
   ...then save through the normal create flow, so buildEventSections()
   derives the sections exactly as it would for any other host.

   ⚠ EVERY VALUE MARKED `TODO(you)` IS INVENTED. Speaker names, the venue,
   the ticket links, the dates. Replace them before either card is shared —
   a placeholder that ships is indistinguishable from a lie.
   ============================================================ */

/* ── LINE FORMAT ─────────────────────────────────────────────
   `expectedText` and `missText` are newline-separated: ONE LINE PER
   REVEAL. That convention is the whole reason splitLines.js exists —
   before it, a list with no full stops collapsed into one run-on line.

   Keep lines short. Each one is set in Fraunces at ~2rem on a phone, so
   anything past roughly 60 characters wraps and stops reading as a beat.
   ─────────────────────────────────────────────────────────── */

export const PILOT_EVENTS = {
  /* ══════════════════════════════════════════════════════════
     1 · LINKEDIN LOCAL — "Beyond the Paycheck"
     Poster: gold coins settling into black soil, roots running down.
     Palette sampled off that artwork rather than chosen:
       bg      #0A0806  the soil
       accent  #D4B16A  the coin gold
       accent2 #E7E1D7  the poster's own headline white
     The headline gradient therefore runs gold → white, which is the
     poster's move: gold roots climbing into white type.
     ══════════════════════════════════════════════════════════ */
  linkedinLocal: {
    host: 'LinkedIn Local Nairobi',
    emoji: '🌱',
    accent: '#D4B16A',
    accent_2: '#E7E1D7',
    bg: '#0A0806',
    posterUrl: '', // TODO(you): upload the poster, paste the public URL

    eventDate: '2026-09-04', // TODO(you): confirm
    landingTitle: 'You’re invited',
    landingSub: 'Beyond the Paycheck · Making your money work',

    heroHeadline: 'Beyond the Paycheck',
    heroSub: 'Making your money work · LinkedIn Local Nairobi',

    /* The `who` scene. Four speakers, one per line.
       TODO(you): real names, and one honest clause each about what they
       actually did with money — not their job title. The job title is on
       LinkedIn already; that is not why anyone buys a ticket. */
    expectedText: [
      'Wanjiru Kamau — turned one salary into four income lines',
      'David Ochieng — invests in the boring things that compound',
      'Asha Mwangi — built a portfolio on a KES 80k salary',
      'Samuel Kiptoo — the tax and pension rules nobody explains',
    ].join('\n'),

    /* The `message` scene. This is the one that sells the ticket, so it
       argues rather than describes. */
    missText: [
      'Your salary is the smallest thing your money can do.',
      'Most of us never find that out until our forties.',
      'Four people who found out earlier are showing their actual numbers.',
      'Not theory. What they bought, what it returned, what they got wrong.',
    ].join('\n'),

    /* The `memory` scene — sticky emoji, details revealed one line at a
       time. Scarcity goes on the last line so it lands right before the
       ticket button. */
    detailsText: [
      'Thursday 4 September · 5:30 PM', // TODO(you)
      'The Alchemist, Westlands',           // TODO(you)
      '60 seats. It fills in about a week.', // TODO(you): real number
    ].join('\n'),

    /* The closing scene, invite mode. No stars, no textarea — see
       FeedbackScene.jsx. */
    collectFeedback: false,
    closingLabel: 'Save your seat',
    closingSub: 'Tickets are limited — grab yours before the room fills.',
    ctaLabel: 'Get your ticket →',
    ticketUrl: '', // TODO(you): the real ticket link. '' renders as '#'.
    secondCtaLabel: '',
    secondCtaUrl: '',
  },

  /* ══════════════════════════════════════════════════════════
     2 · HACKHOUSE DEMO DAY — Residency Cohort 03
     Poster: a lone mic stand under a spotlight on a navy stage.
     Sampled: bg #0B1A2D, Hackhouse amber #F09018, tagline blue #489CD8.

     ⚠ SCHEMA LIMIT, NOT AN OVERSIGHT: there are only two accent columns
     and this brand has three colours. The amber takes both slots so it can
     carry the labels AND the CTA gradient, and the blue survives only as
     the ground. A third accent column is the open question in the guide.
     ══════════════════════════════════════════════════════════ */
  hackhouseDemoDay: {
    host: 'Hackhouse Africa',
    emoji: '🎤',
    accent: '#F09018',
    accent_2: '#FFD08A',
    bg: '#0B1A2D',
    posterUrl: '', // TODO(you)

    eventDate: '2026-09-20', // TODO(you): confirm
    landingTitle: 'Demo Day',
    landingSub: 'Twelve weeks of building. One night to show it.',

    heroHeadline: 'Demo Day',
    heroSub: 'Hackhouse · Residency Cohort 03',

    /* The `who` scene — the real Cohort 03 lineup, nine startups, taken
       from the speaker brief. Nine lines is the case that broke the reveal:
       index.css only staggered to nth-child(5), so lines 6–9 fired with no
       delay and landed BEFORE lines 2–5. Fixed, but this is the card that
       proves it — if you shorten this list below six, you stop testing it.

       Each line is `Name — what they build`, sector dropped. The sector is
       a category; what they build is a reason to show up. */
    expectedText: [
      'Apartly / DeCrib — fractional property ownership, on-chain',
      'MobiCheque — deposit a cheque from your phone',
      'MediBora — remote monitoring for pregnant mothers',
      'CivicLens — track your county’s leaders and audit reports',
      'KeverdAI — device trust that stops fintech fraud',
      'Space Fika — building Africa’s space talent pipeline',
      'GrupChat — turns group chats into funded action',
      'KashLink — safe payments for social commerce',
      'Earthwise Insights — climate data for the circular economy',
    ].join('\n'),

    /* The `message` scene — the room, not the lineup.
       TODO(you): the capital figures. I have deliberately left them out
       rather than inventing them: a raised-total is the number a founder
       screenshots, and a wrong one is the kind of wrong that gets repeated
       back to you in a room. Add them only if you can source them. */
    missText: [
      'Twelve weeks of building. One night to show it.',
      'Nine teams pitch, eight minutes each.',
      'Fintech, health, climate, civic, space — all in one room.',
      'The investors who backed the last cohort are coming back.',
      'Then the room decides.',
    ].join('\n'),

    detailsText: [
      'Saturday 20 September · 2:00 PM', // TODO(you)
      'Nairobi Garage, Kilimani',            // TODO(you)
      'Doors 1:30 PM. Pitches start sharp.',
    ].join('\n'),

    /* Two ways in — the case the `ctas` array exists for. The cohort link
       is the second button and renders as a ghost, so "come watch" stays
       louder than "come build". Clicks on the two are counted separately
       (cta_id 'ticket' vs 'cohort'), which is the only way to learn whether
       a Demo Day card actually recruits. */
    collectFeedback: false,
    closingLabel: 'Two ways in',
    closingSub: 'Come watch Cohort 03 ship — or get in the room for Cohort 04.',
    ctaLabel: 'Get your seat →',
    ticketUrl: '',        // TODO(you)
    secondCtaLabel: 'Join Cohort 04',
    secondCtaUrl: '',     // TODO(you): the cohort application link
  },
}

/* Both pilots are comped, not sold. Nothing in the app can set that — see
   the commented UPDATE at the bottom of
   sql/2026-08-11_pilot_events.sql, which you run by hand with the
   manage_ids these events get on creation. */
export const PILOT_MANAGE_NOTE =
  'Comp via SQL after creating: set paid = true, comped = true, paid_until = <a week after the event>.'
