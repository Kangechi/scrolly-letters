import { useEffect, useId, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/* ============================================================
   The wax-sealed envelope — ported from the anniversary card
   (motion-lab/src/card/letter/Envelope.jsx). Plays once, then hands over.

     Beat 1  the seal lifts and tips away
     Beat 2  the flap folds back (rotateX on a top-edge hinge)
     Beat 3  the page rises out
     Beat 4  → onOpened()   (the card's normal reveal: confetti, scenes)

   Coloured by the card: the paper stays cream, the envelope is the card's
   --accent, so it matches whatever the sender chose.

   DEPTH, the lesson carried over from the anniversary card: framer-motion
   writes the WHOLE `transform` on anything it animates, which wipes a
   translateZ set in CSS. So every animated layer takes its depth through
   framer's own `z` style value (it composes it into the transform it
   writes), and the seal's depth lives on a STATIC wrapper whose child is
   the thing that moves.
   ============================================================ */

const EASE = [0.16, 1, 0.3, 1]
const HANDOFF_MS = 2400

function WaxSeal() {
  // useId: two envelopes on one page (the studio can show one while a card
  // is open) must not share a gradient id, or one would paint the other's.
  const gid = `wax-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 100 100" className="envo-wax" aria-hidden="true">
      <defs>
        <radialGradient id={gid} cx="36%" cy="30%">
          <stop offset="0%" stopColor="#e8d3a8" />
          <stop offset="55%" stopColor="#c8a97a" />
          <stop offset="100%" stopColor="#9c7c4f" />
        </radialGradient>
      </defs>
      <path
        fill={`url(#${gid})`}
        d="M50 4 C64 4 72 12 78 18 C88 27 96 34 96 50 C96 64 88 72 79 80 C71 88 64 96 50 96 C36 96 27 87 20 80 C11 71 4 64 4 50 C4 35 12 27 20 19 C27 12 36 4 50 4 Z"
      />
      <g stroke="#8a6c42" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.85">
        <path d="M32 66 C42 56 54 44 68 34" />
        <path d="M40 56 C38 49 41 44 47 42 C48 48 46 53 40 56 Z" fill="#8a6c42" stroke="none" opacity="0.7" />
        <path d="M50 46 C48 39 51 34 57 32 C58 38 56 43 50 46 Z" fill="#8a6c42" stroke="none" opacity="0.7" />
        <path d="M45 61 C51 63 56 61 58 55 C52 53 47 55 45 61 Z" fill="#8a6c42" stroke="none" opacity="0.7" />
        <path d="M56 52 C62 54 67 52 69 46 C63 44 58 46 56 52 Z" fill="#8a6c42" stroke="none" opacity="0.7" />
      </g>
    </svg>
  )
}

export default function EnvelopeOpening({ addressedTo, hint = 'Tap the seal to open', onOpened }) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  function start() {
    if (open) return
    setOpen(true)
    timer.current = setTimeout(() => onOpened?.(), reduce ? 300 : HANDOFF_MS)
  }

  return (
    <div className="envo">
      <motion.div
        className="envo-body"
        role="button"
        tabIndex={0}
        aria-label="Open the envelope"
        onClick={start}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            start()
          }
        }}
        animate={open ? { scale: 1.04, y: -8 } : { scale: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EASE }}
      >
        {/* back wall */}
        <div className="envo-back" />

        {/* the page — exactly the envelope's height, hidden at rest */}
        <motion.div
          className="envo-page"
          style={{ z: 1 }}
          initial={{ y: '0%' }}
          animate={open ? { y: '-58%', scale: 1.04 } : { y: '0%', scale: 1 }}
          transition={{ duration: 1.25, delay: open ? 0.62 : 0, ease: EASE }}
        >
          <span className="envo-page-to">{addressedTo}</span>
          <span className="envo-page-rule" />
        </motion.div>

        {/* front pocket */}
        <div className="envo-front" />

        {/* the flap, hinged on its top edge */}
        <motion.div
          className="envo-flap"
          style={{ z: 6 }}
          animate={open ? { rotateX: -173 } : { rotateX: 0 }}
          transition={{ duration: 1.0, delay: open ? 0.3 : 0, ease: EASE }}
        />

        {/* static wrapper owns the depth; the inner element owns the motion */}
        <div className="envo-seal">
          <motion.div
            className="envo-seal-inner"
            animate={
              open
                ? { y: -30, x: 20, rotate: -38, opacity: 0, scale: 0.86 }
                : { y: 0, x: 0, rotate: 0, opacity: 1, scale: 1 }
            }
            transition={{ duration: 0.66, ease: [0.7, 0, 0.3, 1] }}
          >
            <WaxSeal />
          </motion.div>
        </div>
      </motion.div>

      <motion.p
        className="envo-hint"
        animate={open ? { opacity: 0, y: 6 } : { opacity: [0.4, 0.9, 0.4] }}
        transition={open ? { duration: 0.3 } : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {hint}
      </motion.p>
    </div>
  )
}
