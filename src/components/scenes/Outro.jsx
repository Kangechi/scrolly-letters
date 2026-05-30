export default function Outro({data}) {
    return(
        <div className="scene-card">
            <h2 className="scene-label">{data.sub}</h2>
            <p className="scene-text">{data.line}</p>
            
        </div>
    )
}