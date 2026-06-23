/* import { useState } from "react"
import { cardData } from "../data/cards_data"
import { Navigate, useParams } from "react-router-dom"

const [seeCard, setSeeCard] = useState(false)

function seeCard(){
    setSeeCard(true)
    const {id} = useParams()
    const card = cardData.find(c => c.id === id)
    const navigate = Navigate()

    if (setSeeCard) navigate={'/card/:id'}

}
function Card({emoji, recipient}) {
    {cardData.map(() => {
        return(
            <div className="scene-card">
                <h1 className="scene-sub">Preview this card</h1>
                <div className="scene-wrapper">
                    <div className="scene-emoji">{emoji}</div>
                </div>
                <div className="scene-wrapper">
                    <div className="scene-text">
                        {recipient}
                    </div>
                </div>
                <button className="cta-button" onClick={seeCard}> View Card</button>

            </div>
        )
    })}
}

export default function Home({card}) {
    return(
        <div className="scene-card">
            <Card emoji={emoji} recipient={recipient}/>            
        </div>
    )
} 
    
This code was wrong, and I messed up on very many issues that I've learned. One of the key areas that was wrong: I didn't need to use state or use params. I could easily route using link imported from React router dom.

Then looping, I did the wrong looping as well. I didn't loop the way it was supposed to.

I've also learned that hooks can only be used in components, not in functions, and components are the ones that you actually export. 
*/




 /* const WORDS = [
        {
            id: 1, heading: 'Welcome to Everday Gift Cards',
            id: 2, sub_head: 'Though this letters have a scrolly groove',
            id:3, sub: 'These are scrolly letters',
            id:4, mess_2: 'Who said cards are only for special occasions? Cards are for everyday you want to tell someone something special or ordinary.',
            id:5, mess_1: 'Is it a birthday, an anniversary, a bad day, an encouragement or even an apology',
            id:6, cta: 'Want to make you on scrolly letter, get Started!'

        }
    ] 
    
    This is the wrong approach - I needed to create the structure closer to the data_structure I did..... for cards_data

    The question to ask was, "What is this section displaying?" 
    So everything being displayed has to land on home because that is what is being exported to app.jsx. 
    So the landing panel will just be a child component, but it won't render what you want, the same two cards.
     That is why you need the two components, and you won't transfer any of the parts that should be rendered to any
      other place than the parent component. 
    */




   /*  const WORDS = [
        { id: 1, type: 'heading', text: 'Everyday Gift Cards' },
        { id: 2, type: 'sub',     text: 'These are scrolly letters — for every moment worth saying something' },
        { id: 3, type: 'message', text: 'Who said cards are only for special occasions? Cards are for every day you want to tell someone something special.' },
        { id: 4, type: 'message', text: 'A birthday, an anniversary, a bad day, an encouragement — or even an apology.' },
        { id: 5, type: 'cta',     text: 'Want to make your own scrolly letter?' },
    ]

    function LandingPanel({item}) {
        return (
            <div className="land-panel">
                {item.type === 'heading' && (
                    <h1 className="scene-headline">{item.text}</h1>
                )}
                {item.type === 'sub' && (
                    <p className="scene-sub">{item.text}</p>
                )}
                {item.type === 'message' && (
                    <p className="scene-text">{item.text}</p>
                )}
                {item.type === 'cta' && (
                    <div>
                        <p className="scene-text">{item.text}</p>
                        <Link to="/create">
                        <button className="cta-button"> Get Statred → </button>
                        </Link>
                    </div>
                )}
            </div>
        )
    }




//Card is purely a component
function Card({card}) {
    const [hero, setHero] = useState(false)
    return (

        <div className="scene-card">
            <span className="scene-emoji">{card.emoji}</span>
            <p className="home-text">{card.recipient}</p>
            <Link to={`/card/${card.id}`}>
            <button className="cta-btton"> View Card</button>
            </Link>
        </div>
    )

}

// It's in the Home function, which we export, that now maps over the card. We have a template: the card, the container. It has the emoji, the recipient; it has everything that we need. Then we loop over in the final section. 

export default function Home({}) {

    return (
       
        <div className="home-wrapper">
            <section className="land-cont">
                {WORDS.map((item) => (
                    <LandingPanel key={item.id} item={item}/>
                      ))}
                      </section>

                      <section className="card-section">
                        <h2 className="scene-sub" style={{textAlign: 'center', marginBottom: '2rem'}}>
                            Browse Cards
                        </h2>
                        <div className="home-grid">
                            {cardData.map((card) => (
                                <Card key={card.id} card={card}/>
                            ))}
                        </div>

                      </section>
        </div>
        
    )



}
    
So once again, I commented everything out and started all over. This is because it was not giving me the type of platform I wanted. It's a state thing. Once the horizontal scroll is done, we move to the next state, which now shows the card rather than it being different sections, because that ruins the whole user experience. 
With this new design, everything works out the way the user should map in. 

*/


