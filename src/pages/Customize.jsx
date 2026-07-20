import { useState } from 'react'
import { Link } from 'react-router-dom'

/* ============================================================
   CUSTOMIZE (Goal 6) — SCAFFOLD.
   The idea (from LoveCraft's "Scenery Backdrop"): a customer picks a
   premium backdrop/scene for their card. Free backdrops are included;
   premium ones raise the price above the standard KES 50.

   You'll wire the real logic tomorrow — the TODOs mark exactly where.
   ============================================================ */

// Free backdrops are included; premium ones add a surcharge.
const BACKDROPS = [
  { id: 'none',   label: 'None',   premium: false },
  { id: 'sunset', label: 'Sunset', premium: false },
  { id: 'beach',  label: 'Beach',  premium: false },
  { id: 'forest', label: 'Forest', premium: true },
  { id: 'starry', label: 'Starry', premium: true },
]

const BASE_PRICE = 50          // KES — standard card
const PREMIUM_SURCHARGE = 50   // TODO: confirm real surcharge with product (open question)

export default function Customize() {
  const [backdrop, setBackdrop] = useState('none')

  // TODO (tomorrow): derive the live price from the selection.
  //   const selected = BACKDROPS.find(b => b.id === backdrop)
  //   const price = BASE_PRICE + (selected?.premium ? PREMIUM_SURCHARGE : 0)

  return (
    <div className="shop-page" style={{ justifyContent: 'flex-start' }}>
      <span className="shop-page-emoji">🎨</span>
      <h1 className="shop-page-title">Customize</h1>
      <p className="shop-page-sub">
        Choose a backdrop for your card. Premium scenes make it extra special.
      </p>

      {/* ── Backdrop picker (selection works; pricing + preview are TODO) ── */}
      <div className="create-pill-row" style={{ justifyContent: 'center', maxWidth: 520 }}>
        {BACKDROPS.map(b => (
          <button
            key={b.id}
            className={`create-pill ${backdrop === b.id ? 'create-pill--active' : ''}`}
            onClick={() => setBackdrop(b.id)}
          >
            {b.label}{b.premium ? ' ✦' : ''}
          </button>
        ))}
      </div>

      {/* TODO tomorrow:
          1. Show live price (BASE_PRICE + premium surcharge).
          2. Live preview: render the chosen backdrop behind a sample card
             (reuse the card scenes / AmbientBackground).
          3. On confirm, carry backdrop + price into the create/pay flow. */}

      <Link to="/create" className="cta-button">Continue to create →</Link>
    </div>
  )
}
