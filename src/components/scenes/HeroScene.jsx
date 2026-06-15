import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function HeroScene({data, emoji}) {
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
            <h1 className="scene-headline">{data.headline}</h1>
            <p className="scene-sub">{data.sub}</p>
        </div>
    )
}