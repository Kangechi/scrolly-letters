import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { layout } from './shared'

/* Ported from motion-lab/src/effects/text/Typewriter.jsx, minus the
   erase/loop (a letter is typed once).

   Every character is rendered from the first frame — untyped ones are just
   opacity 0. That RESERVES the final layout, so the paragraph never grows
   and pushes the page around while typing (the lab's bug 5: conditionally
   mounting content reflowed the column by 22px). */

export default function Typewriter({ lines, play, lineClassName }) {
  const reduce = useReducedMotion()
  const { rows, total } = layout(lines)
  const [count, setCount] = useState(0)
  // Per-character delay, scaled so any length finishes in ~3.5s.
  const step = Math.max(12, Math.min(40, 3500 / Math.max(total, 1)))

  // One timeout per character. Each tick changes `count`, which re-runs this
  // effect and schedules the next — and the cleanup cancels a pending tick
  // if the scene unmounts mid-sentence.
  useEffect(() => {
    if (!play || reduce || count >= total) return
    const t = setTimeout(() => setCount(count + 1), step)
    return () => clearTimeout(t)
  }, [play, reduce, count, total, step])

  const typed = reduce ? total : count
  const typing = play && typed < total

  return rows.map((row, li) => (
    <span className={lineClassName} key={li}>
      <span className="sr-only">{row.line}</span>
      <span aria-hidden="true">
        {row.words.map((w, wi) => w.space ?? w.chars.map(({ ch, i }) => (
          <span
            key={`${wi}-${i}`}
            className={typing && i === typed - 1 ? 'tw-caret' : undefined}
            style={{ opacity: i < typed ? 1 : 0 }}
          >
            {ch}
          </span>
        )))}
      </span>
    </span>
  ))
}
