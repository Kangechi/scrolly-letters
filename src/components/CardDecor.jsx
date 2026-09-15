import { decorClasses } from '../lib/design'

/* The decor layer every card wrapper renders: the backdrop (a real element,
   because ::before is the grain and ::after is the watermark) and the
   stickers. A plain card renders nothing here at all.

   Stickers sit in fixed spots down the SIDES of the card, never over the
   words. Each has an inline `rotate` (its tilt) and a CSS animation on
   `translate` (its float). Those are two separate properties, so the float
   can't wipe the tilt — the same independence the torn note relies on. */

const SPOTS = [
  { top: '6%',  left: '5%',  r: -12 },
  { top: '24%', right: '6%', r: 10 },
  { top: '45%', left: '4%',  r: 8 },
  { top: '64%', right: '5%', r: -9 },
  { top: '85%', left: '7%',  r: 12 },
]

export default function CardDecor({ style, design }) {
  const { layered, stickers } = decorClasses(style, design)
  if (!layered) return null

  return (
    <>
      <div className="look-layer" aria-hidden="true" />
      {stickers.map((s, i) => {
        const spot = SPOTS[i % SPOTS.length]
        return (
          <span
            key={`${s}-${i}`}
            className="card-sticker"
            aria-hidden="true"
            style={{
              top: spot.top,
              left: spot.left,
              right: spot.right,
              rotate: `${spot.r}deg`,
              animationDelay: `${-i * 1.3}s`,
            }}
          >
            {s}
          </span>
        )
      })}
    </>
  )
}
