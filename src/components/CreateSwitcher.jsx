import { NavLink } from 'react-router-dom'

/* The create section's three services, one row (Create Studio, Phase 5).
   Shown at the top of /create, /customize and /wishlist so they read as one
   product with three doors — and it says where scheduling lives, since that
   is a checkout option for all three rather than a service of its own. */

const SERVICES = [
  { to: '/create', label: 'Quick card', icon: '✏️' },
  { to: '/customize', label: 'Custom card', icon: '✦' },
  { to: '/wishlist', label: 'Wishlist', icon: '🎁' },
]

export default function CreateSwitcher({ tone = 'light' }) {
  return (
    <nav className={`create-switcher create-switcher--${tone}`} aria-label="What would you like to make?">
      <div className="create-switcher-row">
        {SERVICES.map((s) => (
          <NavLink
            key={s.to}
            to={s.to}
            className={({ isActive }) => `create-switcher-link${isActive ? ' is-on' : ''}`}
          >
            <span aria-hidden="true">{s.icon}</span> {s.label}
          </NavLink>
        ))}
      </div>
      <p className="create-switcher-hint">📅 Any of them can be scheduled at checkout.</p>
    </nav>
  )
}
