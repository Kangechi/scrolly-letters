import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import ArrivalLines from '../arrivals/ArrivalLines'

/* Layout + motion, kept apart:
     LAYOUT  — the emoji, one headline word per line, the sub. Owned here.
     ARRIVAL — how the headline words come in. Owned by `arrival` (a look's
               choice or a per-scene pick). null = today's CSS stagger.
   The emoji parallax is scroll mechanics and is never touched by a look. */
export default function HeroScene({data, emoji, arrival = null, play = true}) {
    const ref = useRef(null)

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    })

    const emojiY = useTransform(scrollYProgress, [0, 1], [80, -80])

    return (
        <div ref={ref} className="scene-card" style={{textAlign: 'center'}}>
            <motion.span className="scene-emoji" style={{ y: emojiY }}>
                {emoji}
            </motion.span>
            <h1 className="scene-headline stacked">
                <ArrivalLines
                    fx={arrival}
                    play={play}
                    lines={data.headline.split(' ')}
                    lineClassName="stack-word"
                />
            </h1>
            <p className="scene-sub">{data.sub}</p>
        </div>
    )
}
