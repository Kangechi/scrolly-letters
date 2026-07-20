# Progress Tracker

This is the file that keeps track of all that we do & even acts as a documentation that I can refer to & get a glimpse of every change, error , implemenation update and everything that took place in a session.

## Current Phase

- **Session of Mon 20 Jul (7pm) — LANDING COMPLETE.** Goals 1, 2, 3 done + partial 5 (pricing shown). Create/Customize/Event scaffolded for solo work tomorrow. Build guide shipped.
- Build guide (interactive): artifact https://claude.ai/code/artifact/40359774-5d7b-4a71-9bfa-67b1ee97460d — also saved in repo at `scrolly-letters-landing-build-guide.html`.

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

- **Customize (Goal 6):** wire price + live preview (see build guide §5A).
- **Create split live-preview + scenery picker (Goal 4 adj):** verify preview updates on keystroke; add backdrop picker (lift `BACKDROPS` to shared file).
- **Event (Goal 4):** finish form, assemble event object, storage decision, feedback route.
- **Goal 5 pricing:** actually change the KES amount to 50 in the create/pay code (landing only *displays* 50 so far) — verify per-card storage first.

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
