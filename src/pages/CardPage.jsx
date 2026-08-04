import { useParams } from "react-router-dom";
import ScrollPage from "../components/ScrollPage"
import AmbientBackground from "../components/AmbientBackground"
import { useState, useEffect } from "react"
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabase'
import { cardData } from '../data/cards_data'


function getBirthdayState(birthdayStr){
    const now = new Date()
    const birthday = new Date(birthdayStr + 'T00:00:00')
    
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const birthDate = new Date(birthday.getFullYear(), birthday.getMonth(), birthday.getDate())

    const diffDays = Math.floor((birthDate - todayDate) / (1000  * 60 * 60 * 24))

    if (diffDays > 0) return {state: 'future', diff: birthday - now}
    if (diffDays === 0) return {state: 'today'}
    return {state: 'past', daysLate: Math.abs(diffDays)}
}

/* The `events` table is snake_case; the scene components and this page read
   camelCase. Same contract mismatch that silently blanked scenes in Unit 3 —
   a wrong key is `undefined`, never an error. Map at the boundary, once. */
function normalizeEvent(row) {
    return {
        ...row,
        kind:         'event',
        eventDate:    row.event_date,
        landingTitle: row.landing_title,
        landingSub:   row.landing_sub,
        ctaLabel:     row.cta_label,
        ticketUrl:    row.ticket_url,
        // accent / accent_2 / bg already match what brandStyle reads.
        // sections is JSONB → already an array.
    }
}

/* What to say when there is no row to show. RLS hides drafts and expired
   events identically to ones that never existed, so the client cannot tell
   them apart on its own — event_status() (a security definer RPC) reports
   the state WITHOUT exposing any content.

   DELIBERATE: that RPC only ever reports 'ended'. An ended event was public
   at some point, so naming it discloses nothing new. A DRAFT has never been
   public, so it returns zero rows — byte-for-byte identical to an id that was
   never used. A host wanting to preview their own draft gets that through the
   `manage_id` secret, not by loosening anything on the public path. */
const NOT_FOUND_NOTICE = {
    missing: { emoji: '🫤', title: 'Card not found',      sub: 'This link doesn’t lead anywhere — check it and try again.' },
    ended:   { emoji: '🕊️', title: 'This event has ended', sub: 'Thanks for the interest — keep an eye out for the next one.' },
}

