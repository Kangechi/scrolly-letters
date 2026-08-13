/* ============================================================
   SPLIT LINES — how a host's blob of text becomes the revealed
   lines of a scene.

   WHY THIS FILE EXISTS (the bug it kills):
   WhoScene, Message and MemoryScene each carried their own copy of

       data.text.split(/(?<=[.!?])\s+/)

   — split at sentence-enders. That is right for prose ("It's been a
   year. We should mark it.") and silently wrong for a LIST:

       Kwanza Tukule — food distribution
       Chpter — conversational commerce
       Amini — climate data

   Not one `.` `!` or `?`, so the whole lineup came back as a SINGLE
   line and rendered as one run-on smear. No error, no log — the host
   typed a tidy list and the card showed a paragraph.

   THE RULE NOW: a newline is a line break, and so is a sentence end.
   Prose behaves exactly as it did before (no newlines in it to find);
   lists start working. One rule, one place, three callers.
   ============================================================ */

/* `\n+` first so a run of blank lines collapses to one break rather than
   producing empty spans; the trim+filter is the belt to that suspenders,
   covering trailing newlines and stray double spaces. */
export function splitLines(text) {
  return String(text ?? '')
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
}
