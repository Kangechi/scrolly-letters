/* Shared helpers for the arrivals. Ported from motion-lab/src/effects/_shared. */

/** The lab's "soft (out-expo)" — fast start, long graceful settle. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]

/**
 * Lines → words → characters, each character carrying a GLOBAL index so a
 * stagger flows across line breaks instead of restarting on every line.
 *
 * Words matter: per-character inline-blocks are "atomic inlines", and the
 * browser may wrap BETWEEN any two of them — i.e. mid-word. Grouping the
 * characters of a word in one nowrap span keeps "birthday" on one line.
 *
 * Lives outside any component on purpose: the running counter is mutated
 * here, in plain JS, never during a React render.
 */
export function layout(lines) {
  let i = 0
  const rows = lines.map((line) => ({
    line,
    words: line.split(/(\s+)/).filter(Boolean).map((w) => {
      if (/^\s+$/.test(w)) {
        i += w.length
        return { space: w }
      }
      return { chars: Array.from(w).map((ch) => ({ ch, i: i++ })) }
    }),
  }))
  return { rows, total: i }
}

/** Ink timings: each line's duration scales with its length, and the next
    line starts just before the previous finishes — a pen, not a printer. */
export function inkTimings(lines) {
  let at = 0
  return lines.map((line) => {
    const duration = Math.min(0.5 + line.length * 0.025, 1.6)
    const t = { delay: at, duration }
    at += duration * 0.85
    return t
  })
}
