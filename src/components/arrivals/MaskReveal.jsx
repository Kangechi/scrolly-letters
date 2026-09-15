import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from './shared'

/* Ported from motion-lab/src/effects/text/MaskReveal.jsx.
   The trick is two boxes: the OUTER span clips (overflow: hidden), the INNER
   span starts pushed down 110% — fully below the clip — and slides up into
   view. Nothing fades; the line is simply uncovered. The text is real DOM
   text the whole time, so it stays readable and selectable. */

export default function MaskReveal({ lines, play, lineClassName }) {
  const reduce = useReducedMotion()

  return lines.map((line, i) => (
    <span className={`${lineClassName} arr-mask`} key={i}>
      <motion.span
        className="arr-mask-inner"
        initial={reduce ? false : { y: '110%' }}
        animate={play ? { y: '0%' } : undefined}
        transition={{ duration: 0.9, delay: i * 0.12, ease: EASE_OUT_EXPO }}
      >
        {line}
      </motion.span>
    </span>
  ))
}
