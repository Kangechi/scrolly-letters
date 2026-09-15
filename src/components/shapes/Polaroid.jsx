import { motion, useReducedMotion } from 'framer-motion'

/* The memory as a POLAROID. Ported from motion-lab's PolaroidDrop and the
   anniversary card's Moment: a taped print, deeper at the foot (that deeper
   edge is what reads as a photo print rather than a bordered image), which
   drops in on a spring and "develops" — a dark layer fades off the photo.

   No photo upload yet (a storage bucket + size cap is a follow-up), so the
   "photo" is the card's own colours with the emoji — honest about being a
   stand-in, and it still matches whatever colours the sender chose. The
   memory text becomes the handwritten caption. */

export default function Polaroid({ label, text, emoji, play }) {
  const reduce = useReducedMotion()

  return (
    <div className="shape-polaroid-wrap">
      {label && <span className="scene-label">{label}</span>}
      <motion.figure
        className="shape-polaroid"
        initial={reduce ? false : { opacity: 0, y: 40, rotate: -9, scale: 0.94 }}
        animate={play ? { opacity: 1, y: 0, rotate: -2.5, scale: 1 } : undefined}
        transition={{ type: 'spring', stiffness: 180, damping: 22, mass: 0.9 }}
      >
        <span className="shape-polaroid-tape" aria-hidden="true" />
        <div className="shape-polaroid-photo" aria-hidden="true">
          <span>{emoji}</span>
          {!reduce && (
            <motion.span
              className="shape-polaroid-develop"
              initial={{ opacity: 1 }}
              animate={play ? { opacity: 0 } : undefined}
              transition={{ duration: 1.8, delay: 0.5, ease: 'easeInOut' }}
            />
          )}
        </div>
        <figcaption className="shape-polaroid-caption">{text}</figcaption>
      </motion.figure>
    </div>
  )
}
