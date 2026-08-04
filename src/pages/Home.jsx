import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import AmbientBackground from '../components/AmbientBackground'

/* ============================================================
   HOME — the scrolly landing (Goal 2)
   Old horizontal-scroll version preserved in Home.horizontal.backup.txt
   Journey: Hero → How it works → Showcase → Occasions & Events → Pricing → CTA
   ============================================================ */

function Hero() {
  const ref = useRef(null)

  // Track how far THIS section has scrolled through the viewport.
  // 'start start' → 'end start' = from "top of hero hits top of screen"
  // to "bottom of hero leaves the top". That range drives the parallax.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  // As you scroll down, the whole hero drifts UP faster than the page
  // (parallax) and fades — so the next section slides in over it.
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -140])
  const fade     = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  return (
    <section ref={ref} className="sl-hero">
      <motion.div className="sl-hero-inner" style={{ y: contentY, opacity: fade }}>
        <span className="sl-hero-kicker">Everyday  gift cards, with a digital twist</span>
        <h1 className="sl-hero-title">Scrolly&nbsp;Letters</h1>
        <p className="sl-hero-sub">
          Say something today through a little card that unfolds, scene by scene,
          as they scroll.
        </p>
        <div className="sl-hero-cta">
          <Link to="/create" className="cta-button">Create a card →</Link>
          <a href="#how" className="cta-button cta-button--ghost">See how it works</a>
        </div>
      </motion.div>

      <a href="#how" className="sl-scroll-cue" aria-label="Scroll down to learn more">
        <span>scroll</span>
        <span className="sl-scroll-cue-arrow">⌄</span>
      </a>
    </section>
  )
}

/* ── SHOWCASE ────────────────────────────────────────────────
   Curated DUMMY occasions — never real users' letters. Teasers are
   generic on purpose: no personal info is ever shown here. ── */
const SHOWCASE = [
  { id: 'birthday',      emoji: '🎂', occasion: 'Birthday',      badge: 'Most loved', teaser: 'A birthday that unfolds one memory at a time.',        scenes: 4, read: '45s read', color: '#c084fc' },
  { id: 'anniversary',   emoji: '💞', occasion: 'Anniversary',   badge: 'Romantic',   teaser: 'Your story, scene by scene, back to the day you met.',   scenes: 5, read: '60s read', color: '#f472b6' },
  { id: 'thankyou',      emoji: '🙏', occasion: 'Thank you',     badge: 'Heartfelt',  teaser: 'Say it properly — a thank-you they can revisit.',        scenes: 3, read: '30s read', color: '#34d399' },
  { id: 'apology',       emoji: '🕊️', occasion: 'Apology',       badge: 'Brave',      teaser: 'The words that are hard to say, given room to land.',     scenes: 3, read: '35s read', color: '#7096d1' },
  { id: 'encouragement', emoji: '☀️', occasion: 'Encouragement', badge: 'Uplifting',  teaser: 'A little sunshine for someone having a hard week.',       scenes: 3, read: '30s read', color: '#f59e0b' },
  { id: 'justbecause',   emoji: '🌸', occasion: 'Just because',  badge: 'Everyday',   teaser: 'No occasion needed — just because you thought of them.',  scenes: 3, read: '30s read', color: '#DB3E8C' },
]

function OccasionCard({ item, index }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],   // whole pass-through of the viewport
  })

  // Alternating depth → cards travel at different speeds = layered parallax.
  const range = index % 2 === 0 ? 55 : 28
  const y = useTransform(scrollYProgress, [0, 1], [range, -range])

  return (
    <motion.article
      ref={ref}
      className="occ-card"
      style={{ y }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="occ-card-head" style={{ '--occ': item.color }}>
        <span className="occ-badge">{item.badge}</span>
        <span className="occ-emoji">{item.emoji}</span>
      </div>
      <div className="occ-card-body">
        <h3 className="occ-title">{item.occasion}</h3>
        <p className="occ-teaser">{item.teaser}</p>
        <div className="occ-meta">
          <span>🎬 {item.scenes} scenes</span>
          <span>⏱ {item.read}</span>
        </div>
        <Link to="/create" className="occ-cta">Create this →</Link>
      </div>
    </motion.article>
  )
}

function Showcase() {
  return (
    <section id="showcase" className="sl-section sl-showcase">
      <span className="sl-section-kicker">See what you can make</span>
      <h2 className="sl-section-title">A card for every kind of moment</h2>
      <p className="sl-section-note">
        Samples, not real letters, every card someone makes stays private to them.
      </p>
      <div className="occ-grid">
        {SHOWCASE.map((item, i) => (
          <OccasionCard key={item.id} item={item} index={i} />
        ))}
      </div>
    </section>
  )
}

