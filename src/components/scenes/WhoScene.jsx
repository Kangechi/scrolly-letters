export default function WhoScene({ data}) {
    return (
        <div className="scene-card">
            <span className="scene-label">✦ {data.headline} </span>
            <p className="scene-text">{data.text}</p>

        </div>
    )
}