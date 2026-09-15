import { supabase } from './supabase'

/* ============================================================
   WISH CLAIMS — "I'll get this", without accounts and without names.

   The server (sql/2026-09-15_create_studio_wishlist.sql) hands back a random
   token when you claim. We keep it HERE, in this browser, keyed by card —
   the same pattern as ticketAccess.js. Holding the token is what lets you
   undo; nobody else can, and the server only stores its hash.

   localStorage is a convenience, not security: clear it and you lose your
   undo (the claim itself stays, which is the safe direction to fail).
   ============================================================ */

const keyFor = (cardId) => `scrolly:wish:${cardId}`

function readTokens(cardId) {
  try { return JSON.parse(localStorage.getItem(keyFor(cardId))) || {} } catch { return {} }
}
function writeTokens(cardId, map) {
  try { localStorage.setItem(keyFor(cardId), JSON.stringify(map)) } catch { /* private mode — undo just won't persist */ }
}

/** Item ids THIS browser claimed. */
export function myClaims(cardId) {
  return Object.keys(readTokens(cardId))
}

/** Item ids anyone has claimed. */
export async function fetchClaims(cardId) {
  const { data, error } = await supabase.rpc('get_wish_claims', { p_card_id: cardId })
  if (error) throw error
  return Array.isArray(data) ? data : []
}

/* The SQL raises short codes; map them once, here, to what the UI knows. */
function codeOf(error) {
  const m = error?.message || ''
  for (const code of ['already_claimed', 'locked', 'no_such_item', 'not_found']) {
    if (m.includes(code)) return code
  }
  return 'failed'
}

export async function claim(cardId, itemId) {
  const { data: token, error } = await supabase.rpc('claim_wish', { p_card_id: cardId, p_item_id: itemId })
  if (error) return { error: codeOf(error) }
  writeTokens(cardId, { ...readTokens(cardId), [itemId]: token })
  return { ok: true }
}

export async function unclaim(cardId, itemId) {
  const tokens = readTokens(cardId)
  const token = tokens[itemId]
  if (!token) return { error: 'not_yours' }

  const { data: undone, error } = await supabase.rpc('unclaim_wish', {
    p_card_id: cardId, p_item_id: itemId, p_token: token,
  })
  if (error) return { error: 'failed' }

  const rest = { ...tokens }
  delete rest[itemId]
  writeTokens(cardId, rest)
  return undone ? { ok: true } : { error: 'not_yours' }
}