/* Small helper: a section header that rises in as it enters view. */
function Reveal({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

/* ── HOW IT WORKS — a real 3-step sequence (numbering is meaningful here) ── */
const STEPS = [
  { n: '01', icon: '✍️', title: 'Write your letter', text: 'Pick an occasion and pour in your words, one scene at a time.' },
  { n: '02', icon: '🎨', title: 'Choose a vibe',     text: 'Give it a theme and mood that fit the person and the moment.' },
  { n: '03', icon: '🔗', title: ' Pay & Share the link',    text: 'Send one link but don\'t forget to pay. They scroll, and your letter unfolds like a little world.' },
]

function HowItWorks() {
  return (
    <section id="how" className="sl-section">
      <Reveal>
        <span className="sl-section-kicker">How it works</span>
        <h2 className="sl-section-title">Three steps to a letter they’ll keep</h2>
      </Reveal>
      <div className="how-grid">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} className="how-step" delay={i * 0.12}>
            <span className="how-step-n">{s.n}</span>
            <span className="how-step-icon">{s.icon}</span>
            <h3 className="how-step-title">{s.title}</h3>
            <p className="how-step-text">{s.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ── OCCASIONS & EVENTS — two audiences: individuals vs organizations ── */
function OccasionsEvents() {
  return (
    <section id="occasions" className="sl-section">
      <Reveal>
        <span className="sl-section-kicker">For you and for events</span>
        <h2 className="sl-section-title">Not just for birthdays</h2>
      </Reveal>
      <div className="split-grid">
        <Reveal className="split-panel">
          <span className="split-emoji">💌</span>
          <h3 className="split-title">Everyday you have something to say</h3>
          <p className="split-text">
            Apologies, thank-yous, encouragement, anniversaries, or just because
            a little card for every moment worth saying something.
          </p>
          <Link to="/create" className="cta-button">Create a card →</Link>
          {/* Internal link into the /occasions content page. A page nothing
              links to is weakly discovered, however good its metadata is. */}
          <Link to="/occasions" className="split-link">See every occasion →</Link>
        </Reveal>
        <Reveal className="split-panel split-panel--event" delay={0.12}>
          <span className="split-emoji">🎉</span>
          <h3 className="split-title">Events &amp; organizations</h3>
          <p className="split-text">
            Send beautiful invites and collect warm feedback from your guests 
            scrolly letters, built for your event.
          </p>
          <Link to="/event" className="cta-button cta-button--ghost">Explore events →</Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ── PRICING — Goal 5: KES 50 per card. Customized priced higher (TBD). ── */
function Pricing() {
  return (
    <section id="pricing" className="sl-section">
      <Reveal>
        <span className="sl-section-kicker">Pricing</span>
        <h2 className="sl-section-title">One flat price. No surprises. Unless your doing more </h2>
      </Reveal>
      <div className="price-grid">
        <Reveal className="price-card">
          <span className="price-tag">Standard</span>
          <p className="price-amount">KES 50<span>/ card</span></p>
          <ul className="price-list">
            <li>A full scrolly letter</li>
            <li>Any occasion &amp; theme</li>
            <li>One shareable link</li>
          </ul>
          <Link to="/create" className="cta-button">Make one now →</Link>
        </Reveal>
        <Reveal className="price-card">
          <span className="price-tag">For Events</span>
          <p className="price-amount">KES 500 monthly <span>/ card</span></p>
          <ul className="price-list">
            <li>Integration to your platform</li>
            <li>Invites, Tickets, Feedback</li>
            <li>shareable to every attendee </li>
          </ul>
          <Link to="/create" className="cta-button">Make one now →</Link>
        </Reveal>
        <Reveal className="price-card price-card--premium" delay={0.12}>
          <span className="price-tag">Customized</span>
          <p className="price-amount">Coming soon</p>
          <ul className="price-list">
            <li>Premium backdrops &amp; scenes</li>
            <li>Made-to-order touches</li>
            <li>Priced a little higher</li>
          </ul>
          <Link to="/customize" className="cta-button cta-button--ghost">Peek at customize →</Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ── FINAL CTA + FOOTER ── */
function FinalCta() {
  return (
    <section id="start" className="sl-section sl-final">
      <Reveal>
        <span className="sl-section-kicker">Ready?</span>
        <h2 className="sl-section-title sl-final-title">Make someone’s day today</h2>
        <p className="sl-section-note">It takes a few minutes and costs KES 50.</p>
        <div className="sl-hero-cta">
          <Link to="/create" className="cta-button">Create your card →</Link>
          <Link to="/customize" className="cta-button cta-button--ghost">Customize one</Link>
        </div>
      </Reveal>
      <footer className="sl-footer">
        <span className="sl-footer-mark">Scrolly Letters</span>
        <nav className="sl-footer-links">
          <Link to="/create">Create</Link>
          <Link to="/event">Events</Link>
          <Link to="/customize">Customize</Link>
        </nav>
        <span className="sl-footer-fine">Cards for every day · Made with 💜</span>
      </footer>
    </section>
  )
}

export default function Home() {
  return (
    <div className="sl-landing">
      {/* Reused interaction engine; repainted for light paper via CSS. */}
      <AmbientBackground emoji="💌" />

      <Hero />
      <HowItWorks />
      <Showcase />
      <OccasionsEvents />
      <Pricing />
      <FinalCta />
    </div>
  )
}