function Countdown({ card }) {
    const eventDate = card.eventDate || card.birthday
    const [status, setStatus] = useState(() => getBirthdayState(eventDate))

    useEffect(() => {
        if (status.state !== 'future') return
        const timer = setInterval(() => setStatus(getBirthdayState(eventDate)), 1000)
        return () => clearInterval(timer)
    }, [status.state])

    if (status.state === 'past') {
        return (
            <div className="countdown-late">
                <p className="countdown-late-main">{card.lateMessage}</p>
                <p className="countdown-late-sub">{card.lateSub}</p>
            </div>
        )
    }
    if (status.state === 'today') {
        return <p className="countdown-today">🎂 Today is the day!</p>
    }

    const timeLeft = {
        days:    Math.floor(status.diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((status.diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((status.diff / 1000 / 60) % 60),
        seconds: Math.floor((status.diff / 1000) % 60),
        
    }

    return(
        <div className="countdown">
            {['days', 'hours', 'minutes', 'seconds'].map(unit => (
                <div className="countdown-unit" key={unit}>
                    <span className="countdown-num">
                        {String(timeLeft[unit]).padStart(2, '0')}
                    </span>
                    <span className="countdown-label">{unit}</span>
                </div>
            ))}

        </div>
    )
}
export default function CardPage() {
    const {id} = useParams()
    const [card, setCard] = useState(null)
    const [loading, setLoading] = useState(true)
    const [revealed, setRevealed] = useState(false)
    const [reason, setReason] = useState('missing')   // why there's no card

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setCard(null)

        /* Three sources, tried in order. Each step only runs if the one above
           found nothing, so every existing card behaves exactly as before —
           the events lookup is purely a new fallback. */
        async function load() {
            // 1 · the two demo events, bundled in code rather than the DB
            const local = cardData.find(c => c.id === id)
            if (local) return { card: local }

            // 2 · personal cards
            //     maybeSingle(), NOT single(): single() asks PostgREST to
            //     coerce the result to one object, so zero rows is a 406
            //     (PGRST116). Here a miss is an expected outcome we intend to
            //     fall through on, not an error.
            const { data: card } = await supabase
                .from('cards').select('*').eq('id', id).maybeSingle()
            if (card) return { card: { ...card, kind: 'card' } }

            // 3 · self-serve events. RLS already restricts this to
            //     `paid AND now() < paid_until`, so a row coming back here is
            //     live by definition — no extra check needed on the client.
            const { data: ev } = await supabase
                .from('events').select('*').eq('id', id).maybeSingle()
            if (ev) return { card: normalizeEvent(ev) }

            // 4 · nothing visible. Ask the DB to characterise the absence.
            //     Wrapped so this still works before the RPC exists.
            try {
                const { data: status } = await supabase.rpc('event_status', { p_id: id })
                const state = Array.isArray(status) ? status[0]?.state : status?.state
                if (state) return { card: null, reason: state }
            } catch { /* RPC not deployed yet — fall through to generic */ }

            return { card: null, reason: 'missing' }
        }

        load().then(({ card, reason }) => {
            if (cancelled) return
            setCard(card ?? null)
            setReason(reason ?? 'missing')
            setLoading(false)
        })

        return () => { cancelled = true }
    }, [id])

  const CONFETTI_THEMES = {
    hue: ['#c084fc', '#f472b6', '#818cf8', '#fff'],
    warm: ['#f59e0b', '#ea580c', '#fcd34d', '#fff'],  
    blue: ['#7096d1', '#BAD6EB','#334EAC', '#1A2E6C'],
    arsenal: ['#eadfe0','#ef0107', '#023474', '#9C824A'],
    lovely: ['#DB3E8C','#FFAFEB','#8d51a8','#ac8ed7'],
    exec: ['#F4D08F', '#EDE3DD', '#0E2A3F','#BF8843'],
    bubbly: ['#d99201', '#905A01', '#58761B', '#1A3F22'],
    burnt: ['#B28565', '#908786', '#635D5C', '#373231'],
    bold: ['#1A2730', '#45586c', '#f09475', "#6bafda"],
    electric: ['#0090A3', '#87f1ff', '#5fafce', '#1A2730'],
    mctaba: ['#F97316', '#FB923C', '#12314F', '#fff'],
    linkedlocal: ['#E9B824', '#4C86C6', '#0A3A6B', '#fff']

  }
  const brandStyle = card?.accent
  ? { '--accent': card.accent, '--accent-2': card.accent_2, '--bg': card.bg}
  : undefined


  function handleRevealed() {
    setRevealed(true)
    setTimeout(() => {
        confetti({
            particleCount: 120,
            spread: 80,
            origin: {y: 0.6},
            colors: card.accent
                ? [card.accent, card.accent_2, card.bg, '#fff']
                : (CONFETTI_THEMES[card.theme] || CONFETTI_THEMES.hue),
        })
    }, 300)
  }

    if (loading) return <div className="landing"><p className="landing-sub">Loading your card…</p></div>

    if (!card) {
        const notice = NOT_FOUND_NOTICE[reason] || NOT_FOUND_NOTICE.missing
        return (
            <div className="landing">
                <div className="landing-inner">
                    <span className="landing-emoji">{notice.emoji}</span>
                    <h2 className="landing-title">{notice.title}</h2>
                    <p className="landing-sub">{notice.sub}</p>
                </div>
            </div>
        )
    }

    if (!revealed) {
        const isEvent = card.kind === 'event'
        return(
             <div className={`landing ${card.accent ? '' : `theme-${card.theme}`}`} style={brandStyle}>
        <AmbientBackground emoji={card.emoji} />
        <div className="landing-inner">
          <span className="landing-emoji">{card.emoji}</span>
          <h2 className="landing-title">
            {isEvent
              ? (card.landingTitle || 'You’re invited')
              : <>Someone sent you<br/>something special</>}
          </h2>
          <p className="landing-sub">
            {isEvent ? (card.landingSub || '') : 'A message made just for you'}
          </p>
          {
            (card.eventDate || card.birthday) && <Countdown card={card}/>
          }
          <button className="read-me-btn" onClick={handleRevealed}>
            {isEvent ? (card.ctaLabel || 'Open ✨') : 'Read Me ✨'}
          </button>
        </div>
      </div>

        )
    }
    return <ScrollPage card={card}/>
}