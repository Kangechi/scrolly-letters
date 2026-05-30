export default function MemoryScene({data}) {
    return(
        <div className="scene-card">
            <span className="scene-label">{data.label}</span>
            <p className="scene-text"> {data.text}</p>
        </div>
    )
}