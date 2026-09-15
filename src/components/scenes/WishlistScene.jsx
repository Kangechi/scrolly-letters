import { useEffect, useState } from 'react'
import { fetchClaims, claim, unclaim, myClaims } from '../../lib/wishClaims'
import { SAFE_LINK } from '../../lib/wishlistForm'

/* The wishlist scene. Each wish shows one of four states:
     preview  — in the builder/checkout: a static "I'll get this", no calls
     open     — "I'll get this" button
     mine     — "You're getting this ✓ · Undo"   (this browser holds the token)
     taken    — "✓ Someone's got this"            (never WHO)
   The list items reveal with the same scroll-in stagger as the card's lines. */

const COPY = {
  already_claimed: 'Someone just got that one — pick another?',
  locked: 'This list isn’t open yet.',
  not_found: 'This list isn’t available.',
  no_such_item: 'That wish was removed.',
  not_yours: 'Only the person who claimed it can undo it.',
  failed: 'That didn’t go through — try again.',
}

export default function WishlistScene({ data, card, isPreview }) {
  const cardId = card?.id
  const live = !isPreview && Boolean(cardId)

  const [taken, setTaken] = useState([])
  const [mine, setMine] = useState(() => (live ? myClaims(cardId) : []))
  const [busy, setBusy] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!live) return
    let cancelled = false
    fetchClaims(cardId)
      .then((ids) => { if (!cancelled) setTaken(ids) })
      .catch(() => { /* RPC missing or offline: show everything as open */ })
    return () => { cancelled = true }
  }, [live, cardId])

  async function handleClaim(itemId) {
    setBusy(itemId)
    setNotice(null)
    const res = await claim(cardId, itemId)
    if (res.ok) {
      setMine((m) => [...m, itemId])
      setTaken((t) => [...t, itemId])
    } else {
      setNotice(COPY[res.error] || COPY.failed)
      if (res.error === 'already_claimed') setTaken((t) => [...t, itemId])
    }
    setBusy(null)
  }

  async function handleUnclaim(itemId) {
    setBusy(itemId)
    setNotice(null)
    const res = await unclaim(cardId, itemId)
    if (res.ok) {
      setMine((m) => m.filter((x) => x !== itemId))
      setTaken((t) => t.filter((x) => x !== itemId))
    } else {
      setNotice(COPY[res.error] || COPY.failed)
    }
    setBusy(null)
  }

  const items = Array.isArray(data.items) ? data.items : []

  return (
    <div className="scene-card wish-scene">
      <span className="scene-label">{data.label || 'The list'}</span>
      <ul className="wish-list">
        {items.map((item) => {
          const isMine = mine.includes(item.id)
          const isTaken = taken.includes(item.id)
          return (
            <li key={item.id} className={`wish-item${isTaken && !isMine ? ' wish-item--taken' : ''}`}>
              <span className="wish-emoji" aria-hidden="true">{item.emoji || '🎁'}</span>
              <div className="wish-body">
                <span className="wish-name">{item.name}</span>
                {item.price && <span className="wish-price">KES {Number(item.price).toLocaleString()}</span>}
                {item.note && <span className="wish-note">{item.note}</span>}
                {SAFE_LINK.test(item.link || '') && (
                  <a className="wish-link" href={item.link} target="_blank" rel="noopener noreferrer">See it →</a>
                )}
              </div>
              <div className="wish-action">
                {isPreview ? (
                  <span className="wish-btn wish-btn--ghost">I’ll get this</span>
                ) : isMine ? (
                  <>
                    <span className="wish-status">You’re getting this ✓</span>
                    <button type="button" className="wish-undo" onClick={() => handleUnclaim(item.id)} disabled={busy === item.id}>
                      Undo
                    </button>
                  </>
                ) : isTaken ? (
                  <span className="wish-status">✓ Someone’s got this</span>
                ) : (
                  <button type="button" className="wish-btn" onClick={() => handleClaim(item.id)} disabled={busy === item.id}>
                    {busy === item.id ? '…' : 'I’ll get this'}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {notice && <p className="wish-notice" role="status">{notice}</p>}
    </div>
  )
}
