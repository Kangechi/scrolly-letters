/* ============================================================
   TICKET ACCESS — remembering that this device already bought in.

   ⚠ READ THIS BEFORE TRUSTING IT FOR ANYTHING:
   This is NOT security. It is a localStorage flag. Anyone who opens
   devtools and types one line gets past it, and that is fine, because
   what sits behind the gate is a lineup and a venue — marketing copy the
   host WANTS spread. The gate exists to make the ticket the first thing
   a guest does, not to keep secrets.

   Everywhere else in this codebase the rule is "the server decides"
   (RLS on events, the allowlist in update_event, the webhook as the only
   writer of paid). This file is the deliberate exception, and it is only
   allowed to be one because nothing behind it is confidential. The moment
   a gated card holds something that must not leak — a private address, a
   dial-in link — this file stops being sufficient and the check has to
   move to the server.

   WHY PER-DEVICE AND NOT PER-PERSON: there are no guest accounts. There is
   nothing to tie a purchase to except this browser. A guest who opens the
   link on their laptop after paying on their phone sees the gate again.
   That is a known, accepted cost of having no login.
   ============================================================ */

/* Namespaced so it can never collide with another key on the same origin,
   and so `localStorage.clear()`-style debugging can find ours by prefix. */
const KEY_PREFIX = 'sl_ticket_'

const keyFor = (eventId) => `${KEY_PREFIX}${eventId}`

/* Every call is wrapped: localStorage throws in Safari private mode and in
   embedded webviews with storage disabled. A guest whose browser refuses to
   remember should still be able to walk the flow — they just see the gate
   again next time. Losing the memory is acceptable; a white screen is not. */
function safeGet(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/**
 * Has this device already been through the ticket flow for this event?
 * @param {string} eventId
 * @returns {boolean}
 */
export function hasTicket(eventId) {
  if (!eventId) return false
  return Boolean(safeGet(keyFor(eventId)))
}

/**
 * Record that this device bought in. Stores a timestamp rather than `true`
 * so that a future "your ticket, bought on 4 September" line is possible
 * without another migration — and so a stale flag is at least diagnosable.
 *
 * @param {string} eventId
 * @param {{reference?: string}} [meta] - checkout reference, when there is one.
 */
export function grantTicket(eventId, meta = {}) {
  if (!eventId) return
  safeSet(
    keyFor(eventId),
    JSON.stringify({ at: new Date().toISOString(), reference: meta.reference ?? null }),
  )
}

/**
 * Forget the ticket for this event. Used by the "replay from the start"
 * control, and the thing you will want when demoing the flow to a host for
 * the third time in one meeting.
 * @param {string} eventId
 */
export function revokeTicket(eventId) {
  if (!eventId) return
  try {
    window.localStorage.removeItem(keyFor(eventId))
  } catch {
    /* nothing to do — if we can't write we couldn't have stored it either */
  }
}

/**
 * A reference string for the simulated checkout. Shaped like a real payment
 * reference so the UI that displays it doesn't have to change when actual
 * payments arrive — but prefixed SIM- so a real one is never mistaken for it
 * in a log, a screenshot, or a support conversation.
 * @returns {string}
 */
export function simulatedReference() {
  const stamp = Date.now().toString(36).toUpperCase()
  const noise = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `SIM-${stamp}-${noise}`
}
