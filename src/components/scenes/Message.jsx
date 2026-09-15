import { splitLines } from '../../lib/splitLines'
import ArrivalLines from '../arrivals/ArrivalLines'
import LetterSheet from '../shapes/LetterSheet'

export default function Message({data, arrival = null, play = true, shape = null}) {

    const lines = splitLines(data.text)

    // Shape: the message as a folded letter that opens crease by crease.
    if (shape === 'letter') {
        return (
            <div className="scene-card scene-card--bare">
                <LetterSheet label={data.sub} lines={lines} arrival={arrival} play={play} />
            </div>
        )
    }

    return(
        <div className="scene-card">
            <span className="scene-label"> {data.sub}</span>
            <div className="lines">
                <ArrivalLines fx={arrival} play={play} lines={lines} lineClassName="line" />
            </div>
        </div>
    )
}
