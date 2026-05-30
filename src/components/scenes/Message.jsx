export default function Message({data}) {
    return(
        <div className="scene-card">
            <span className="scene-label"> {data.sub}</span>
            <p className="scene-text">{data.text}</p>   
        </div>
    )
}