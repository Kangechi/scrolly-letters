import { Link } from 'react-router-dom'

/* ============================================================
   OCCASIONS — SEO Unit 5 (stage 6: "is there anything worth ranking?").

   Every other public route is nearly text-free, which is fine for people
   and useless for search: Google ranks WORDS. This page is the one place
   with real prose, written around how people actually search rather than
   around what we call things internally.

   Rules it obeys:
   · Zero Supabase calls. Every example here is invented — real letters
     are never shown publicly (HARD RULE).
   · Every claim must be true of the shipped product. No invented
     behaviour, no prices that aren't in the code.
   ============================================================ */

const OCCASIONS = [
  {
    id: 'birthday',
    emoji: '🎂',
    title: 'Birthday cards',
    lead: 'The one everybody needs at least a few times a year.',
    body: `A birthday card that arrives as a link means you can send it the moment you
      remember — from a matatu, from your desk, at 11pm the night before. Add a countdown
      and it changes on the day itself, so opening it early feels like waiting for something
      rather than spoiling it.`,
  },
  {
    id: 'anniversary',
    emoji: '💞',
    title: 'Anniversary letters',
    lead: 'For the ones where a text feels too small.',
    body: `Anniversaries reward specifics — the year you met, the flat with the broken tap,
      the thing they said that you never forgot. A scrolly letter gives each memory its own
      scene, so they arrive one at a time instead of all at once in a paragraph.`,
  },
  {
    id: 'thank-you',
    emoji: '🙏',
    title: 'Thank-you notes',
    lead: 'Say it properly, not in passing.',
    body: `The people who help most are usually thanked the least — a colleague who covered
      for you, a friend who showed up, a parent who kept going. Written down and sent as
      something they can open again later, a thank-you lands differently to one said in a
      corridor.`,
  },
  {
    id: 'apology',
    emoji: '🕊️',
    title: 'Apologies',
    lead: 'Hard to say out loud. Easier to say carefully.',
    body: `An apology works when it's specific and unhurried. Writing it in scenes forces
      you to slow down — what happened, what you understand now, what you're going to do —
      instead of compressing all three into one defensive sentence.`,
  },
  {
    id: 'encouragement',
    emoji: '🌱',
    title: 'Encouragement',
    lead: 'Exams, interviews, first days, hard seasons.',
    body: `Send it the night before, and let them open it in the morning. Encouragement is
      mostly evidence — reminding someone of what they've already survived — and that reads
      better unfolding slowly than as a wall of text.`,
  },
  {
    id: 'just-because',
    emoji: '✨',
    title: 'Just because',
    lead: 'No occasion at all. That is rather the point.',
    body: `The best cards often arrive on an ordinary Tuesday. Nothing to celebrate,
      no reason at all — which is exactly why they get remembered.`,
  },
]

const FAQ = [
  {
    q: 'How much does a card cost?',
    a: 'A card costs KES 50, paid once via M-Pesa. You write and preview the whole thing for free — payment only unlocks the share link.',
  },
  {
    q: 'Does the person receiving it need an app?',
    a: 'No. A scrolly letter is just a web link. It opens in any browser on any phone or laptop, with nothing to download and no account to make.',
  },
  {
    q: 'Can I send it on WhatsApp?',
    a: 'Yes — that is how most cards are sent. You get one link, and you can share it on WhatsApp, copy it anywhere, or send it however you like.',
  },
  {
    q: 'Is my message private?',
    a: 'Yes. Cards are never listed publicly and are explicitly excluded from search engines, so a letter is only ever seen by someone you send the link to. Examples shown on this site are invented, never real letters.',
  },
]

/* FAQPage structured data. Must mirror the visible Q&As above exactly —
   marking up answers that aren't on the page is a manual-action risk. */
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

/* NOTE — deliberately NOT the framer-motion `Reveal` used on Home.
   That helper starts at `opacity: 0` and waits for an IntersectionObserver
   via whileInView. Measured in a headless render: the observer never fired
   and all 13 blocks stayed at opacity 0 — every word present in the DOM and
   none of it visible.

   Home can afford that; this page cannot. Its whole job is to be READ, by
   people and by crawlers, so the text is visible at rest and the animation
   is a pure CSS enhancement that can only ever add to a legible baseline. */
function Reveal({ children, className = '' }) {
  return <div className={`occ-reveal ${className}`}>{children}</div>
}

export default function Occasions() {
  return (
    <div className="sl-landing occ-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="sl-section occ-page-intro">
        <Reveal>
          <span className="sl-section-kicker">Every occasion</span>
          <h1 className="sl-section-title">What to send, and when</h1>
          <p className="sl-section-note">
            A scrolly letter is a card you send as a link — it unfolds scene by scene as the
            person scrolls, instead of arriving all at once. Here is what people use them for,
            and why each one reads better slowly.
          </p>
        </Reveal>
      </section>

      <section className="sl-section">
        <div className="occ-page-list">
          {OCCASIONS.map((o) => (
            <Reveal key={o.id} className="occ-page-item">
              <span className="occ-page-emoji">{o.emoji}</span>
              <div className="occ-page-copy">
                <h2 className="occ-page-title">{o.title}</h2>
                <p className="occ-page-lead">{o.lead}</p>
                <p className="occ-page-body">{o.body}</p>
                <Link to="/create" className="occ-page-link">Write one →</Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sl-section">
        <Reveal>
          <span className="sl-section-kicker">Questions</span>
          <h2 className="sl-section-title">The things people ask first</h2>
        </Reveal>
        <div className="occ-faq">
          {FAQ.map((item) => (
            <Reveal key={item.q} className="occ-faq-item">
              <h3 className="occ-faq-q">{item.q}</h3>
              <p className="occ-faq-a">{item.a}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sl-section sl-final">
        <Reveal>
          <h2 className="sl-section-title sl-final-title">Pick a moment, write the letter</h2>
          <p className="sl-section-note">It takes a few minutes and costs KES 50.</p>
          <div className="sl-hero-cta">
            <Link to="/create" className="cta-button">Create your card →</Link>
            <Link to="/event" className="cta-button cta-button--ghost">Hosting an event?</Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
