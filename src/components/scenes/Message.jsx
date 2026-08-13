import { splitLines } from '../../lib/splitLines'

export default function Message({data}) {

    const lines = splitLines(data.text)

    return(
        <div className="scene-card">
            <span className="scene-label"> {data.sub}</span>
            <div className="lines">
            {lines.map((line, i) => (
                <span className="line" key={i}>{line}</span>
            ))}
            </div>
        </div>
    )
}