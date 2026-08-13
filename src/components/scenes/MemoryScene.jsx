import { splitLines } from '../../lib/splitLines'

export default function MemoryScene({data, emoji}) {
    const lines = splitLines(data.text)

    return(
        <div className="scene-card scene-card--sticky">
            <div className="sticky-emoji-wrap">
                <span className="scene-emoji">{emoji}</span>
            </div>
            <div className="sticky-copy">
                <span className="scene-label">{data.label}</span>
                <div className="lines">
                    {lines.map((line, i) => (
                        <span className="line" key={i}>{line}</span>
                    ))}
                </div>
            </div>
        </div>
    )
}