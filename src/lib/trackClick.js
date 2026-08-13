/* ============================================================
   TRACK CLICK — the only measurement this product takes.

   WHAT THE HOST ASKED FOR: "how many people bought a ticket?"
   WHAT WE CAN ACTUALLY ANSWER: "how many people tapped through to your
   ticket page." The purchase happens inside Eventbrite / Ticketsasa /
   whatever the host sells on. We watch the guest leave; we never see them
   arrive. Every name in this file says `click` rather than `conversion`
   so that nobody — including future you — reads more into the number
   than it holds.

   THE ONE RULE: this must never delay the guest.
   A guest tapping "Get your ticket" is the entire point of the card. The
   metric is a by-product. So the insert is fired and forgotten: not
   awaited, no spinner, no error surfaced, and crucially no
   preventDefault() on the anchor. If Supabase is slow, down, or blocked
   by an ad blocker, the guest still lands on the ticket page at exactly
   the same speed. A lost click is an acceptable loss. A lost ticket sale
   is not.
   ============================================================ */

import { supabase } from './supabase'

/* Mirrors the CHECK constraint in 2026-08-11_pilot_events.sql. Kept here so
   a typo shows up as an obviously-wrong constant at the call site rather
   than as a 400 from Postgres at runtime. */
export const CTA_IDS = {
  TICKET: 'ticket',   // the primary "buy / register" button
  COHORT: 'cohort',   // Demo Day's second CTA — join the next cohort
  OPEN: 'open',       // the card itself was opened (the denominator)
}

/* Opens are counted once per browser session, not once per scroll. Without
   this a guest who scrolls back up to re-read the lineup inflates the
   host's "opens" number, and the click-through rate silently deflates. */
const openedThisSession = new Set()

/**
 * Log one interaction with a card. Fire-and-forget by design.
 *
 * @param {string} eventId - events.id (uuid) — NOT the manage_id.
 * @param {string} ctaId   - one of CTA_IDS.
 * @returns {void} deliberately nothing to await.
 */
export function trackClick(eventId, ctaId) {
  if (!eventId || !ctaId) return

  if (ctaId === CTA_IDS.OPEN) {
    if (openedThisSession.has(eventId)) return
    openedThisSession.add(eventId)
  }

  /* Both handlers are empty on purpose. An error here is not the guest's
     problem and not worth a console line on their phone — swallowing it is
     the decision, not an oversight. The `.then(ok, err)` two-argument form
     is used rather than .catch() so this never produces an unhandled
     rejection warning in any browser. */
  supabase
    .from('event_clicks')
    .insert({ event_id: eventId, cta_id: ctaId })
    .then(
      () => {},
      () => {},
    )
}

/**
 * Read the counts back for the host's dashboard.
 *
 * Returns a plain object keyed by cta_id so the manage page can do
 * `counts.ticket ?? 0` without looping. An event with no clicks yet returns
 * {} rather than throwing — "nobody has clicked" is a normal state on the
 * day you publish, not an error.
 *
 * @param {string} manageId - the host's secret manage link id.
 * @returns {Promise<Record<string, {clicks: number, lastClick: string|null}>>}
 */
export async function getClickCounts(manageId) {
  const { data, error } = await supabase.rpc('get_event_clicks', {
    p_manage_id: manageId,
  })

  if (error || !Array.isArray(data)) return {}

  return data.reduce((acc, row) => {
    acc[row.cta_id] = { clicks: Number(row.clicks) || 0, lastClick: row.last_click ?? null }
    return acc
  }, {})
}
