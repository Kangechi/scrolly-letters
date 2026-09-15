import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { layout } from './shared'

/* Ported from motion-lab/src/effects/text/Scramble.jsx.
   A "reveal front" sweeps left to right: characters behind it show their real
   letter, characters ahead of it show a random glyph that changes every frame.

   Driven by requestAnimationFrame, and it STOPS once the front passes the
   last character — keep looping and it re-renders 30× a second forever for
   nothing (a note carried over from the lab).

   The glyph picker is (frame * 7 + i * 13) % 36. 13 and 36 share no factor,
   so neighbouring letters get different glyphs — the lab's bug 1 was a hash
   whose multiplier shared a factor with the modulus and gave every letter
   the same result. */

const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const FPS = 30

export default function Scramble({ lines, play, lineClassName }) {
  const reduce = useReducedMotion()
  const { rows, total } = layout(lines)
  const [frame, setFrame] = useState(0)
  // Characters settled per frame, scaled so any length settles in ~2.2s.
  const rate = Math.max(1, total / (2.2 * FPS))
  const lastFrame = Math.ceil(total / rate)

  useEffect(() => {
    if (!play || reduce) return
    let raf = 0
    const start = performance.now()
    const tick = (now) => {
      const f = Math.floor((now - start) / (1000 / FPS))
      setFrame(f)
      if (f <= lastFrame) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [play, reduce, lastFrame])

  const settled = reduce ? total : frame * rate

  return rows.map((row, li) => (
    <span className={lineClassName} key={li}>
      <span className="sr-only">{row.line}</span>
      <span aria-hidden="true">
        {row.words.map((w, wi) => w.space ?? (
          <span key={wi} className="arr-word">
            {w.chars.map(({ ch, i }) => {
              const done = i < settled
              return (
                <span key={i} className={done ? undefined : 'arr-scrambling'}>
                  {done ? ch : POOL[(frame * 7 + i * 13) % POOL.length]}
                </span>
              )
            })}
          </span>
        ))}
      </span>
    </span>
  ))
}
