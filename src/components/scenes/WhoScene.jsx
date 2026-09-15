import { splitLines } from '../../lib/splitLines'
import ArrivalLines from '../arrivals/ArrivalLines'
import TornNote from '../shapes/TornNote'

export default function WhoScene({ data, arrival = null, play = true, shape = null }) {
    const lines = splitLines(data.text)

    // Shape: a torn strip of ruled paper, handwritten.
    if (shape === 'note') {
        return (
            <div className="scene-card scene-card--bare">
                <TornNote label={data.headline} lines={lines} arrival={arrival} play={play} />
            </div>
        )
    }

    return (
        <div className="scene-card">
            <span className="scene-label">✦ {data.headline}</span>
            <div className="lines">
                <ArrivalLines fx={arrival} play={play} lines={lines} lineClassName="line" />
            </div>
        </div>
    )
}
