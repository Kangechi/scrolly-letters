# Progress Tracker

This is the file that keeps track of all that we do & even acts as a documentation that I can refer to & get a glimpse of every change, error , implemenation update and everything that took place in a session.

## Current Phase

- **Session of Fri 14 Aug — DEMO DAY PROGRAMME BUILT + DEPLOYED (standalone, outside the app).** A separate project at `demo-day-program/` — **nothing in `scrolly-letters/` was touched, no migrations, no schema changes.** One data file renders to two surfaces: a scrolly phone programme (live at https://demo-day-program.netlify.app) and an editable PowerPoint deck for the projector. QR generated and decode-verified. **BLOCKING: every time in the running order is invented** — Demo Day is Thu 20 Aug, six days out. See "SESSION 14 AUG" below. Build guide: `scrolly-letters-demo-day-program-build-guide.html` (6 micro-worlds).

- **Session of Fri 7 Aug — EVENTS: FULL EDITING + PAYMENT ROUTING BUILT.** Blocks 1 + 2 of the user's agenda. Build green (492 modules), lint clean on every touched file. **NOT deployed, and the SQL has NOT been run yet** — see "SESSION 7 AUG" below for the two-step order that matters. Host inbox (feedback + pre-event questions) and the referral distribution system were scoped but deliberately left for next session.

- **Session of Sat 1 Aug — SEO UNITS 1 + 2 BUILT (not yet deployed).** OG/Twitter tags, `X-Robots-Tag` noindex on card pages, `og-image.png`, `robots.txt`, `sitemap.xml`. `npm run build` green (486 modules). See "SEO Units 1 + 2 — DONE (1 Aug)" below. Build guide: `scrolly-letters-seo-build-guide.html` + artifact https://claude.ai/code/artifact/702611b6-99af-45df-8e64-5abd990308ea (3 interactive micro-worlds).
- **Session of Sat 1 Aug (earlier) — BACKLOG AUDIT + PLANNING.** Audited code (not memory) against this tracker. See "Backlog Audit" and "Plan" below. Three new tracks opened: SEO/discoverability, loop engineering (CI → analytics → session ritual), and finishing Events end-to-end. *(Note: entries first written this session were mislabelled "31 Jul" — corrected to 1 Aug. "Tomorrow" in the plan = Sun 2 Aug.)*
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

## Backlog Audit (Sat 1 Aug) — verified against code, not memory

**CLOSED (was listed open, is actually done):**
- **Goal 5 pricing (KES 50).** `api/pay.js:39` charges `amount: 5000` KES; `Outro.jsx:157,168` copy says KES 50. "Already-paid cards unaffected" holds *by construction* — the share gate is the `paid` boolean, price is never stored per-card, so historical cards can't be re-priced. Open question resolved; no code change needed.

**EVENTS — confirmed incomplete (blocking revenue):**
- Block 2 verify step never ran: `npm run build` + fill `/event` + Save + confirm a `paid=false` row in Supabase.
- Unit 3c live preview — not started.
- Unit 4 payment gate (KES 500 × 14-day unit → sets `paid`/`paid_until`) — not started.
- **Unit 5 — VERIFIED MISSING.** `CardPage.jsx:79-96` reads the local bundle then the `cards` table only; it never queries `events`. A saved event is unreachable at its own invite URL even if paid. This is the dead end.
- Unit 6 manage URL — the `update_event` / `get_event_feedback` RPCs exist in the DB, but no UI consumes them.

**CUSTOMIZE (Goal 6) — scaffold only.** `Customize.jsx` is 62 lines: the backdrop picker selects, nothing else. Live price, preview, and carry-into-pay are all TODO. The `assets.json` + emoji-file design requested on 20 Jul was never built (25 Jul went to Events instead). Premium surcharge still an undefined number.

**Long-open threads, still unresolved:**
- `cards` RLS correctness — open since 1 Jul, never confirmed after the Paystack pivot.
- Free-vs-signup funnel decision — open since 30 Jun.
- Oversized-type visual redesign (`scrolly-letters-scene-prototype.html`) — never ported into `src/components/scenes/*`. This is the direct answer to client feedback "UI is plain but UX is amazing".
- Bundle >500kB, no code-splitting.
- Dead 0-byte files: `Create_Card.jsx`, `ThemePicker.jsx`, `OccasionCard.jsx`, `ui/Anima*.jsx`, `styles/themes.css`.
- **Session of Mon 27 Jul was never logged here** (commit `950adba` "fix(events): guard brandStyle against null card" + `cards_data.jsx` edits + events build-guide update). Gap in the record.

## SEO — problem reframed (1 Aug)

The product's own content **must never be indexed** — real letters and paid event pages are private (HARD RULE, privacy). So `/card/*` gets `noindex`, and the entire searchable surface is four marketing routes: `/`, `/create`, `/event`, `/customize`. The goal is therefore *not* "get the site indexed" — it's **build a landing surface worth indexing**, because there is currently almost no crawlable text on it.

Verified gaps in `index.html`: zero Open Graph / Twitter tags · no `robots.txt` · no `sitemap.xml` · no canonical · no JSON-LD · one shared `<title>` for all five routes.

**Highest-ROI item is not SEO at all:** social crawlers (WhatsApp, LinkedIn, X) do **not execute JavaScript**, so no React-rendered tag can ever reach them. Every shared card link currently previews as a naked URL with no image or title — on a product whose entire growth loop *is* WhatsApp sharing. Fix = static tags in `index.html`.

**Constraint (confirmed 1 Aug): site is `https://scrolly-letters.vercel.app/`.** `vercel.app` is on the Public Suffix List, so the subdomain inherits none of Vercel's domain authority — it ranks as a brand-new standalone site and reads as a hobby project to the Kenyan orgs being pitched. Category-search SEO is effectively unwinnable until a real domain is bought. **Custom domain = Unit 0, everything canonical/sitemap-shaped depends on it.**

## Plan — next session (Sun 2 Aug)

Decisions taken 1 Aug: SEO target = mix of brand + category + share-previews · main build block = finish Events end-to-end · loops = all three, sequenced.

**BLOCK 0 — Domain: DEFERRED by decision (31 Jul).** Staying on `*.vercel.app` for now. Accepted consequence, stated and chosen: share-previews and brand search will work; **category-search SEO stays effectively out of reach** until a real domain exists, and the canonical/`og:url`/sitemap URLs will need a second pass when one is bought. Still worth doing tomorrow (2 min): confirm the production deployment isn't serving `X-Robots-Tag: noindex` — Vercel sets that on *preview* deployments, and if it ever leaked to prod nothing else in Block 1 can work.
- **NEEDED AT START OF SESSION: the exact production vercel.app hostname.** Not recorded anywhere in this repo (no `.vercel/` dir, remote is just `github.com/Kangechi/scrolly-letters`). Every absolute URL in Block 1 depends on it.

**BLOCK 1 — SEO / discoverability layer.**
- Unit 1: static meta layer in `index.html` — OG + Twitter card + canonical. Fixes WhatsApp previews. **Concept taught 31 Jul, code not yet typed** — see "Unit 1 concept (taught 31 Jul)" below.
- Unit 1b: `public/og-image.png` @ 1200×630. **Decided: build it as an HTML card using the real `--sl-*` Mauve Dusk tokens + Fraunces/Space Grotesk, then screenshot to PNG.** Chosen over Canva/video-frame because it uses the actual site CSS, so it's guaranteed on-brand and re-renderable whenever branding changes. Must be generic branding only — never a real letter (HARD RULE, same reasoning as the dummy Showcase).
- Unit 2: `public/robots.txt` (with `Disallow: /card/`) + `public/sitemap.xml` (4 marketing routes only).
- Unit 3: per-route `<title>`/description (small `useDocumentTitle` hook — teach it, don't pull in a library).
- Unit 4: Google Search Console — verify property, submit sitemap. This is what makes brand search work; it is not automatic.
- Unit 5 (stretch): one real category-content page for "digital birthday card Kenya"-shaped queries.
- DEFERRED: per-card dynamic OG images (needs a Vercel edge function that renders HTML for crawlers only — a separate session, and it must respect the privacy rule: generic image, never the letter's text).

**BLOCK 2 — Events end-to-end. ORDER INVERTED ON PURPOSE.**
- First: run the skipped Block-2 verify (build + save a draft).
- **Unit 5 BEFORE Unit 4.** RLS exposes only `paid AND now() < paid_until`, so building payment first still leaves nothing to look at, and building the reader first makes every draft 404 with two suspects (bad query vs. working policy) and one symptom. Instead: build the reader, then flip `paid=true` + `paid_until` **by hand in the Supabase table editor** to prove the read path in isolation. Unit 4's only job afterwards is to automate a flip already known to work.
- Then Unit 4 (Paystack, KES 500 × 14-day units), then Unit 6 (manage URL), then 3c preview if time.

**BLOCK 3 — Loop engineering, sequenced: ship safely → learn what shipped → record what we learned.**
- Loop A (build now): CI via GitHub Actions — `npm run build` + lint on every push, so a broken build never reaches production. Directly serves the CD/CL goal in `AI-Workflow-rules.md`.
- Loop B (design now, build next): funnel analytics — land → create → pay → share. Must respect the privacy rule: count events, never letter content.
- Loop C: session ritual enforced by Claude Code hooks — every session opens by reading this tracker and closes by writing it + the build guide.

**BLOCK 4 — SEO build video.** Uses the existing content/video workflow. Scheduled after Block 1 so there's something real to film.

**Honest scoping note:** Blocks 0–4 are 2–3 sessions of work, not one day. If the day runs short, the cut order is: Block 4 (video) → Block 1 Unit 5 (content page) → Block 2 Units 6/3c. Blocks 0, 1 (Units 1–4), and 2 (Units 5+4) are the day's real spine.

## SEO Units 1 + 2 — DONE (Sat 1 Aug, built + build-verified, NOT yet deployed)

**Production host confirmed: `https://scrolly-letters.vercel.app/`.** All absolute URLs now use it.

**Unit 1b — `public/og-image.png`** <span>[CLAUDE]</span>. Source of truth is `tools/og-image.html` (outside `public/`, so Vite never ships it). Colours copied verbatim from `index.css` `:root` `--sl-*`, so the card is on-brand by construction rather than by eye. Design: Mauve Dusk paper ground + blurred purple/rose glows + masked hairline grid; Fraunces gradient headline "Words that *unfold* as you scroll."; a 3-sheet layered card mock with **redacted bars instead of text** — deliberately unreadable so the preview can never imply a real message (HARD RULE). Rendered with headless Chrome:
`chrome --headless=old --disable-gpu --hide-scrollbars --window-size=1200,630 --virtual-time-budget=9000 --screenshot=public/og-image.png tools/og-image.html`
**Gotcha: plain `--headless` silently produced no file on Chrome 112+; `--headless=old` is required for `--screenshot`.** Re-run that command after any brand change.

**Unit 2 — `public/robots.txt` + `public/sitemap.xml`** <span>[CLAUDE]</span>.

**CORRECTION — `Disallow: /card/` was planned and then REJECTED.** It would have broken the `noindex` shipped in Unit 1. A crawler must be **allowed to fetch** a page in order to **see** its `X-Robots-Tag` header. Disallowing the path means the crawler never requests it, never sees the noindex — and a disallowed URL discovered elsewhere (someone pastes a card link into a public group) can still be indexed as a bare URL with no content. **`Disallow` and `noindex` defeat each other; pick one, and `noindex` is the one that guarantees removal.** Final `robots.txt` therefore says `Allow: /` with a comment explaining why, and points at the sitemap. Sitemap lists only the 4 public routes.

**Verified:** `npm run build` green (486 modules, 3.77s); `dist/` contains `og-image.png` (205 kB), `robots.txt`, `sitemap.xml`, and `dist/index.html` carries the real hostname in both image tags.

## SEO Unit 1 — detail (1 Aug)

**`index.html`** <span>[typed by USER]</span> — 9 Open Graph + 4 Twitter tags added after `<title>`, before the font `<link>`s. Reviewed and verified correct: `property=` on all OG, `name=` on all Twitter (no crossover — the #1 silent-failure mode), no canonical, no `og:url`, `og:locale` = `en_KE` underscore form.

**`vercel.json`** <span>[applied by CLAUDE, at user request]</span> — added a `headers` block setting `X-Robots-Tag: noindex, nofollow` on `source: "/card/(.*)"`, alongside the existing rewrite.

**Why the header and not a meta tag — the core lesson.** One `<head>` serves all 5 routes, so `<meta name="robots" content="noindex">` would de-index the *entire site*. `X-Robots-Tag` is an HTTP response header, matched **per path** by Vercel before the app is involved. `headers` and `rewrites` are **independent passes**: the rewrite still sends `/card/x` → `index.html` so React Router works, while the header is matched against the URL the *browser asked for*, not the rewritten target. `nofollow` is deliberate — card pages carry outbound WhatsApp share links and event `ticket_url`s, and it stops crawlers walking outward from a private page. **This makes the privacy HARD RULE infrastructure instead of convention** — before today nothing stopped a publicly-posted card URL from being indexed with the letter's full text.

**CORRECTION mid-unit: canonical + `og:url` were REMOVED from the plan before being typed.** A static canonical in an SPA is one claim repeated on all 5 routes — `/create`, `/event`, `/customize` would all declare canonical `/`, and Google's correct response is to drop them as duplicates. An SEO layer whose first act de-indexes 3 of 4 indexable pages. **The sorting rule: does the tag's audience run JS?** `og:*`/`twitter:*` → audience is social crawlers → no JS → MUST be static. `canonical`/`title`/`description` → audience is Google → does run JS → runtime, per route → Unit 3's hook. `og:url` dropped as optional (crawlers fall back to the fetched URL); pinning it wrong on every route is worse than omitting it.

**~~STILL BLOCKING~~ RESOLVED same session** — hostname supplied (`scrolly-letters.vercel.app`) and `og-image.png` built. Both `og:image`/`twitter:image` now resolve.

**Deferred with reason:** per-route `og:*` (so a birthday card previews differently from an event invite) is NOT runtime-solvable — same no-JS reason. Needs a Vercel edge function serving crawler-specific HTML, and it must emit a generic branded image, never letter text.

**Optional/unactioned:** `<html lang="en">` could be `en-KE` for consistency with `og:locale`. Worth ~nothing for ranking.

## DEPLOY VERIFIED — live on production (Sat 1 Aug)

User deployed; all 6 post-deploy checks pass against `https://scrolly-letters.vercel.app`:
1. `/robots.txt` → 200 `text/plain`, `Allow: /` + sitemap pointer
2. `/sitemap.xml` → 200 `application/xml`, 4 public `<loc>`s
3. `/og-image.png` → 200 `image/png`, 205,624 bytes
4. `/card/testcard123` → **`X-Robots-Tag: noindex, nofollow` present** ✓
5. `/` → **no `x-robots-tag`** ✓ (the pair that proves path-matching works — marketing routes stay indexable)
6. 13/13 og/twitter tags served with real absolute URLs

**Re-run this check block after any `vercel.json` or `public/` change** — a broken header is invisible in the UI.

## SEO Unit 3 — DONE + DEPLOYED + VERIFIED IN PRODUCTION (Sat 1 Aug)

Post-deploy check against live `https://scrolly-letters.vercel.app` via `chrome --headless=old --dump-dom`: `/` → own title + `canonical /`; `/create` → own title + `canonical /create`; `/card/*` → generic `'A Scrolly Letter ✦'` + **no canonical**. Static HTML still serves `og:title`/`og:description` for no-JS crawlers. All correct.


**New file `src/components/PageMeta.jsx`; wired into `App.jsx`** next to `<BubbleNav/>` inside `<BrowserRouter>`. `npm run build` green, 487 modules.

**React 19 changed the approach.** React 19.2.6 hoists `<title>`/`<meta>`/`<link>` rendered anywhere in the tree into `<head>` — so NO `react-helmet`, NO `useEffect`, NO `document.head` poking. Unit 3 is a component that returns JSX.

**System framing: `PAGE_META` is the project's THIRD lookup table** — `SCENE_MAP` (type→component), `CONFETTI_THEMES` (theme→colours), now `PAGE_META` (route→metadata). Same shape: a dictionary turning a string into behaviour. The component is shaped like `BubbleNav` — rendered once in `App.jsx`, reads `useLocation`, behaves per route.

**Four design decisions:**
1. **The map is an ALLOWLIST, not a blocklist.** Unlisted routes fall through to `PRIVATE`. A future `/dashboard` is private by default until deliberately published. Blocklist failure = "forgot to add it, it leaked"; allowlist failure = "forgot to add it, it's invisible". Only one is recoverable.
2. **Card title hardcoded generic** (`'A Scrolly Letter ✦'`) — the security constraint in code; a real title would leak letter content into the tab, session history and analytics.
3. **`{page && <link rel="canonical">}`** — canonical only on public routes; declaring one on a noindex page is contradictory.
4. **`SITE + key`, not `SITE + pathname`** — canonical points at the NORMALISED path (trailing slashes stripped), so `/create/?ref=whatsapp` → `/create`. That is canonical's whole job.

**MEASURED, NOT ASSUMED — and it changed the code.** Open question was whether React 19 replaces or duplicates the static `<title>`/`<meta description>` already in `index.html`. Verified empirically via `chrome --headless=old --virtual-time-budget=6000 --dump-dom http://localhost:5174/<route>`:
- **BOTH tags duplicated, in OPPOSITE orders.** React's `<title>` inserted FIRST (so it won, by luck); the STATIC `description` sorted FIRST and was **silently shadowing every per-route description.**
- **Fix: deleted both static tags from `index.html`**, replaced with a comment explaining why. `PageMeta` now sole owner. Trade-off stated: a JS-less visitor gets no title/description — acceptable because the only no-JS audience is social crawlers, which read the still-static `og:title`/`og:description`. **One owner per concern.**
- Re-verified all 5 routes: exactly one `<title>`, one `description`, canonical on the 4 public routes only, `/card/*` generic with no canonical. ✓
- **LESSON: when two systems write to the same place, measure — don't reason about which wins. A duplicate tag throws no error and looks fine in the browser.**

## SEO Unit 5 — DONE (Sat 1 Aug) — SEO TRACK COMPLETE

**New page `src/pages/Occasions.jsx` at `/occasions`.** Stage 6 was the last gap: four public routes with flawless metadata and almost no words, and Google ranks words. Six occasions with real prose + 4 FAQs + `FAQPage` JSON-LD. Zero Supabase calls, every example invented (HARD RULE). Every claim verified true of the shipped product — no invented behaviour, no prices not in the code.

Files: `pages/Occasions.jsx` (new) · `App.jsx` (route) · `components/PageMeta.jsx` (title/desc/canonical) · `public/sitemap.xml` (5th URL, priority 0.9) · `pages/Home.jsx` (**internal link** "See every occasion →") · `index.css` (`.occ-*` long-form layout). `npm run build` green, 488 modules; lint clean for today's files (17 pre-existing errors elsewhere, e.g. `Customize.jsx` unused `BASE_PRICE`).

**Why the internal link matters:** a page nothing links to is weakly discovered however good its metadata. Sitemap says "this exists"; an internal link says "and it matters." Need both.

**BUG CAUGHT BY MEASUREMENT — nearly shipped.** The page first reused `Home.jsx`'s framer-motion `Reveal` (`whileInView`, `initial={{opacity:0}}`). Headless render showed **13 × `style="opacity: 0; transform: translateY(40px)"`** — every word in the DOM, none visible, because the IntersectionObserver never fired. **Fix: a CSS animation that animates TRANSFORM ONLY, never opacity, and runs on load rather than on an observer** (`.occ-reveal` + `@keyframes occ-rise`, `prefers-reduced-motion` respected). Re-verified: 0 inline `opacity: 0`, 13 wrappers, all content present.
**RULE: never gate content you need indexed behind an animation that must be triggered.** Home can afford it (showcase); a content page cannot.

**JSON-LD is generated FROM the same `FAQ` array the page renders**, so markup can never drift from visible text — marking up answers not on the page is a manual-action risk, and one source makes drift structurally impossible.

**Open inconsistency noticed, NOT resolved (needs user decision):** `Home.jsx` Pricing shows event pricing as "KES 500 monthly", but Event Spec v1 item 7 says **KES 500 per 14-day unit**. These contradict. `/occasions` deliberately avoids stating event pricing until this is settled.

## NEXT UP — Events track (user-set priority, restated end of Sat 1 Aug as THREE tasks)

**0. CARRIED OVER FROM SEO — do first, ~10 min.** Unit 5 was built but **NEVER DEPLOYED**. Uncommitted at end of session: `src/pages/Occasions.jsx` (new) + `App.jsx`, `components/PageMeta.jsx`, `public/sitemap.xml`, `src/index.css`, `src/pages/Home.jsx`, this tracker. **Commit + push, then submit `sitemap.xml` in Search Console + Request Indexing.**
> Gotcha logged: curling a URL to confirm a deploy is USELESS here — the catch-all rewrite in `vercel.json` returns 200 for *every* path, including typos. Verify by checking the **sitemap's contents** (`curl -s .../sitemap.xml | grep -c occasions`), not a status code.

Sequenced deliberately; each is only testable once the one above exists.
1. **Fix the event error + explain the two-URL routing in the same block** (user merged these — the routing model is what the fix is built on). The 406 / "Card not Found" on a saved event draft, see BUG section below. **Build the READER first, test by flipping `paid`/`paid_until` by hand in the Supabase table editor** — payment-first leaves nothing to look at; reader-first without the manual flip gives two suspects and one symptom. The routing model to walk through: public `id` (nanoid 6) = invite/share URL · secret `manage_id` (nanoid 21) = edit + feedback. Two capabilities on one row; **the length gap IS the security logic.**
2. **Payment routing for events** — Paystack, KES 500 × 14-day units, flips `paid` + `paid_until`. Only meaningful once #1 proves the read path; then it just automates a flip already known to work.
3. **Live build** — the live preview beside the event builder form (Unit 3c). Same render path as #1: build once, use twice.
4. **August seasonal overlay video** — FLAGGED 1 Aug, user explicitly said *"you won't create it, you'll just flag it as something for tomorrow."* Concept in their words: *"It's August — if you know it's someone's birthday / if you know it's an anniversary / if you're hosting an event / whatever it may be."* Scenario beats → Scrolly Letters as the answer → CTA. A **transparent overlay the user composites over their own talking-head footage.**
   - **Do NOT scaffold from scratch.** Near-identical sibling exists: `C:\Users\ADMIN\Desktop\Video_Contnet\videos\scrolly-rebuild-overlay\` — 9:16 (1080×1920), transparent, `workflow: general-video`, `flow: companion`, pinned `hyperframes@0.7.70`. Its `design.md` already holds the brand truth: Mauve Dusk tokens, Fraunces + Inter as data-URI `@font-face` (**no font CDN survives a cloud render**), rise-40px + fade at `cubic-bezier(.22,1,.36,1)`, and **~0.5s fully-transparent gaps between beats so the speaker breathes through**.
   - **Open question:** the real handle / CTA text — the sibling brief still carries `scrolly.letters` as a PLACEHOLDER. Confirm before rendering either video.
   - Route via the `/hyperframes` entry point first.

**Settle before #2:** the "KES 500 monthly" (Home Pricing) vs "KES 500 per 14 days" (Event Spec v1) contradiction.

## Google Search Console (Sat 1 Aug)

**Verification file `public/google56de0d6e543050aa.html` committed (`425b10e`), pushed, confirmed serving 200.** Must be a **URL-prefix** property, NOT a Domain property — the latter needs a DNS TXT record on `vercel.app`, which Vercel owns. **Deleting that file un-verifies the property.**

**Why it's mandatory, not optional:** Google does not go looking for new sites; it discovers pages by following links from pages it already knows. With no inbound links you are not blocked, you are **unknown**. `sitemap.xml` is the side door for exactly that case — it hands Google your 4 URLs directly, bypassing stage 7. Search Console also provides the only feedback loop (Coverage tells you indexed vs skipped vs why) — without it you can't distinguish "not indexed yet" from "indexed and ranked 400th".

**REMAINING USER ACTION:** Sitemaps → submit `sitemap.xml`; URL Inspection → homepage → Request Indexing. **Expect Coverage to later show card pages as "Excluded by 'noindex' tag" — that is SUCCESS, not an error.**

## ✅ PRICING RESOLVED (Sun 2 Aug): **KES 500 per 14 days**, bought in units. NOT monthly.

Long-open contradiction closed by user decision. "Monthly" was not a copy discrepancy — it was **a different product**: variable duration (28–31 days), a rate that changes by month, ambiguous extension semantics, calendar-maths edge cases, and it implies a **subscription that recurs and can be cancelled** — which no code performs. An event is bought once for a window and then ends.

**Own build guide:** `scrolly-letters-payment-build-guide.html` → artifact https://claude.ai/code/artifact/9ee8ca64-1e66-41b8-bda9-933b90b75f76 (3 micro-worlds: unit calculator, trust boundary, webhook replay). The payment map was REMOVED from the events guide, which now points at it.

**CASCADE — every surface, found by grep. Three kinds, failing differently: copy that lies makes an angry customer; money that lies makes a loss nobody notices.**
| Where | Kind | Now | Must become |
|---|---|---|---|
| `Home.jsx:217` | copy | `KES 500 monthly / card` | `KES 500 / 14 days` — **wrong on BOTH halves**; the noun is *event*, not card |
| `Home.jsx:220` | copy | `<Link to="/create">` on the *For Events* price card | `/event` — **funnel bug: it sends event hosts to the personal card builder** |
| `ManageEvent.jsx:251` | copy | "live for 14 days" | already correct ✓ |
| `api/pay.js` | money | hardcoded `amount: 5000` | `units × UNIT_PRICE_KOBO`, server-side |
| `api/callback.js` | money | sets `cards.paid` only | also `events.paid` + `paid_until` |
| `events` table | money | no payment reference | `payment_ref` + partial unique index |
| Spec v1 item 7 | truth | listed as open | settled |

**ONE CONSTANT, ONE SOURCE:** define `UNIT_PRICE_KOBO` + `UNIT_DAYS` once in `api/pay.js`. The price living in two places is exactly how "monthly" on the landing page and "14 days" in the spec drifted apart.

**Explicitly NOT in scope (decide before they happen, not after):** refunds (no flow, no policy) · renewal reminders (an event dies silently at `paid_until`; needs a scheduled job) · ticket money (unchanged — `ticket_url` links out, which is what keeps us out of being a marketplace) · real receipts (Paystack emails the synthetic `<id>@scrolly-letters.app`, which nobody reads).

## PAYMENT ROUTING — MAPPED (Sun 2 Aug), to build next session

Not a new payment system: `api/pay.js` + `api/callback.js` already do Paystack charges, HMAC verification and a service-role write. The work is a second **kind** of thing to charge for, plus four trust decisions.

**Flow:** `/manage/:manage_id` (host picks units × 14 days + phone) → `POST /api/pay {manageId, units, phone}` → server resolves the event **by manage_id**, clamps units, computes `amount = units × 50000` → Paystack charge with `metadata {kind:'event', eventId, units}` → STK push → webhook verifies HMAC + amount + idempotency → `paid_until = MAX(now, existing paid_until) + units×14d`, `paid = true` → manage page polls `get_event_for_manage` until `paid`, badge flips to LIVE.

**THE FOUR DECISIONS (each failure is silent and looks like success):**
1. **Client never sends an amount** — it sends `units`, the server multiplies. Otherwise someone pays KES 1 for a year and it logs as a normal successful payment.
2. **Pay is keyed on `manage_id`, NOT the public `id`** — the server resolves the event itself. A client-supplied event id would let anyone trigger a charge against any event; paying should need the same authorisation as editing.
3. **Idempotency on the Paystack reference** — webhooks retry. A resend extends `paid_until` twice = free hosting, with no failed request anywhere.
4. **Extend from `MAX(now, paid_until)`, not `now`** — otherwise topping up a live event burns the time remaining on it.

**The webhook stays the ONLY writer** of `paid`/`paid_until` — it's the sole place that knows money moved, and runs with the service-role key. `update_event` was deliberately built so it *cannot* touch those columns.

**Lands in:** `api/pay.js` (accept `kind`; card path untouched) · `api/callback.js` (branch on `metadata.kind`) · DB (`payment_ref` column, or reuse the old Daraja `payments` table) · `ManageEvent.jsx` (duration picker + phone, real button, poll).

**STILL BLOCKING:** "KES 500 **monthly**" (Home Pricing) vs "KES 500 per **14 days**" (Event Spec v1). Decide before writing the multiplier — changing it later means migrating anyone already paid.

## PREVIEW SIZING + MOBILE (Sun 2 Aug)

First attempt boxed the preview into 340×520. Wrong diagnosis: `.card-wrapper.preview-frame` is built for a full-height column (`height: calc(100vh - 4rem)`), so that wasn't a small preview — it was a **squeezed slice** of the card. Two components were competing to own sizing; the outer `.manage-preview` now owns it (`position:static; height:100%; border:0` reset on the inner frame) and the card fills it. Desktop is now a **two-column sticky layout** matching the create page.

**Mobile — the real problem is a scrollable frame inside a scrolling page** (swipe and sometimes the card moves, sometimes the page does):
- `overscroll-behavior: contain` — stops scroll **chaining** when the inner frame hits its end.
- **Tap-to-expand full-screen preview** — the frame becomes the viewport, so a swipe can only mean one thing. Inline frame drops to a 48dvh thumbnail you tap.
- **`dvh` not `vh`** — mobile browser chrome shrinks the visible area; `vh` pushes the close button off-screen.
- `env(safe-area-inset-top)` for the notch · 44px min tap targets · Escape to close · `document.body.overflow` locked while open.

## MANAGE PAGE + flow rework (Sun 2 Aug) — host can finally see their own draft

**The gap found by the user:** *"So wait no one can see their drafts?"* — correct, and that included the HOST. The app only ever talks to Supabase with the anon key, and RLS applies the same policy to every anon request; nothing in the request proves authorship. Net effect: **a host was being asked to pay KES 500 for an event they had never seen.** The `manage_id` was the missing proof; it just had nowhere to be checked.

**⚠️ DOCUMENTATION ERROR CORRECTED: `update_event` NEVER EXISTED.** This tracker recorded it as built in Block 1. Introspection (`pg_get_function_arguments` over `pg_proc`) returned only `event_status(p_id text)` and `get_event_feedback(p_manage_id text)`. It was designed, not deployed. **Lesson: an RPC written into a doc is not an RPC in the database — verify before depending on it.**

**Two SQL functions written this session (user to run):**
- `get_event_for_manage(p_manage_id text) returns setof public.events` — full row, gated on the 21-char secret. **`returns setof events` is correct HERE** (unlike on the public `id`) because possession of `manage_id` already authorises editing; a preview is strictly less power.
- `update_event(p_manage_id text, p_patch jsonb) returns boolean` — **editable columns listed EXPLICITLY** (`host`, `landing_title`, `landing_sub`, `cta_label`, `ticket_url`, `event_date`). `paid`/`paid_until`/`id`/`manage_id` are absent *by construction*, so no patch can reach them — that is the enforcement, not a check someone could later forget. `event_date` needs the `?` key-exists test because `''::date` throws where `coalesce` suffices for text. Returns `false` when no row matched, so a save that changed nothing says so.

**ROUTING BUG — had TWO layers.** `Create_event.jsx:149` linked to `/event/manage/<id>`, but no such route existed (`/event` matches exactly). **And there was no catch-all**, so React Router rendered *nothing* — a blank page, no console error. That is why it presented as "the page doesn't do anything" rather than 404. Fixed both: real `/manage/:manageId` route **and** `<Route path='*' element={<NotFound/>}/>`.

**Flow reworked (user's call):** saving a draft no longer shows two raw URLs — one of which (the invite link) *cannot work* because RLS hides an unpaid draft, so the first thing a host did was click a dead link. It now `navigate(..., {replace: true})`s to `/manage/:manage_id` = **preview → edit → pay to publish → (later) feedback.**

**Files:** `pages/ManageEvent.jsx` (new) · `pages/NotFound.jsx` (new) · `App.jsx` (route + catch-all) · `Create_event.jsx` (navigate on save; two-link panel deleted) · `components/CreatePreview.jsx` (new optional `brandStyle` prop — drops the `theme-x` class when present, since class and inline vars are alternative sources for the same `--accent`/`--bg` and would fight) · `index.css` (`.manage-*`) · `vercel.json`. Build green 490 modules, lint clean on all new files.

**`vercel.json` now also sets `Referrer-Policy: no-referrer` on `/manage/(.*)`** alongside noindex. **Reason: the manage URL contains a secret.** Without it, clicking any outbound link from that page (e.g. the org's own `ticket_url`) sends the full URL — secret included — to that site in the `Referer` header. **That is how capability URLs leak in practice.**

**Deliberately inert:** the "Pay to publish" button is disabled rather than hidden, so the flow reads correctly before payment exists (tomorrow).

## BUG FIX — the 406 (Sun 2 Aug): diagnosed by pre-flight, then fixed

**PRE-FLIGHT FIRST (curl against live Supabase with the anon key) — evidence, not assumption:**
- `GET /rest/v1/events?select=id&limit=5` → **`200 []`**. Table reachable, RLS present and filtering, draft correctly invisible.
- Same query with `Accept: application/vnd.pgrst.object+json` (what `.single()` sends) → **`406 PGRST116 "The result contains 0 rows / Cannot coerce the result to a single JSON object"`** — *exactly* the console error. The 406 is PostgREST refusing to coerce 0 rows into one object; it is NOT a network or permission failure.
- Same query with a plain `Accept` → **`200 []`**, no error.

**CAUSE 1 FIX — `CardPage.jsx` loader rewritten** as an async `load()` with three ordered sources, each running only if the previous missed, so every existing card behaves exactly as before and events are a pure fallback: local bundle (2 demos) → `cards` → `events`. **`maybeSingle()` replaces `single()`** — the one-word fix; a miss here is an expected fall-through, not an error. Added `normalizeEvent()` mapping snake_case columns → the camelCase the scenes read (`event_date→eventDate`, `landing_title→landingTitle`, `landing_sub→landingSub`, `cta_label→ctaLabel`, `ticket_url→ticketUrl`); `accent`/`accent_2`/`bg` already match `brandStyle`, `sections` is JSONB so already an array.

**CAUSE 2 — NOT a bug; the RLS policy is correct.** It hides drafts and expired events *identically to nonexistent ones*, which is right but illegible. Fixed with a `security definer` RPC `event_status(p_id)` that reports state **without returning any content**.

**SECURITY DECISION (user pushed back — "I don't want to make that security tradeoff"). Resolved to the ENDED-ONLY variant.** The RPC now returns `'ended'` and nothing else; an unpublished draft returns **zero rows, byte-for-byte identical to an id that was never used** — so there is NO new disclosure at all. Rationale: an ended event was public at some point, so naming it reveals nothing new; a draft has never been public. Cost accepted: the host opening their own draft's invite URL sees generic "Card not found" — the right fix for that is a host preview via the 21-char `manage_id` secret on the `/manage/` route, NOT loosening the public path.

**Why the RPC is not a vulnerability (three structural guards — check these in ANY `security definer` function):**
1. **`returns table (state text)` is the ceiling** — it can emit one word; card columns have no path out. ⚠️ `returns setof events` would hand back whole rows and bypass RLS entirely. That one line is the difference between a status probe and a hole through RLS.
2. **No injection surface** — `language sql` with a bound `where e.id = p_id`. No `execute`, no string concatenation, no dynamic SQL.
3. **`set search_path = public` is pinned** — blocks the classic `security definer` hijack where an attacker creates a same-named object earlier on the path and the elevated function calls theirs.

**Also NOT our bugs (browser-extension noise):** `document-start.js … Could not establish connection` ×2, `[Violation] 'visibilitychange' handler took 158ms`. Reproduce in incognito and they vanish.

## BUG (original diagnosis 1 Aug) — event draft shows "Card not Found 🫤" + 406

**Symptom:** loading a saved event's invite URL shows the defensive "Card not Found" branch; console shows `Failed to load resource: 406`.

**Cause — TWO independent failures stacked, either alone is sufficient:**
1. **`CardPage.jsx` never queries the `events` table.** It checks the local bundle (`kind:'event'` demos only) then queries `cards`. A self-serve event lives in `events`, so `.eq('id', id).single()` matches 0 rows → PostgREST returns **406 Not Acceptable** (that's `.single()`'s behaviour when the result isn't exactly one row) → `setCard(null)` → "Card not Found".
2. **Even after pointing the query at `events`, RLS blocks it.** The SELECT policy exposes only `paid AND now() < paid_until`. A draft has `paid=false` → 0 rows → identical 406.

**This is Events Unit 5**, and it is exactly why the plan sequences the reader BEFORE the payment gate, testing with a manual `paid`/`paid_until` flip in the Supabase table editor to isolate the read path from the policy.

**NOT our bugs (browser-extension noise, ignore):** `document-start.js:10963 Could not establish connection. Receiving end does not exist.` (×2) and `[Violation] 'visibilitychange' handler took 158ms` — content-script errors from an installed extension. Reproduce in an incognito window and they disappear.

## SECURITY posture of the SEO layer (resolved 1 Aug — read before Unit 3)

Per `AI-Workflow-rules.md` ("walk me through each security implementation"). Conclusion: **SEO work here is a PRIVACY exercise, not a security one.**

1. **`noindex` is NOT access control.** It keeps card pages out of Google. It does nothing to stop anyone holding the URL from reading the letter — no login, no expiry, no check. What actually protects a card is that its `nanoid` is unguessable. That is a **capability URL**: possession of the link IS the permission (same model as the event `manage_id`). Legitimate and widely used, but it means **a leaked link is a leaked letter, permanently — there is nothing to revoke.**
2. **What `noindex` did buy (narrow but real):** a card URL posted into a public WhatsApp group can no longer be crawled and surfaced in search results with the message text attached. That was a live exposure before 1 Aug.
3. **Every SEO control is voluntary compliance.** `robots.txt` / `noindex` / `nofollow` are polite requests that Google and Bing honour and a scraper ignores in one line. **Never treat any of them as a security boundary.**
4. **`robots.txt` as an anti-pattern:** it is a public file, so `Disallow: /admin/` publishes a map of what you're hiding. Our `Allow: /` correction (made for the noindex reason) also avoids announcing `/card/` as the sensitive namespace — right call, second good reason.
5. **TWO LIVE RISKS IN UNITS STILL AHEAD:**
   - **Unit 3 (title hook) — card routes MUST get a GENERIC title.** A title like `"Happy Birthday Dad — Scrolly Letters"` leaks private content into the browser title bar, session history, and any analytics that logs page titles.
   - **Unit 5 / dynamic OG images** — do NOT use real letters as rankable content, and do NOT render letter text into a per-card preview image (publicly fetchable by URL, unauthenticated, forever). This is why `og-image.png` uses redacted bars.

## Unit 1 concept — the teaching notes (1 Aug)

**The `<head>` has two audiences and only one runs JavaScript.**

| | Human / Googlebot | WhatsApp / LinkedIn / X |
|---|---|---|
| fetches `index.html` | ✅ | ✅ |
| runs `main.jsx` | ✅ | ❌ **stops at `<head>`** |
| sees React output | everything | nothing |

Consequence: the fix MUST be static HTML in `index.html`. It can never be a React component, and any "SEO for React" library that renders at runtime solves the Google half while silently failing the WhatsApp half. This is the same shape as the two-layer colour system, one level up — a **two-layer rendering system**, where the static shell is the *floor* every visitor is guaranteed.

Tags to add after `<meta name="description">` (line 7): `og:type` · `og:site_name` · `og:title` · `og:description` · `og:image` (+`:width` 1200 / `:height` 630) · `og:url` · `twitter:card=summary_large_image` · `twitter:title` · `twitter:description` · `twitter:image` · `<link rel="canonical">`.

Four points that matter more than the copy-paste:
1. **OG uses `property=`, Twitter uses `name=`.** OG is built on RDFa. Wrong attribute = tag silently ignored — the same blank-not-error failure mode as the scene `data.*` key mismatches in Block 2.
2. **`og:image` must be an ABSOLUTE url.** `/og-image.png` will not resolve for crawlers.
3. **`og:title` should be the emotional hook ("Someone sent you a scrolly letter 💌"), not the brand name.** The recipient doesn't know the brand yet — they know someone sent them something. Brand belongs in `og:site_name`.
4. **1200×630** is the ratio every platform crops to; anything else gets letterboxed or centre-cropped unpredictably.

Why this ranks first in Block 1: it is not really SEO, it sits directly on the ONLY growth loop — every card ever sold was delivered as a shared link, and every one of those links currently previews as a naked URL.

## Current Goal (historical — Mon 20 Jul)

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

---

# SESSION 7 AUG — Events: full editing + payment routing

**Build guide:** `scrolly-letters-event-editing-build-guide.html` + artifact
https://claude.ai/code/artifact/fbf52c3e-17a8-4baa-9de4-6ba2ca56a0d3 (6 micro-worlds: the drift
machine, the inverse function, two keys one row, forge a request, replay the webhook, hostile patch).

## ⚠️ DEPLOY ORDER (SQL FIRST, then push)

`sql/2026-08-07_event_editing_and_payment.sql` must run in the Supabase SQL editor **before**
the code deploys. Reversed, the new manage page sends `sections` in its patch to an
`update_event` that doesn't accept it — every save silently drops the scene edits, which is
the exact bug class this session existed to kill.

Order: **run the SQL → verify with the queries at the bottom of that file → then push.**

## BLOCK 1 — "edit everything" (and the bug found on the way in)

**THE BUG (live in production before today):** `buildEventSections()` bakes the CTA into the
sections JSONB — `cta: { label, href: ticketUrl }`. But `update_event` patched the *columns*
`ticket_url` / `cta_label`, while `FeedbackScene` renders `data.cta.href` — from **sections**.
So a host who edited their ticket link got *"Saved. Anyone opening the invite sees this now."*
and their guests kept going to the old URL. No error, no log. Same wrong-key silent-failure
class as the Unit 3 `data.*` mismatches.

**THE FIX IS STRUCTURAL, NOT A PATCH.** New `src/lib/eventSections.js` makes the flat form the
only editable thing and `sections` **derived data**:

```
form ──buildEventSections()──▶ sections (JSONB)
  │
  └──formToColumns()────────▶ columns
        ONE input, TWO outputs, ONE save → they cannot disagree
```

- `buildEventSections(form)` — form → scenes (moved out of Create_event.jsx, now shared)
- `parseEventForm(row)` — **the inverse**, and the load-bearing one. Scene copy exists ONLY
  inside the sections JSONB (there are no `hero_headline` / `expected_text` columns), so
  without it a host reopening their event would see empty textareas and **silently blank
  their own scenes on the next save.** This is what "keeps note of what they already wrote".
- `formToColumns(form)` — camelCase → snake_case, once, at the boundary. Note what it omits:
  `paid`, `paid_until`, `id`, `manage_id` — same by-construction argument as the RPC allowlist.
- Handles legacy rows where column and baked href already disagree: column wins (it holds the
  host's most recent intent), `'#'` placeholder is read back as empty.

**ManageEvent.jsx rewritten:** 6 fields → all 15, grouped (Your brand / The invite / The scenes /
The ticket button) because a flat run of 15 inputs is a wall, not an editor. **Preview is now
LIVE** — it renders `buildEventSections(form)`, so typing updates the scene beside you (this
folds in Events Unit 3c). Dirty-check is field-by-field, not `JSON.stringify` (key insertion
order differs by construction site). Save button reads "Saved" and disables when clean.

**SQL:** `update_event` gains `emoji` / `accent` / `accent_2` / `bg` / `sections`, with the
sections payload **validated and RAISED on** rather than silently ignored — must be a JSON
array, every element's `type` in (hero, who, message, memory, feedback). `closing` (Outro) stays
excluded: that scene is the card share+payment flow and must never render in an event invite.

**KNOWN GAP, not fixed:** `CreatePreview` renders scenes only. The landing screen
(landingTitle / landingSub / countdown / CTA) is inline JSX in CardPage, not a scene component,
so editing "Invite headline" changes the page's h1 but not the preview. Fixing it properly
means extracting the landing screen into a shared component — a real change, deliberately not
smuggled into this session.

## BLOCK 2 — payment routing, KES 200 / 14 days

**`src/lib/pricing.js` — ONE source of truth, imported by the React app AND `/api`.** The
client's number is decoration; `api/pay.js` recomputes from the same constants. This is what
stops "KES 500 monthly" on the landing page drifting from "14 days" in the charge again.
`CARD_PRICE_KES 50` · `EVENT_UNIT_PRICE_KES 200` · `UNIT_DAYS 14` · `MAX_UNITS 12`.

**⚠️ VERIFY ON FIRST DEPLOY:** `/api/*.js` imports `../src/lib/pricing.js` — outside the api
directory. Vercel's bundler (@vercel/nft) traces relative imports anywhere in the repo, so this
should work, but it is the one new build-level assumption. If a function 500s on import,
the fallback is to copy the constants into `api/_lib/pricing.js` and accept two files.

**The four trust decisions, all implemented:**
1. **Client never sends an amount** — it sends `units`; the server multiplies. Otherwise
   someone pays KES 1 for six months and it logs as an ordinary successful payment.
2. **Pay is keyed on `manage_id`, never the public id** — `priceEvent()` resolves the row
   itself. Authorising a charge needs what authorising an edit needs.
3. **Idempotency on the Paystack reference** — webhooks retry as *normal traffic*, not as an
   edge case. A resend would extend `paid_until` twice = free hosting, no failed request anywhere.
4. **Extend from `MAX(now, paid_until)`** — topping up a live event adds to its remaining time
   instead of burning it.

**Plus one the map didn't have — GUARD 2, amount verification in the webhook.** `metadata.units`
is echoed back to us by Paystack; trusting it without checking `data.amount` against
`units × price` would make the server-side pricing decorative. Mismatch → log, return 200, do
not credit.

**`apply_event_payment()` — ledger insert + paid_until extension in ONE Postgres function.**
Originally planned as two supabase-js round-trips; that has a real hole — if the extend failed
*after* the ledger insert succeeded, the retry sees a duplicate reference, skips, and the event
stays a draft that has been paid for. One function = one transaction = the retry works.
**Revoked from anon/authenticated** — it mints paid time, so an anon-callable version would be
a free-hosting endpoint that skips Paystack entirely (worse than the client-amount hole).

**`readMetadata()`** normalises Paystack's habit of returning metadata as a JSON *string*
rather than an object. Untreated, `meta.kind` is undefined on some requests and the event
silently never goes live.

**Backwards compatible:** charges made before `kind` existed carry only `cardId` and are still
routed to the card branch. The card path is otherwise untouched.

**`events.payment_failed`** added, mirroring `cards.payment_failed`, so a wrong PIN reports at
once instead of after the full 2-minute timeout. Degrades gracefully — before the migration the
column is simply undefined and falsy.

## Cascade closed

| Where | Was | Now |
|---|---|---|
| `api/pay.js` | hardcoded `amount: 5000` | `units × EVENT_UNIT_PRICE_MINOR`, server-side |
| `api/callback.js` | `cards.paid` only | branches on `metadata.kind`; events get amount + idempotency guards |
| `Home.jsx` Pricing | "KES 500 monthly / card" | `KES {EVENT_UNIT_PRICE_KES} / {UNIT_DAYS} days`, from the constant |
| `Home.jsx` For-Events CTA | `Link to="/create"` | `/event` — **funnel bug fixed**, it was sending hosts to the personal card builder |
| `Home.jsx` / `Occasions.jsx` card price | hardcoded "KES 50" x3 | `{CARD_PRICE_KES}` |
| `eslint.config.js` | `api/` linted as browser | node globals — 6 permanent `process is not defined` false positives on the money files, gone |

## Files

New: `src/lib/eventSections.js` · `src/lib/pricing.js` · `sql/2026-08-07_event_editing_and_payment.sql`
Changed: `pages/ManageEvent.jsx` (rewrite) · `pages/Create_event.jsx` · `pages/Home.jsx` ·
`pages/Occasions.jsx` · `api/pay.js` · `api/callback.js` · `index.css` (`.manage-group*`,
`.manage-total`) · `eslint.config.js`

Build green, 492 modules. Lint clean on every touched file (the 9 remaining project-wide errors
are pre-existing in `CardPage.jsx` / `Create.jsx` / `Customize.jsx`).

## Test path (after SQL + deploy)

1. `/event` → create a draft → lands on `/manage/:manage_id`
2. Edit a scene → preview updates as you type → Save → reload → **the text is still there**
   (this is `parseEventForm` working; if textareas load empty, the SQL didn't run)
3. Change the ticket URL → Save → the CTA at the end of the preview points at the new URL
   (**this is the bug that was live — verify it explicitly**)
4. Pay KES 200 → STK push → badge flips to LIVE, invite link appears
5. Open `/card/:id` in another browser → the invite renders
6. Check `event_payments` has exactly ONE row for that reference

## NEXT SESSION

1. **Host inbox** — `/manage/:manageId/feedback`. `get_event_feedback(p_manage_id)` already
   exists in the DB and nothing consumes it. Decided this session: **one table + a `kind`
   column** (`'question'` pre-event | `'feedback'` post-event) rather than a second table.
   Stars must not render on a pre-event question. Needs a migration + updated RPC +
   `FeedbackScene` sending `kind`.
2. **Referral / distribution system** — pressure-tested this session. The structural finding:
   distribution is NOT the bottleneck (every paid card is already a WhatsApp link to a new
   person); **recipient → creator conversion** is, and it is unmeasured.
3. Landing-screen preview component (the known gap above).
4. August seasonal overlay video (still carried over from 1 Aug).

---

## SESSION 14 AUG — DEMO DAY PROGRAMME (standalone project)

**Brief:** a programme for Hackhouse Demo Day that (1) the media team scrolls through on the
big screen during the event, and (2) the audience reaches by scanning a QR code. Not a pamphlet —
a programme. **Explicitly scoped as a separate thing: the pilot cards and the app were not
touched.**

Lives at `demo-day-program/` in the repo root (NOT inside `scrolly-letters/`). Live at
https://demo-day-program.netlify.app

### Data collected (all real, from documents on disk)

- `Hackhouse_Active_Startups_Styled_Expanded.docx` — 9 startups, sector + description
- `HackHouse_Cohort3_Board_Report.pdf` — session log, per-founder traction, founder feedback
- `Board_report_hackhouse_programs (1).pptx` — Demo Day plan, guest list, judges, Cohort 4 calendar

### Four corrections to `pilotEvents.js` data (it was wrong, provably)

| Was | Is | Source |
|---|---|---|
| 20 September, 2:00 PM | **Thu 20 August, 9:00am–5:00pm** | Board deck slide 13 |
| Nine teams pitch | Ten finishers; **nine pitching** (Hackersavannah removed on instruction) | Deck + PDF |
| "Twelve weeks of building" | **Eight weeks** — twelve is Cohort 4's design | PDF: Pre-Week→Week 8 |
| "One night to show it" | **One day** — it is 9am–5pm | Board deck |

The last two are the POSTER's own tagline. It is factually about a different cohort. The
programme corrects it; the poster is a separate conversation.

### The architectural decision (the whole session hangs off it)

**Clock-driven "ON NOW" was rejected.** Events run 30–40 min late by mid-afternoon; a phone that
computes the current segment from the clock starts naming the wrong founder. **Shared state
(Supabase table + realtime) was also rejected** — not for engineering cost (~40 lines) but human
cost: it stays true only if someone advances it every time the room moves, and that person is
also fixing HDMI cables.

**Shipped: static, with honest labels.** The page says `SCHEDULED 12:30`, never `ON NOW` — which
stays true all day however late the room runs. `Jump to now ↓` is a button the READER presses, so
the clock is a navigation aid they invoked, not a claim we made. **The wall is already live for
free** because a human operator is watching the room.

> Principle: **honesty is a property of what you claim, not of what you know.** Static state fails
> toward "go check the wall"; live state fails toward confident wrongness.

### What was built

```
program.js       the only words. 20 segments, kind: 'pitch' | 'moment'
index.html       THE PHONE — scroll mechanic PORTED from ScrollPage.jsx + index.css
build.js         → dist/index.html (validates, then inlines program.js)
make-pptx.js     THE WALL — → dist/demo-day-stage.pptx, 22 slides, editable
make-qr.js       → qr.svg / qr.png / qr-poster.html / qr-pack.pdf
```

- **`progress: [{value, label}]` not a sentence.** A sentence is trapped at one size; a
  value/label pair renders as a scroll beat on the phone AND 38pt on the wall from one array.
- **Scroll ported, not approximated** — IntersectionObserver threshold 0.4, one-way,
  `.scene--hidden`→`--visible`, stagger .1/.35/.6/.85/1.1 then .18s step. Client feedback on
  record says do not touch the scroll mechanics.
- **PowerPoint beat the HTML presenter** — the media team already owns PowerPoint. Bought speaker
  notes (the pitch paragraph goes in the notes, not on the wall).
- **`timesAreDraft: true`** paints a draft band on both surfaces + a DO NOT PRINT band on the PDF.
  Added because the `// TODO(you)` markers on each time are COMMENTS and never reach a screen.

### Errors hit and fixed

1. **`netlify.toml` copied into `dist/` → deploy failed, ENOENT package.json, exit 254.** `dist/`
   is the OUTPUT of a build; the copied `[build]` section made Netlify try to build its own
   output. **Fix: `build.js` now DERIVES a headers-only config** (everything from the first
   `[[headers]]` on). Same category as the Guide-05 `sections` drift bug — *derive, never copy.*
2. **Tall scene never revealed.** "The whole day" index is taller than the viewport, and an
   element >2.5 screens can never hit a 0.4 intersection ratio. Fix: observe on `[0.05, 0.4]` and
   accept the tall case. The ported mechanic's assumptions travelled with it.
3. **`EBUSY` when PowerPoint has the deck open** — now a readable message instead of a stack
   trace, since this will happen on the day.
4. **`characterSpacing` is a pdfkit text OPTION, not a chainable method.**
5. **npm `ECOMPROMISED — Lock compromised`** on `npx netlify-cli`: npx's lock heartbeat times out
   on a 1129-package install. Not corruption. Fix: install locally, or use Netlify Drop.

### Verified

- Site live: 200 OK, 33,738 bytes, byte-identical to local build; `Cache-Control` header applied
- `X-Robots-Tag` did NOT survive Netlify — but `<meta name="robots" content="noindex">` is in the
  deployed HTML, which is the signal that counts
- QR decoded with jsQR from the PNG **and** from the rendered PDF pages → exact URL match, all
  four table cards too
- `.pptx` unzipped and slide XML read back: 22 slides, 22 notes

### BLOCKING for 20 Aug (six days out)

1. **The run of show.** All 20 times invented. The shape is right; the clock is fiction.
2. **The venue.** Appears in no document.
3. **The traction numbers.** Every figure came from a report stamped *Confidential — Internal Use
   Only*, flagged unverified/self-reported. Antler, Baobab, Savannah Fund, NCBA and M Oriental
   will read them off a wall. Earthwise's were omitted — those numbers are TARGETS, not actuals.

Kept out deliberately: cohort attrition, the four silent drop-outs by name, reporting-channel
gaps, the risk register, any guest marked *to confirm*.

### Open question carried forward

"Come up in between" — whether the live Demo Day event card should link out to the programme (one
anchor tag, zero schema risk) or something appears between pitches on the wall. Never resolved.

---

## SESSION 19 AUG — MOTION LAB + ANNIVERSARY CARD (standalone project)

Lives in `motion-lab/`, outside the app. Two Vite entries: the sandbox at `index.html`, the card
at `card.html`. Nothing in `scrolly-letters/` was touched this session.

### What was built

- **Motion Lab** — 22 interactive effects across typography, scroll-driven, ambient, paper/3D and
  reel formats. Each effect is a descriptor object (id, controls schema, presets, live code
  snippet, teaching notes); the registry globs `src/effects/**` twice — once for the module, once
  `?raw` for the source shown in the Code tab. Adding an effect requires no wiring.
- **The card, scene 1** — collage scramble resolving to HAPPY ANNIVERSARY (each letter locks into
  its own typeface/colour/rotation/paper chip), then a 3D tilt button that spins 540° to hand over.
- **The card, scene 2** — wax-sealed envelope opening once, then a continuous scrolling letter
  where prose breaks **mid-sentence** and a taped polaroid completes it. Five moments.
- **Build guide** — `scrolly-letters-motion-lab-build-guide.html` (microworld, with a playable
  debug game covering the four bugs).

### Errors hit and fixed

1. **`(i * 7) % 7` is 0 for every i.** The collage picked one treatment per letter via a hash whose
   multiplier shared a factor with the modulus. Rendered valid-looking output — a plain headline —
   and threw nothing. Replaced with an integer hash.
2. **`height: 100%` on a sticky pin** resolves against the *tall track*, not the viewport. Two
   scroll effects rendered blank frames. Fixed to `100dvh` / measured container height.
3. **Framer-motion rewrites the whole `transform` property**, wiping a CSS `translateZ`. The wax
   seal dropped to Z=0 behind the flap and was invisible. `z-index` can't rescue it inside
   `preserve-3d`. Fix: static wrapper owns the depth, animated child owns the motion.
4. **`onAnimationComplete` fires for gesture animations.** `whileTap` springing back fired it
   ~250ms after click, cutting off the button's 950ms spin. Moved to an explicit timer.
5. **Conditionally mounting the CTA reflowed the centred column**, jumping the headline 22px.
   Invisible in stills, obvious in motion. Fix: always render, animate opacity, reserve the box.
6. **A bare-triangle envelope flap** left wedges either side where the page showed through. Flap is
   now a full panel with a V cut into it, deep enough to overlap the pocket's shoulders.

### Verified

- Both entries build clean; 22/22 effects render at top and mid-scroll with zero console output
  (automated Playwright sweep, screenshots per effect)
- Layout jump fix measured: headline top `275px` at both `t=1.0` and `t=3.5`
- Spin handoff measured: click → scene 2 in `1526ms` (950 spin + 500 crossfade)
- Build guide demos verified to reproduce their bugs: bug 1 gives 1 unique treatment broken / 6
  fixed; bug 3 jumps 22px broken / 0px fixed

### Recorded as unexplained

The beat-text blank frame under `AnimatePresence mode="popLayout"`. The fix is verified by
screenshot; the mechanism is not. The obvious explanation (inline collapse under absolute
positioning) does not survive checking, since `position: absolute` blockifies `display`. Logged in
the guide as symptom + fix, deliberately **not** as a lesson.

### DECIDED — customize page direction

**Curated styles, applied whole-card.** Sender picks a feel (Handwritten / Cinematic / Reel /
Collage) and it sets the effect for every scene coherently. Not per-scene pickers, not raw sliders.
Reasoning: a gift card has a deadline and an audience of one; every exposed knob is a way to
produce something worse than the default.

Data contract cost is **one nullable column**:

```
+ style: 'handwritten'      // card level; sections[] unchanged
```

Styles are a client-side lookup table, not rows — adding one is a deploy, not a migration. Resolve
as `STYLES[card.style]?.[section.type] ?? DEFAULT_EFFECT[section.type]`, so every existing card
keeps working with `style = null` and partial styles are safe.

Two standing constraints this must not break: never gate indexed content behind animation (see SEO
rules), and never touch the scroll mechanics — a style changes how a scene *arrives*, not how
scrolling behaves.

### Open questions — customize page

1. **Where does the picker live?** A step inside `/create`, or a separate `/customize` after the
   card exists? The second allows restyling an already-sent card — feature, or alarming?
2. **Live preview per style, or a still?** Live is better and means running every style's effects
   inside the form.
3. **Free or paid?** Styles are the most natural paid tier the product has — but gating them means
   the free card is visibly the plain one.
4. **How many styles at launch?** Four feels like a choice; ten is a maintenance burden on every
   future scene type.

### Open questions — the card itself

5. Her name, his name, and the anniversary date. Scene 1 and the letter still render `<<HER NAME>>`
   placeholders. All copy is in `motion-lab/src/card/copy.js`; nothing else contains words.
6. Dark scene 1 vs a Soft Pearl variant — the collage reference is on white, the build is on
   Midnight. Not compared side by side yet.
7. Photos. `public/moments/01–05.jpg`, mapped in order to the `moment` blocks. Placeholders render
   until they exist.
