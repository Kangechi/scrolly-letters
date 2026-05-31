

import { useState, useEffect, useRef } from "react";
import HeroScene from './scenes/HeroScene'
import Message from './scenes/Message'
import Outro from './scenes/Outro'
import MemoryScene from "./scenes/MemoryScene";
import WhoScene from "./scenes/WhoScene";


const SCENE_MAP = {
    hero: HeroScene,
    who: WhoScene,
    message: Message,
    memory: MemoryScene,
    closing: Outro,
}

function Scene({section, emoji}) {
    const ref = useRef(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setVisible(true)
                },
            {threshold: 0.4}
        )
        if (ref.current) observer.observe(ref.current)
            return () => observer.disconnect()
    }, [])
    const Component =  SCENE_MAP[section.type]
    if (!Component) return null

    return (
        <div
        ref={ref}
        className={` scene ${visible ? 'scene--visible' : 'scene--hidden'}`}
        >
            <Component data={section} emoji={emoji}/>

        </div>
    )

}

export default function ScrollPage({card}) {
    return(
    <div className={`card-wrapper theme-${card.theme}`}>
        {card.sections.map((section, i)=> (
            <Scene key={i} section={section} emoji={card.emoji}/>
        ))}

    </div>
    )
}
