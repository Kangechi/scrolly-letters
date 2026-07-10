export default function WhoScene({ data }) {
    const lines = data.text.split(/(?<=[.!?])\s+/)

    return (
        <div className="scene-card">
            <span className="scene-label">✦ {data.headline}</span>
            <div className="lines">
                {lines.map((line, i) => (
                    <span className="line" key={i}>{line}</span>
                ))}
            </div>
        </div>
    )
}