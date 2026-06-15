import { useParams } from "react-router-dom";
import ScrollPage from "../components/ScrollPage"
import AmbientBackground from "../components/AmbientBackground"
import { useState, useEffect } from "react"
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabase'


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

function Countdown({ card }) {
    const [status, setStatus] = useState(() => getBirthdayState(card.birthday))
    
    useEffect(() => {
        if (status.state !== 'future') return
        const timer = setInterval(() => setStatus(getBirthdayState(card.birthday)), 1000)
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

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setCard(null)

        supabase
            .from('cards')
            .select('*')
            .eq('id', id)
            .single()
            .then(({ data, error }) => {
                if (cancelled) return
                setCard(error ? null : data)
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
    bubbly: ['#d99201', '#905A01', '#58761B', '#1A3F22']

  }


  function handleRevealed() {
    setRevealed(true)
    setTimeout(() => {
        confetti({
            particleCount: 120,
            spread: 80,
            origin: {y: 0.6},
            colors: CONFETTI_THEMES[card.theme] || CONFETTI_THEMES.hue,
        })
    }, 300)
  }

    if (loading) return <div className="landing"><p className="landing-sub">Loading your card…</p></div>
    if (!card) return <div className="landing"><p className="landing-sub">Card not Found 🫤</p></div>

    if (!revealed) {
        return(
             <div className={`landing theme-${card.theme}`}>
        <AmbientBackground emoji={card.emoji} />
        <div className="landing-inner">
          <span className="landing-emoji">{card.emoji}</span>
          <h2 className="landing-title">Someone sent you<br/>something special</h2>
          <p className="landing-sub">A message made just for you</p>
          {
            card.birthday && <Countdown card={card}/>
          }
          <button className="read-me-btn" onClick={handleRevealed}>
            Read Me ✨
          </button>
        </div>
      </div>

        )
    }
    return <ScrollPage card={card}/>
}