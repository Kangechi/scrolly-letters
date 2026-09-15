import { motion, useReducedMotion } from 'framer-motion'
import ArrivalLines from '../arrivals/ArrivalLines'

/* "Who you are to me" as a TORN NOTE — the strip of ruled paper from under
   the anniversary card's photos. The ragged edges are one clip-path polygon;
   the ruled lines are a repeating gradient; nothing is an image.

   The slight tilt is the CSS `rotate` PROPERTY, not transform: rotate(). They
   are independent, so framer-motion can own `transform` for the rise-in
   without wiping the tilt (the lab's bug 3, avoided by construction). */

const EASE = [0.16, 1, 0.3, 1]

export default function TornNote({ label, lines, arrival, play }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className="shape-note"
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={play ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, ease: EASE }}
    >
      {label && <span className="shape-note-label">{label}</span>}
      <ArrivalLines fx={arrival} play={play} lines={lines} lineClassName="shape-note-line" />
    </motion.div>
  )
}
