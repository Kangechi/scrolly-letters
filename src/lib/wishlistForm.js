import { nanoid } from 'nanoid'

/* ============================================================
   WISHLIST FORM — what a wishlist holds and how it becomes sections[].
   A wishlist is just a card whose sections include a `wishlist` scene, so
   it reuses the card page, looks, checkout, scheduling and noindex for free.

   Sections:  hero ("Wanjiru’s birthday wishes")
              message (optional note)
              wishlist (the items)
              closing
   ============================================================ */

export const MAX_ITEMS = 20
export const WISH_EMOJIS = ['🎁', '📚', '🎧', '👟', '🌸', '☕', '🎮', '💄', '🪴', '✈️', '🍰', '💍']

/* Only http(s) links are ever rendered as <a href>. Anything else — including
   "javascript:…" — is dropped when saving AND refused when rendering. */
export const SAFE_LINK = /^https?:\/\/\S+$/i

/* Sample wishes so the builder opens on a list you can see move. Fixed ids
   are fine for samples; every wish added afterwards gets a nanoid. */
export const SAMPLE_WISHLIST = {
  owner: 'Wanjiru',
  occasion: 'Birthday',
  theme: 'lovely',
  emoji: '🎁',
  note: 'Honestly, your company is the gift.\nBut since you asked…',
  closing: 'Thank you for thinking of me',
  items: [
    { id: 'w1', emoji: '📚', name: 'Atomic Habits (paperback)', price: '1200', link: '', note: '' },
    { id: 'w2', emoji: '🎧', name: 'Wireless earbuds', price: '4500', link: '', note: 'Any colour but white' },
    { id: 'w3', emoji: '🪴', name: 'A plant for my desk', price: '', link: '', note: 'Something hard to kill' },
  ],
}

export const newItem = () => ({ id: nanoid(6), emoji: '🎁', name: '', price: '', link: '', note: '' })

/** What gets SAVED: unnamed rows dropped, prices digits-only, unsafe links blanked. */
export function cleanItems(items) {
  return items
    .filter((it) => it.name.trim())
    .map((it) => ({
      id: it.id,
      emoji: it.emoji,
      name: it.name.trim(),
      price: String(it.price).replace(/[^\d]/g, ''),
      link: SAFE_LINK.test(it.link.trim()) ? it.link.trim() : '',
      note: it.note.trim(),
    }))
}

/** null when the list can be created, otherwise a sentence to show. */
export function validateWishlist(form) {
  if (!form.owner.trim()) return 'Add your name — these are your wishes.'
  if (!form.items.some((it) => it.name.trim())) return 'Add at least one wish.'
  const bad = form.items.find((it) => it.link.trim() && !SAFE_LINK.test(it.link.trim()))
  if (bad) return `The link for “${bad.name || 'a wish'}” must start with http:// or https://`
  return null
}

export function buildWishlistSections(form) {
  const owner = form.owner.trim()
  return [
    {
      type: 'hero',
      headline: `${owner ? `${owner}’s` : 'My'} ${form.occasion.toLowerCase()} wishes`,
      sub: '',
    },
    form.note.trim() && { type: 'message', sub: 'A note', text: form.note },
    { type: 'wishlist', label: 'The list', items: cleanItems(form.items) },
    { type: 'closing', sub: 'With love', text: owner, line: form.closing },
  ].filter(Boolean)
}
