import { splitLines } from '../../lib/splitLines'
import ArrivalLines from '../arrivals/ArrivalLines'
import Polaroid from '../shapes/Polaroid'

export default function MemoryScene({data, emoji, arrival = null, play = true, shape = null}) {
    const lines = splitLines(data.text)

    // Shape: the memory as a taped polaroid, the text as its caption.
    if (shape === 'polaroid') {
        return (
            <div className="scene-card scene-card--bare">
                <Polaroid label={data.label} text={data.text} emoji={emoji} play={play} />
            </div>
        )
    }

    return(
        <div className="scene-card scene-card--sticky">
            <div className="sticky-emoji-wrap">
                <span className="scene-emoji">{emoji}</span>
            </div>
            <div className="sticky-copy">
                <span className="scene-label">{data.label}</span>
                <div className="lines">
                    <ArrivalLines fx={arrival} play={play} lines={lines} lineClassName="line" />
                </div>
            </div>
        </div>
    )
}
