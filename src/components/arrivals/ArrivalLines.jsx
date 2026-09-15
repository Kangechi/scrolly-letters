import LetterReveal from './LetterReveal'
import MaskReveal from './MaskReveal'
import InkReveal from './InkReveal'
import Typewriter from './Typewriter'
import Scramble from './Scramble'

/* The registry. Keys MUST match ARRIVAL_META in src/lib/styles.js — that file
   decides which names are legal; this one maps a legal name to a component. */
const ARRIVALS = {
  letterReveal: LetterReveal,
  maskReveal: MaskReveal,
  inkReveal: InkReveal,
  typewriter: Typewriter,
  scramble: Scramble,
}

/* The one place a scene asks "how do my words arrive?"

   fx = null → today's markup, byte for byte:
       <span className="line">…</span> per line
   and the CSS stagger in index.css does the reveal exactly as it always has.

   fx = a name → that arrival renders the same lines with the same class, so
   every scene's typography CSS still applies. The scene wrapper gets
   `scene--styled`, which switches the CSS stagger off so the two never
   double-animate. */
export default function ArrivalLines({ fx, play = true, lines, lineClassName }) {
  const Fx = fx ? ARRIVALS[fx] : null
  if (!Fx) {
    return lines.map((line, i) => (
      <span className={lineClassName} key={i}>{line}</span>
    ))
  }
  return <Fx lines={lines} play={play} lineClassName={lineClassName} />
}
