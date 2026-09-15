import { motion, useReducedMotion } from 'framer-motion'
import { inkTimings } from './shared'

/* The Handwritten look's arrival. The lab's Handwriting effect draws SVG
   strokes for four hand-built words — it can't write arbitrary text. This is
   its generalisation: a clip-path wipes each line in left to right, like ink
   following a pen, in the handwritten face the look sets.

   clip-path: inset(top right bottom left). Animating RIGHT from 100% → 0%
   uncovers the line from the left edge. Top/bottom are -0.2em (negative =
   outside the box) so ascenders and descenders are never shaved off. */

const HIDDEN = { clipPath: 'inset(-0.2em 100% -0.2em 0)' }
const SHOWN = { clipPath: 'inset(-0.2em 0% -0.2em 0)' }

export default function InkReveal({ lines, play, lineClassName }) {
  const reduce = useReducedMotion()
  const timings = inkTimings(lines)

  return lines.map((line, i) => (
    <motion.span
      className={`${lineClassName} arr-ink`}
      key={i}
      initial={reduce ? false : HIDDEN}
      animate={play ? SHOWN : undefined}
      transition={{ ...timings[i], ease: [0.45, 0, 0.55, 1] }}
    >
      {line}
    </motion.span>
  ))
}
