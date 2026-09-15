

import { useState, useEffect, useRef } from "react";
import AmbientBackground from './AmbientBackground'
import HeroScene from './scenes/HeroScene'
import Message from './scenes/Message'
import Outro from './scenes/Outro'
import MemoryScene from "./scenes/MemoryScene";
import WhoScene from "./scenes/WhoScene";
import FeedbackScene from "./scenes/FeedbackScene";
import WishlistScene from "./scenes/WishlistScene";
import CardDecor from './CardDecor'
import { resolveArrival } from '../lib/styles'
import { resolveShape, decorClasses, colorStyleOf } from '../lib/design'


export const SCENE_MAP = {
    hero: HeroScene,
    who: WhoScene,
    message: Message,
    memory: MemoryScene,
    closing: Outro,
    feedback: FeedbackScene,
    wishlist: WishlistScene,   // Create Studio, Phase 4 — cards only, never events
}

/* `card` rides along so a scene can ask card-level questions (Outro needs to
   know whether this card was paid up-front). Scenes that don't care ignore it. */
function Scene({section, emoji, card}) {
    const ref = useRef(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setVisible(true)
                },
            /* Was { threshold: 0.4 }: "40% of the scene must be on screen".
               A scene taller than ~2.5 viewports can NEVER reach 40%, so on a
               phone it stayed invisible forever (diagnosed 17 Aug). Looks make
               scenes taller, so this had to be fixed first.
               Now: reveal as soon as ANY part of the scene rises above a line
               30% up from the bottom of the screen — works at any height, and
               for a normal 100vh scene it fires within a few pixels of where
               it used to. The feel is unchanged; only the trap is gone. */
            {threshold: 0, rootMargin: '0px 0px -30% 0px'}
        )
        if (ref.current) observer.observe(ref.current)
            return () => observer.disconnect()
    }, [])
    const Component =  SCENE_MAP[section.type]
    if (!Component) return null

    // Both null for every card without a design → no class, today's scene.
    const arrival = resolveArrival(section.type, card?.style, card?.style_overrides)
    const shape = resolveShape(section.type, card?.design)

    return (
        <div
        ref={ref}
        className={` scene ${visible ? 'scene--visible' : 'scene--hidden'}${arrival ? ' scene--styled' : ''}`}
        >
            {/* `play` = the scene has been seen. Arrivals and shapes wait for
                it, so an effect never finishes before anyone scrolls to it. */}
            <Component data={section} emoji={emoji} card={card} arrival={arrival} shape={shape} play={visible}/>

        </div>
    )

}

export default function ScrollPage({card}) {
    // Events keep their hex colours exactly as before; cards with their own
    // colours go through cleanColors and also get a --card-bg (see design.js).
    const brandStyle = colorStyleOf(card)
    const decor = decorClasses(card.style, card.design)
    return(
    <div
    className={`card-wrapper ${brandStyle ? '' : `theme-${card.theme}`}${decor.className ? ` ${decor.className}` : ''}`}
    style={brandStyle}
    >
        <AmbientBackground emoji={card.emoji} />
        <CardDecor style={card.style} design={card.design} />
        {card.sections.map((section, i)=> (
            <Scene key={i} section={section} emoji={card.emoji} card={card}/>
        ))}

    </div>
    )
}
