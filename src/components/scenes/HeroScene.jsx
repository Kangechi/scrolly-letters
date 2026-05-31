export default function HeroScene({data, emoji}) {
    return (
        <div className="scene-card" style={{textAlign: 'center'}}>
            <span className="scene-emoji">{emoji}</span>   {/* ← dynamic now */}
            <h1 className="scene-headline">{data.headline}</h1>
            <p className="scene-sub">{data.sub}</p>
        </div>
    )
}