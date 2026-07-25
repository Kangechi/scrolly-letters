# Progress Tracker

This is the file that keeps track of all that we do & even acts as a documentation that I can refer to & get a glimpse of every change, error , implemenation update and everything that took place in a session.

## Current Phase

- **Session of Sat 25 Jul — EVENTS track: pressure-test complete, build guide next.** Chose Events over Customize for today. Ran the Socratic assumption-break first (per AI-Workflow rules). All major forks resolved — see "Event System — Spec v1" below. Next deliverable is a BUILD GUIDE (not code) for the self-serve event builder.
- **Session of Mon 20 Jul (7pm) — LANDING COMPLETE.** Goals 1, 2, 3 done + partial 5 (pricing shown). Create/Customize/Event scaffolded for solo work tomorrow. Build guide shipped.
- Build guide (interactive): artifact https://claude.ai/code/artifact/40359774-5d7b-4a71-9bfa-67b1ee97460d — also saved in repo at `scrolly-letters-landing-build-guide.html`.

## Event System — Spec v1 (resolved Sat 25 Jul via Socratic pressure-test)

Broke the assumptions baked into the `Create_event.jsx` scaffold before writing anything. Decisions:

1. **Storage = self-serve → new Supabase `events` table.** The scaffold's "events live in the local bundle" note was a contradiction: a stranger org filling a live form CANNOT write to `cards_data.jsx`. The 2 existing demos (Mctaba, LinkedIn Local) STAY in the bundle; real orgs go to the DB. `CardPage.jsx` already reads local-first then falls back to DB — extend that path to the new table.
2. **Identity = two capabilities, no login (yet).** Mint two `nanoid`s per event: a public `id` (the invite/share URL) + a secret `manage_id` (edit the event + read its feedback). Chosen over "mirror cards exactly" because events have a lifecycle cards don't — editing (typo/venue/date fixes without breaking sent invites) and a private feedback inbox (`events_feedback` already keyed by `event_id`). This is the on-ramp to full org accounts later (an account "adopts" events by manage_id); full accounts DEFERRED (feature/scaling).
3. **Branding = runtime hex data, NOT `.theme-x` classes.** Self-serve forces this: a stranger can't ship a CSS class. Store `accent`, `accent_2`, `bg` (+ confetti colours) as data; apply as inline CSS vars (`style={{'--accent': …}}`) at runtime. The hardcoded `.theme-mctaba/.theme-linkedlocal` classes + the confetti map in CardPage.jsx are DEMO-ONLY; do not extend that pattern for real orgs.
4. **Scenes = reuse SCENE_MAP, remap meaning.** Event scenes (Hero / What to expect / Why-not-miss / Details / Questions-to-host+CTA) map onto existing hero/who/message/memory/feedback. `sections[]` stored as JSONB, same as cards.
5. **Ticketing = link-out, no payment code.** Store `ticket_url` (org's own external Eventbrite/WhatsApp/site link) + `cta_label`. Clicking leaves the platform — the money never touches us, so NO marketplace/escrow. Pair with a "share to a friend" button (copies invite URL) — free, works for paid AND free events. Rationale: the 2 demos already disagree (Mctaba free vs LinkedIn Local KES 2,200 paid), so "Get ticket" is not universal.
6. **Security posture = RLS + basic guardrails (chosen now, not deferred).** Anonymous insert to a public `events` table = brand-impersonation + spam risk. Add a Supabase RLS insert policy + validation. NOTE: gating manage-writes to "only holder of manage_id" under RLS + anon key is NOT a one-line policy — plan a `security definer` RPC that takes manage_id. To be taught in the build guide.
7. **Revenue model = org pays YOU to run the event for a chosen duration (resolved Sat 25 Jul).** Org pays **KES 500 × duration units** via Paystack — this is YOUR money (like cards), NOT ticket money, so still no marketplace. The 500 buys the whole lifecycle live for the window: Invite → Expectations → RSVP → Buy-ticket(link-out) → Feedback. **Unit = 14 days (bi-weekly) = KES 500** (CONFIRMED Sat 25 Jul). e.g. 28 days = KES 1,000. Payment GATES publishing: form → DRAFT (unpaid, private) → pay → LIVE with a `paid_until` timestamp.
8. **Lifecycle + expiry.** State machine: DRAFT → (pay) → LIVE (`paid=true AND now() < paid_until`) → ENDED. **`paid_until` IS the RLS visibility gate** — payment and security collapse into one column. On expiry the URL shows a graceful **"This event has ended"** (invite/RSVP/ticket links go dead). A permanent post-event recap (Mctaba-style) is a SEPARATE future feature, not in scope.

### Execution plan (Sat 25 Jul)
All 6 units today, taken in BLOCKS. Loop per block: Claude teaches concept-first (concept + code-to-type + why + visual) → USER writes the code → Claude verifies → iterate to next. Start = Block 1 (Units 1 + 2: data layer + branding-as-data).

**BLOCK 1 — DONE & VERIFIED (Sat 25 Jul, `npm run build` green).**
- Unit 1 (data layer): `events` table + RLS (public reads live only `paid AND now()<paid_until`; public inserts drafts only `with check (paid=false)`; no public update/delete). `update_event(manage_id, patch)` + `get_event_feedback(manage_id)` SECURITY DEFINER RPCs (search_path pinned; can't touch paid/paid_until/id/manage_id). `events_feedback` locked to ONE insert policy (guarded: only live events) after we hit the classic RLS trap — **two permissive INSERT policies OR together, so the loose `with check(true)` nullified the guarded one; fix = drop the loose policy.** Feedback readable only via the RPC. `events_feedback` cols confirmed: id/event_id/rating/comment/created_at.
- Unit 2 (branding-as-data): retired `.theme-x` as the only source. `ScrollPage.jsx` + `CardPage.jsx` now compute `brandStyle = card.accent ? {'--accent','--accent-2','--bg'} : undefined` and `className='... ${card.accent ? "" : "theme-"+card.theme}'`; confetti reads `card.accent ? [accent,accent_2,bg,'#fff'] : CONFETTI_THEMES[theme]`. Bug caught: missing space in `landing${...}` merged classnames — fixed to `landing ${...}`. LESSON: scenes are generic `var(--accent)` CONSUMERS; CSS vars inherit down the DOM, so setting them on the wrapper (class OR inline) re-themes the whole tree — zero scene files touched.
- Perf note (deferred): bundle >500kB, Vite suggests code-splitting. Not urgent.

**BLOCK 2 — Unit 3 (builder form) DONE; live preview (3c) + Units 4–6 deferred to next session.**
Extended `Create_event.jsx` from scaffold → full self-serve builder. User drafted the reducer/buildSections/handleSubmit skeleton (strong intuition: imported useReducer/useNavigate/supabase unprompted; `who`+`hero` scene mappings correct first try). Claude finished + fixed, all explained (items 1–7):
1. **Handler bug** — inputs called `set(...)` but handler was `setField`; also `setField(field,value)` can't take a raw event. Fixed with a curried factory `const bind = (field) => (e) => setField(field, e.target.value)`; all inputs now `onChange={bind('x')}`. Emoji pills use `setField('emoji', e)` directly (value is the emoji, not an event).
2. **Scene-contract mismatches** — verified every scene component's props. `message` reads `data.sub` (had `headline`→blank); `memory` reads `data.label` (had `headline`→blank). Fixed. LESSON: section keys are a contract with the scene component's `data.*` destructure — silent blank, not an error, when wrong.
3. **`closing`→`feedback`** — `closing` renders `Outro` = the CARD payment+share modal (KES 50, `cards` table). Would drop a card-payment popup into an event. Switched final scene to `feedback` (FeedbackScene) with ticket CTA `cta:{label:ctaLabel, href:ticketUrl||'#'}`.
4. **`filter(Boolean)` made meaningful** — who/message/memory now droppable when blank (`state.expectedText && {...}`); hero + feedback required.
5. **nanoid two-capability** — `id=nanoid(6)` (public invite), `manage_id=nanoid(21)` (secret manage). Length gap = the security logic.
6. **Column casing** — insert now snake_case (`event_date/landing_title/landing_sub/cta_label/ticket_url`) to match table; `event_date: state.eventDate || null` (''  breaks a DATE column).
7. **Deferred correctly** — no payment yet (`paid` stays false = draft); on save a "Draft saved" panel shows both URLs. Removed stale header comment + unused useNavigate/buildSection.
- Added brand colour pickers (`<input type="color">` → hex → feeds `--accent` from Unit 2) + emoji pill row + all form inputs rendered.
- **Verify (next session):** `npm run build`; then /event → fill → Save → confirm a new `paid=false` row in Supabase `events` table editor.
- **REMAINING for events:** 3c live preview (reuse CreatePreview w/ brand hex) · Unit 4 payment gate (KES 500 × 14-day units, Paystack, flips paid/paid_until) · Unit 5 CardPage reads `events` table + ENDED state · Unit 6 manage URL (edit via `update_event` RPC + feedback inbox via `get_event_feedback`).
- Session build guide updated: `scrolly-letters-events-build-guide.html` (new "Self-Serve Event Builder" section).

### Event `events` table — working schema (draft, to finalize in build guide)
`id` (nanoid, public invite URL) · `manage_id` (nanoid secret, edit+feedback) · `created_at` · `host` · `emoji` · `event_date` · `landing_title` · `landing_sub` · `cta_label` · `ticket_url` (external link-out) · `accent` · `accent_2` · `bg` (brand hex → inline CSS vars) · `sections` (JSONB) · `paid` (bool) · `paid_until` (timestamptz). RLS: public SELECT where `paid AND now() < paid_until`; manage edits via `security definer` RPC keyed on `manage_id`.

## Current Goal

- Right now its 7pm on Monday 20th July:
The goals for today is:
1. Look through the inspo pages that I will post up on the chat and pull up things we can implement in my platform using the socratic method, we'll pressure test all the implementations
2. Change the Landing page from the horizontal scroll to a single landing page with a nava bar that navigates to all the different sections
3. The cards that have been created already, we wont display them we'll cahneg the layout to just show dummy cards in a horizontal card scroll showing all the different cards someone can make. Ask for me to show the inspo
4. Finish up the create-event page that we created a blank file for the last session, this is for the event organizations that will use my platform
5. Increase the price of the card to 50 kenya shillings not affecting the already paid cards
6. Start scaling with the customize section/page that I want us to add, plus the customized cards will cost more.

## Completed

- **Goal 1 — Inspo review (Digibouquet + LoveCraft).** Pulled stealable mechanics, pressure-tested Socratically. Findings below under Session Notes.
- **Palette board built** — 3 purple-led warm-pastel directions (A Lilac Post / B Mauve Dusk / C Wisteria & Honey) shown applied to bubble nav + hero + cards. Artifact: https://claude.ai/code/artifact/b57fc6af-b579-48ab-8286-b8a2ab3796e6
- **Palette chosen: B — Mauve Dusk.** Brand tokens added to `:root` in index.css (lines 24–32) as `--sl-*` (Scrolly Letters). Namespaced to NOT collide with per-recipient card themes (`--accent`/`--bg` etc.) — two-layer colour system: brand chrome vs card mechanics.

## In Progress

- Goal 2 — bubble nav ✅ BUILT (verified: `npm run build` passes, 486 modules).
  - New: `src/components/BubbleNav.jsx` — global chrome, `NavLink` items (🏠 Home / ✏️ Create / 🎉 Event / 🎨 Customize), hides on `/card/:id` via `useLocation`. Icon always visible; label in DOM always (a11y) but collapsed to `max-width:0`, revealed on hover/active.
  - New routes in App.jsx: `/event` → Create_event.jsx, `/customize` → Customize.jsx. `<BubbleNav/>` rendered once inside `<BrowserRouter>`.
  - Placeholder pages: `Create_event.jsx` (was empty; Goal 4 fills it) and new `Customize.jsx` (Goal 6 fills it), styled via `.shop-page`.
  - CSS added to index.css: `.bubble-nav` / `.bubble` (frosted pill, brand tokens) + `.shop-page`. `.shop-page` aliases `--accent`/`--accent-2` → brand tokens so the shared `.cta-button` renders in Mauve Dusk.
  - NEXT UNIT: the scrolly landing sections (Hero first).
- Goal 2 — scrolly landing scaffold + HERO ✅ BUILT (verified: `npm run build` passes).
  - Home.jsx rewritten: horizontal-scroll → vertical scrolly journey. Old version preserved at `src/pages/Home.horizontal.backup.txt` (folder not git-tracked, so kept a manual backup).
  - Sections rendered in order: Hero (real) → How it works / Showcase / Occasions & Events / Pricing / CTA (all `PlaceholderSection` stubs, reveal on scroll via framer-motion `whileInView`).
  - Hero uses framer-motion `useScroll`+`useTransform` (same pattern as HeroScene) → content parallaxes up & fades as you scroll.
  - Reused AmbientBackground engine, re-skinned for LIGHT paper via `.sl-landing`-scoped CSS (purple motes, multiply-blend glow). Principle: reuse behavior engine, repaint surface.
  - `.sl-landing` aliases `--accent`/`--accent-2` → brand tokens so shared `.cta-button` + AmbientBackground theme in Mauve Dusk.
  - NEXT UNIT: "How it works" section (real content).
- Goal 3 — SHOWCASE section ✅ BUILT (verified: build passes). Motion style chosen by user: **staggered vertical reveal** (matches reference photo).
  - Reference image: modern cards w/ coloured image header + badge pill + title + meta row + dark rounded CTA. Two flavours (light / photo-dark). We did the light/coloured-header flavour.
  - `SHOWCASE` = 6 curated DUMMY occasions (birthday, anniversary, thank you, apology, encouragement, just because). Generic teasers only.
  - Each card = own `OccasionCard` w/ own `useScroll` → alternating depth (55/28px) = layered parallax. `.occ-grid` 2-col, even column pushed down 3.5rem = staggered gallery. CTA "Create this →" links to /create (funnel).
  - CSS: `.occ-card` family + `.sl-showcase`.

## HARD RULES (product constraints — never violate)

- **Privacy:** the Showcase and any "cards people made" NEVER display real users' letters or any personal/sensitive info. Only curated generic dummies. Real cards a user makes stay private to them. (User instruction, Goal 3.)

- Goal 2/5 — REMAINING LANDING SECTIONS ✅ BUILT (build passes):
  - `HowItWorks` (3-step, meaningful numbering), `OccasionsEvents` (split panels: everyday vs events→/event), `Pricing` (Standard KES 50 + Customized "coming soon"), `FinalCta` + footer. `Reveal` helper wraps content in whileInView rise-in. CSS: `.how-*`, `.split-*`, `.price-*`, `.sl-final`, `.sl-footer`.
  - User personalized hero copy: kicker "Everyday gift cards, with a digital twist".
- SCAFFOLDS for tomorrow (build passes, render, logic left as TODOs):
  - `Customize.jsx` — working backdrop picker (`BACKDROPS`, free vs premium ✦); TODO: live price (BASE 50 + surcharge), preview, carry into pay flow.
  - `Create_event.jsx` — starter form (eventName/host/eventDate + initialForm shape matching cards_data event); TODO: full form, assemble event obj, storage decision, preview + feedback route.
  - Added `.shop-page .create-input`/`.create-pill` overrides so dark-themed inputs are legible on light shop pages.

## Build-guide / micro-world — DONE this session

- Interactive build guide covers: (1) design tokens & two-layer colour system, (2) bubble nav, (3) scrolly landing + reveal/reuse-engine principle, (4) parallax showcase cards, (5) tomorrow's Create/Customize/Event plan with code. Live demos: token swatches (click-to-copy), working bubble nav, parallax scroll box. Artifact + repo file `scrolly-letters-landing-build-guide.html`.

## Next Up (next session — user builds solo per the guide)

- Build on top of the scaffold for create_events & customize
- Customize shouldnt copy or even look like Love Craft. It's based of the aspect that if create page has restricted themes, emoji, sections and occasions, Customize should give someone the freedom to build their own card with their own creativity and imagination, with the live preview. Adding stickers different background scenes and sections as well.
- Therefore in terms of Customize, it should have that assests.json file due to teh different occasions as well as different emoji's file. Then themes should be fixed and yeah. We need to come up with how that will be wired in and will occur.
- You wont generate or change the code you will build a build guide for me based on how I'll write the code explaning why and everything as per @Claude-Context-Collaborating-Prompt.md

- from there in the events page its based on
1. Building on the scaffold as well and aligning it with the demos we built for Linkedin Local as well as Mctaba.This is through the incorporation of different scenes such as:
- Hero detailing the headline of the event and the sub - a roygh breakdown of what you'll learn
- What to expect sections with the description section as well
- Why you wouldn't want to miss it - Descriptions as well
- The detailsof the event : date, location, time etc
- Questions to the host - anything you wnat to know before the event?
- The a CTA button to get ticket where now the host/organization etc routes it to where someone can actually buy the ticket as well as send it to a friend

- Basically following the same scenes format for the persnoal cards but adaptingit for events
- Just like Customize because brand colours vary - we need to figure that one out. How brands can create their style


- So for the two of these objectives we need to create a build guide that walks me through all the steps, code & syntx that I should right and before that  let's dive into an interview/questions session to pressure test & break all the assumptions
## Open Questions

- ~~Goal 3 dummy-card style~~ RESOLVED — reference photo received (property/recipe-style cards); motion = staggered vertical reveal. Built.
- **Goal 5 pricing (KES 50):** still must verify price is stored per-card at creation in Supabase `cards` so "already-paid cards unaffected" holds, THEN change the amount in the create/pay code. Landing currently only *displays* 50.
- **Customize premium surcharge amount:** undefined. Scaffold assumes +KES 50 (`PREMIUM_SURCHARGE`). Confirm real number before wiring pay.
- Mode/colour axis (color vs mono, à la Digibouquet): user has none in mind yet — deferred. Customize axis will instead be theme/scenery-backdrop (à la LoveCraft) per Goal 6.

## Architecture Decisions

- **Palette = CSS custom properties in one `:root` block.** No Tailwind in project (plain CSS: index.css, App.css, styles/themes.css). Central tokens make "I dislike the palette" a one-file fix and let every component inherit. Why: user has disliked past palettes; want cheap iteration.
- **Landing is vertical scrolly, NOT minimalist.** User explicitly rejected Digibouquet's straight-to-point minimalism; wants an inviting journey with scroll effects. Tagline literalism: "they are scrolly letters."
- **Customize tier (Goal 6) = theme/scenery-backdrop picker** (adapted from LoveCraft's Scenery Backdrop). Free = basic backdrops; premium = fancier, costs more. This resolves the earlier open "what's the mode axis" question.

## Session Notes

- **Digibouquet takeaways:** landing = hero + few decisive CTAs; builder launched in modes via URL param (`?mode=color`/`mono`); "View Garden" = example gallery. Kept the *example-gallery* and *modes/tiers* ideas; rejected the minimalism.
- **LoveCraft takeaways (loved — concept close to ours, steal don't copy):** (1) 3D fanned showcase of real creations on landing; (2) product/feature grid w/ price pills + CTAs; (3) **split create page: form left + live preview right** (crown jewel — apply to our create/UI); (4) **Scenery Backdrop theme picker** = our customize axis; (5) occasion dropdown + AI Suggestions + char counter. NOTE: our dummy-card showcase will NOT copy LoveCraft's — will follow user's own reference photo (pending).
- **Current code state:** App.jsx has only 3 routes (/,  /card/:id, /create). Home.jsx is the horizontal-scroll landing to be replaced; its gallery pulls REAL cards from Supabase `cards` table (that's what Goal 3 swaps for dummy cards). Create_event.jsx & Create.jsx/Create_Card.jsx exist on disk; event page not routed. Stack: React 19, Vite 8, React Router 7, Framer Motion 12, Supabase, canvas-confetti, nanoid.