import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabase"

/* const PANELS = [
    {
        id: 1,
        heading: 'Welcome to Everday Gift Cards',
        sub: 'Cards for each day... not just birthdays'
    },
    {
        id: 2,
        heading: 'These cards are Scrolly letters',
        sub: 'What\'s that anyway? It\'s a card that tell a story by scroll'
    },
    {
        id: 3,
        heading: 'Every moment and each day matters',
        sub: 'A bad day. An encouragement. A thank you note. Congratulations - even an apology.'
    },
    {
        id: 4,
        heading: 'Are you Ready',
        sub: 'Check out the cards below, create your own and send the person you love something they won\'t forget',
        isCta: true
    },
] */

const PANELS = [
    {
        id: 1,
        heading: 'Cards.. 💌✉️',
        sub: 'Perhaps the most convinent gift that we give to our loved ones 🥰💝'
    },
    {
        id: 2,
        heading: 'But who said they are for special days?🤔',
        sub: 'I think Cards are for everyday....'
    },
    {
        id: 3,
        heading: 'So why not send them something....',
        sub: 'A reminder, apology, appreciation, birthday note, date invitation'
    },
    {
        id: 4,
        heading: 'Wanna try? Reach out to someone special.',
        sub: 'Well then.... start here 😁',
        isCta: true
    }
]

function Panel({panel, onReveal, isActive, index, total}) {
    return (
        <div className={`land-panel ${isActive ? 'land-panel--active' : ''}`}>
            <h1 className="home-text">
                {panel.heading}
            </h1>
            <p className="home-sub">{panel.sub}</p>
            {!panel.isCta && (
               <span style={{ fontSize: '1rem', opacity: 0.6 }}>scroll → </span>
            )}
            {panel.isCta && (
        <button className="cta-button" onClick={onReveal}>
          I'm ready ✨
        </button>
      )}
    </div>
    )
}

function Card({card}) {
    return (
        <div className="scene-card">
         <span className="scene-emoji">{card.emoji}</span>
         <p className="scene-sub">{card.recipient}</p>
         <Link to={`/card/${card.id}`}>
         <button className="cta-button">View Card →</button>
         </Link>

        </div>
    )
}

export default function Home() {
    const [showCards, setShowCards] = useState(false)
    const [cards, setCards] = useState([])
    const [loading, setLoading] = useState(true)
    const [activePanel, setActivePanel] = useState(0)
    const landRef = useRef(null)

    useEffect(() => {
        supabase
            .from('cards')
            .select('*')
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (!error) setCards(data)
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        const el = landRef.current
        if (!el) return
        function handleScroll() {
            const index = Math.round(el.scrollLeft / el.offsetWidth)
            setActivePanel(index)
        }
        el.addEventListener('scroll', handleScroll, {passive: true})
        return () => el.removeEventListener('scroll', handleScroll)
    }, [])

    function handleReveal() {
        setShowCards(true)
        setTimeout(() => {
            document.getElementById('cards-grid')?.scrollIntoView({
                behavior: 'smooth'
            })
        }, 100)
    }

    return (
        <div className="home-wrapper">
            <section  ref={landRef} className="land-cont">
                {PANELS.map((panel, i) => (
                    <Panel key={panel.id} panel={panel} onReveal={handleReveal}
                    isActive={activePanel === i} index={i} total={PANELS.length}
                    />
                ))}
            </section>
             <div className="panel-dots">
                    {PANELS.map((_, i) => (
                        <span
                        key={i} className={`panel-dot ${activePanel === i ? 'panel-dot--active' : ''}`}/>
                    ))}

                </div>

            {showCards && (
                <section id="cards-grid" className="cards-section cards-section--reveal">
                    <div className="home-grid">
                        {loading && <p className="home-sub">Loading cards…</p>}
                        {!loading && cards.length === 0 && (
                            <p className="home-sub">No cards yet — be the first to create one ✨</p>
                        )}
                        {cards.map((card) => (
                            <Card key={card.id} card={card}/>
                        ))}

                    </div>
                    <Link to={`/create`} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <button className="cta-button" style={{display: "flex", alignItems: 'center'}}>Create your card</button>
                    </Link>
                </section>

            )}

        </div>
    )
}