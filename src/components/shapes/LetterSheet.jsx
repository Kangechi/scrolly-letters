import { motion, useReducedMotion } from 'framer-motion'
import ArrivalLines from '../arrivals/ArrivalLines'

/* The message as a FOLDED LETTER. Ported from motion-lab/src/effects/paper/Unfold.jsx.

   The paper is split into up to three panels. Panel 0 faces you; the others
   start rotated -92° on a hinge along their TOP edge (transform-origin: top),
   i.e. folded back almost edge-on. When the scene is seen they swing down in
   sequence, top to bottom — the sequence is what reads as paper rather than
   an accordion. 92° not 90°: paper that won't quite lie flat looks real;
   exactly 90° looks like a machine (a note from the lab).

   Folded panels still take up their space in the layout (a transform never
   changes layout), so the letter's height is reserved from the first frame
   and nothing below it jumps when it opens. */

const EASE = [0.16, 1, 0.3, 1]

/** Spread the lines over at most three panels, top-down. */
function toPanels(lines, max = 3) {
  const n = Math.max(1, Math.min(max, lines.length))
  const per = Math.ceil(lines.length / n)
  return Array.from({ length: n }, (_, i) => lines.slice(i * per, i * per + per)).filter((p) => p.length)
}

export default function LetterSheet({ label, lines, arrival, play }) {
  const reduce = useReducedMotion()
  const panels = toPanels(lines)

  return (
    <div className="shape-letter">
      {panels.map((chunk, i) => {
        const folded = !reduce && i > 0
        const timing = { duration: 0.85, delay: 0.2 + i * 0.22, ease: EASE }
        return (
          <motion.div
            key={i}
            className="shape-letter-panel"
            style={{ zIndex: panels.length - i }}
            initial={folded ? { rotateX: -92 } : false}
            animate={play ? { rotateX: 0 } : undefined}
            transition={timing}
          >
            {i === 0 && label && <span className="shape-letter-label">{label}</span>}
            <div className="lines">
              <ArrivalLines fx={arrival} play={play} lines={chunk} lineClassName="line" />
            </div>
            {/* the shadow the panel above casts while it's still folded */}
            {folded && (
              <motion.span
                className="shape-letter-crease"
                aria-hidden="true"
                initial={{ opacity: 0.55 }}
                animate={play ? { opacity: 0 } : undefined}
                transition={timing}
              />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
