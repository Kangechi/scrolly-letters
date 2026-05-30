export default function HeroScene({data}) {
    return(
         <div className="scene-card" style={{ textAlign: 'center' }}>
      <span className="scene-emoji">👓</span>
      <h1 className="scene-headline">{data.headline}</h1>
      <p className="scene-sub">{data.sub}</p>
    </div>
    )
}