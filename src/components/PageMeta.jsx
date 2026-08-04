import { useLocation } from 'react-router-dom'

/* ============================================================
   PAGE META — per-route <title>, description and canonical.

   React 19 hoists <title>/<meta>/<link> rendered anywhere in the
   tree into <head>, so this is just a component that returns JSX —
   no useEffect, no document.head poking, no react-helmet.

   Rendered ONCE inside <BrowserRouter> (App.jsx), exactly like
   BubbleNav: reads useLocation, behaves per route.

   NOTE the split of responsibilities with index.html:
     · og:* / twitter:*  → STATIC in index.html. Social crawlers do
       not run JS, so React can never reach them.
     · title/description/canonical → HERE. Their only audience is
       search engines, which do render JS, and they must differ
       per route — which a single static file cannot do.
   ============================================================ */

const SITE = 'https://scrolly-letters.vercel.app'

/* Route → metadata. This is an ALLOWLIST: only the routes listed
   here are treated as public. Anything else falls through to PRIVATE
   below, so a route added later is private until someone deliberately
   publishes it. */
const PAGE_META = {
  '/': {
    title: 'Scrolly Letters — animated cards you send as a link',
    description:
      'Write a message, pick an occasion, and send a card that unfolds as they scroll. Made in a minute, opened anywhere.',
  },
  '/create': {
    title: 'Create a card · Scrolly Letters',
    description:
      'Write your message, choose an occasion and theme, and watch it come together in a live preview before you send.',
  },
  '/event': {
    title: 'Event invites for organisations · Scrolly Letters',
    description:
      'Turn your next event into a scrolly invite — expectations, details, tickets and a private feedback channel back to you.',
  },
  '/customize': {
    title: 'Customize your card · Scrolly Letters',
    description:
      'Go beyond the templates — pick your own backdrop, colours and scenes to build a card that looks like nobody else’s.',
  },
  '/occasions': {
    title: 'Birthday, thank-you and anniversary cards you send as a link · Scrolly Letters',
    description:
      'What to send and when — birthday cards, anniversary letters, thank-yous, apologies and encouragement, sent as a link that unfolds as they scroll. KES 50, no app needed.',
  },
}

/* Card pages. Deliberately generic: the title must NEVER contain the
   letter's content, which would leak it into the browser tab, session
   history and any analytics that logs page titles. */
const PRIVATE = {
  title: 'A Scrolly Letter ✦',
  description: 'A personal message, made for one person.',
}

export default function PageMeta() {
  const { pathname } = useLocation()

  // '/create/' and '/create' are the same page — normalise before lookup.
  const key = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/'
  const page = PAGE_META[key]
  const meta = page || PRIVATE

  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {/* Canonical points at the NORMALISED key, so /create/?ref=whatsapp
          still resolves to /create. Public routes only — declaring a
          canonical on a page we've told Google to ignore is contradictory. */}
      {page && <link rel="canonical" href={`${SITE}${key}`} />}
    </>
  )
}
