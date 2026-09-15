-- ============================================================
-- CREATE STUDIO · PHASE 2 — looks + per-scene arrivals
--
-- RUN BY HAND in the Supabase SQL editor BEFORE anyone uses /customize —
-- the studio writes these two columns and an insert naming a missing column
-- fails outright. Idempotent: safe to run again.
-- (Plain /create never names them, so it works with or without this file.)
-- ============================================================

-- `style`: the NAME of a look ('handwritten', 'cinematic', 'collage').
-- Nullable on purpose — null means "render the way you always have", so
-- every card already sent keeps rendering identically. No backfill.
--
-- No CHECK constraint, deliberately. Constraining it to a list would make
-- every new look a migration, and a card written by a newer deploy could
-- fail to insert against an older database. The client already treats an
-- unknown name as null (resolveArrival / lookClass in src/lib/styles.js) —
-- that IS the validation.
alter table public.cards
  add column if not exists style text;

-- `style_overrides`: per-scene arrival picks, e.g. {"hero": "maskReveal"}.
-- Same reasoning — unknown keys/values resolve to the look's default.
alter table public.cards
  add column if not exists style_overrides jsonb;

-- ── Studio v2 ──────────────────────────────────────────────

-- Your own colours. The SAME three names the events table uses, so
-- ScrollPage's existing hex-colour path renders them with no new code.
-- Validated client-side (cleanColors in src/lib/design.js: only #rrggbb
-- survives), because these values end up inside an inline style.
alter table public.cards
  add column if not exists accent   text,
  add column if not exists accent_2 text,
  add column if not exists bg       text;

-- Everything else the studio sets, in one document:
--   { opening: 'envelope', backdrop: 'paper',
--     scenes: { message: 'letter', memory: 'polaroid' },
--     stickers: ['🌸', '✨'] }
-- Each value is checked against a list in design.js; anything unknown
-- resolves to the plain default. Null = a card with no design.
alter table public.cards
  add column if not exists design jsonb;

comment on column public.cards.style is
  'Named look. Resolved client-side against STYLES in src/lib/styles.js. Null = default scenes.';
comment on column public.cards.style_overrides is
  'Per-scene arrival picks {sceneType: arrivalName}. Unknown values fall back safely.';

-- Pricing reads these two columns (productOf in src/lib/pricing.js): either
-- one set → the custom-card price. They are written by the browser at insert,
-- which is fine: setting them can only RAISE the price, never lower it.
