# Progress Tracker

This is the file that keeps track of all that we do & even acts as a documentation that I can refer to & get a glimpse of every change, error , implemenation update and everything that took place in a session.

## Current Phase

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
