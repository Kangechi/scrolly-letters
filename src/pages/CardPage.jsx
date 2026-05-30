import { useParams } from "react-router-dom";
import {cardData} from '../data/cards_data'
import ScrollPage from "../components/ScrollPage"
import { useState, useEffect } from "react"
import confetti from 'canvas-confetti'

const BIRTHDAY = new Date('2026-06-01T00:00:00')

function Countdown() {
    const [timeLeft, setTimeLeft] = useState(getTimeLeft())

    function getTimeLeft() {
        const diff = BIRTHDAY - new Date()
        if (diff <= 0) return null
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60  )) & 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60),
        }
    }

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
        return () => clearInterval(timer) 
    }, [])

    if (!timeLeft) return(
        <p className="countdown-today">🎂 Today is the day!</p>
    )
    return(
        <div className="countdown">
            {['days', 'hours', 'minutes', 'seconds'].map(unit => (
                <div className="countdown-unit" key={unit}>
                      <span className="countdown-num">{String(timeLeft[unit]).padStart(2,'0')}</span>
                      <span className="countdown-label">{unit}</span>

                </div>
            ))}

        </div>
    )
}

export default function CardPage() {
    const {id} = useParams()
    const card = cardData.find(c => c.id === id)
    const [revealed, setRevealed] = useState(false)
     // ADD THIS LINE:
  console.log("id from URL:", id)
  console.log("card found:", card)
  function handleRevealed() {
    setRevealed(true)
    setTimeout(() => {
        confetti({
            particleCount: 120,
            spread: 80,
            origin: {y: 0.6},
            colors: ['#c084fc', '#f472b6', '#818cf8', '#fff']
        })
    }, 300)
  }

    if (!card) return <div>Card not Found 🫤</div>

    if (!revealed) {
        return(
             <div className={`landing theme-${card.theme}`}>
        <div className="landing-inner">
          <span className="landing-emoji">{card.emoji}</span>
          <h2 className="landing-title">Someone sent you<br/>something special</h2>
          <p className="landing-sub">A message made just for you</p>
          <Countdown />
          <button className="read-me-btn" onClick={handleRevealed}>
            Read Me ✨
          </button>
        </div>
      </div>

        )
    }
    return <ScrollPage card={card}/>
}