import { NavLink, useLocation } from 'react-router-dom'

/* The four shop destinations. Order = importance, left to right.
   Icon is what you always see; label is revealed on hover (and shown
   when the item is the current page). */
const NAV_ITEMS = [
  { to: '/',          icon: '🏠', label: 'Home', end: true },
  { to: '/create',    icon: '✏️', label: 'Create' },
  { to: '/event',     icon: '🎉', label: 'Event' },
  { to: '/customize', icon: '🎨', label: 'Customize' },
]

export default function BubbleNav() {
  const { pathname } = useLocation()

  // Someone opening a card should see the gift, not the shop menu.
  if (pathname.startsWith('/card')) return null

  return (
    <nav className="bubble-nav" aria-label="Primary">
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bubble${isActive ? ' bubble--active' : ''}`}
        >
          <span className="bubble-icon" aria-hidden="true">{item.icon}</span>
          <span className="bubble-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
