import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO, layout } from './shared'

/* Ported from motion-lab/src/effects/text/LetterReveal.jsx. The descriptor,
   knobs, code tab and notes are stripped — values are frozen near the lab's
   "Whisper" preset.

   THE ONE CHANGE FROM THE LAB: it animates on `play`, not on mount. Every
   scene on a card mounts at page load (the reveal only fades them in), so a
   mount-driven effect would finish before anyone scrolled to it. */

const SHOWN = { opacity: 1, y: 0, filter: 'blur(0px)' }

export default function LetterReveal({ lines, play, lineClassName }) {
  const reduce = useReducedMotion()
  const { rows, total } = layout(lines)
  // Cap the whole reveal near 1.6s, however long the text is.
  const stagger = Math.min(0.022, 1.6 / Math.max(total, 1))

  return rows.map((row, li) => (
    <span className={lineClassName} key={li}>
      {/* Screen readers get the sentence, not 40 separate letters. */}
      <span className="sr-only">{row.line}</span>
      <span aria-hidden="true">
        {row.words.map((w, wi) => w.space ?? (
          <span key={wi} className="arr-word">
            {w.chars.map(({ ch, i }) => (
              <motion.span
                key={i}
                className="arr-char"
                initial={reduce ? false : { opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={play ? SHOWN : undefined}
                transition={{ duration: 0.7, delay: i * stagger, ease: EASE_OUT_EXPO }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
        ))}
      </span>
    </span>
  ))
}
