import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function FeedbackScene({data}) {
    const eventId = window.location.pathname.split('/').pop()
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [status, setStatus] = useState('idle')

    async function handleSubmit() {
        if (!rating && !comment.trim()) return
        setStatus("submitting")

        const {error} = await supabase
        .from('events_feedback')
        .insert({
            event_id: eventId,
            rating: rating || null,
            comment: comment.trim() || null,
        })

        setStatus(error ? 'error' : "done")
        
    }

    if (status === 'done') {
        return (
            <div className="scene-card">
                <span className="scene-label"> {data.doneLabel || "The team got this" }</span>
                <p className="scene-sub">{data.doneText || "Thank you, your feedback goes back to better the next events"}</p>
                {data.cta && (
                    <a className="cta-button" href={data.cta.href} target="_blank" rel="noreferrer">{data.cta.label}</a>
                )}
            </div>
        )
    }
    return (
        <div className="scene-card">
            <span className="scene-label">{data.label || "Tell the team"}</span>
            <p className="scene-sub">{data.prompt || "How was it? Your feedback goes to the host"}</p>

            <div className="rating-row">
                {[1,2,3,4,5].map((n) => (
                    <button key={n} type="button" className={`rating-star ${n <= rating ? 'rating-star--on' : ''}`} onClick={() => setRating(n)}>★</button>
                ))}
            </div>
            <textarea
            className="create-input"
            rows={4}
            placeholder={data.placeholder || "Share a thought about the event"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            />
            {status === 'error' && (
                <p style={{color: '#f87171', fontSize: '0.85rem'}}>Could not send. Please try again</p>
            )}
            <button className="cta-button" onClick={handleSubmit} disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending' : (data.submitLabel || 'Send to the team')}
            </button>

            {data.cta && (
                 <a className="cta-button cta-button--ghost" href={data.cta.href} target="_blank" rel="noreferrer">
          {data.cta.label}
        </a>
            )}
        </div>
    )

}