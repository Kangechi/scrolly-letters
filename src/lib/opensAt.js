/* ============================================================
   OPENS_AT — the time-lock, shared by the checkout (where it's set) and the
   card page (where it's enforced). One formatter, so the sender and the
   recipient read the same sentence for the same instant.
   ============================================================ */

/** <input type="datetime-local"> speaks LOCAL time with no zone: "2026-09-20T18:30". */
export function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
         `T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** "Sun 20 Sep, 6:30 pm" — in the READER's own timezone. */
export function formatOpensAt(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  })
}

/** Is this card still time-locked right now? */
export function isLocked(opensAt, now = Date.now()) {
  return Boolean(opensAt) && Date.parse(opensAt) > now
}
