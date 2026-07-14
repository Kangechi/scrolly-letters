export const cardData = [
     // ── EVENT 1 · RECAP (passed) ─────────────────────────────
  {
    id: 'event_recap_mctaba',
    kind: 'event',
    theme: 'mctaba',
    emoji: '🤖',
    eventDate: '2026-07-11',                 // past → "you missed it" framing
    host: 'Mctaba',
    lateMessage: 'You missed it 👀',
    lateSub: 'But here’s everything that went down',
    landingTitle: 'Here’s what you missed',
    landingSub: 'Mctaba · AI & Automation Workshop',
    ctaLabel: 'See what went down ✨',
    sections: [
      {
        type: 'hero',
        headline: "What a day you missed",
        sub: "Can\'t believe you missed it though.. too bad",
      },
      {
        type: 'who',
        headline: 'What went down',
        text: /* ✍️ YOU — the highlights: speakers, project showcases, recruiters in the room */ 'Well we had a great lineup of speakers',
      },
      {
        type: 'memory',
        label: 'The moment of the day',
        text: /* ✍️ YOU — the single standout moment */ '',
      },
      {
        type: 'message',
        sub: 'You’re still part of this',
        text: /* ✍️ YOU — the INCLUSION bridge: they missed this one, but the door is open */ '',
      },
      {
        type: 'cta',
        sub: "You can still make it to the next event",
        text: 'Check out Mctaba events for the next one'
      },
      {
        type: 'feedback',
        label: 'Before you go',
        prompt: 'Want in on the next one? Tell the team what would make you show up.',
        cta: { label: 'Be there next time →', href: '#' },   // ← real signup link when you have it
      },
    ],
  },

  // ── EVENT 2 · INVITE (upcoming) ──────────────────────────
  {
    id: 'event_invite_linkedlocal',
    kind: 'event',
    theme: 'linkedlocal',
    emoji: '♟️',
    eventDate: '2026-07-24',                  // future → live countdown
    host: 'LinkedIn Local Nairobi',
    landingTitle: 'You’re invited',
    landingSub: 'LinkedIn Local Nairobi · The Unwritten Rules of Business',
    ctaLabel: 'Why you shouldn’t miss this ✨',
    sections: [
      {
        type: 'hero',
        headline: 'The Unwritten Rules of Business',
        sub: 'The lessons nobody teaches — but every builder eventually learns.',
      },
      {
        type: 'who',
        headline: 'What to expect',
        text: /* ✍️ YOU — what the night delivers, who’s in the room */ '',
      },
      {
        type: 'message',
        sub: 'Why you don’t want to miss this',
        text: /* ✍️ YOU — the anticipation / don’t-miss-it pitch */ '',
      },
      {
        type: 'memory',
        label: 'The details',
        text: '24th July · 5:30PM · Hackhouse, 124 Manyani East Rd · Tickets KES 2,200',
      },
      {
        type: 'feedback',
        label: 'Questions for the host?',
        prompt: 'Anything you want to know before the day?',
        cta: { label: 'Get your ticket →', href: '#' },     // ← real ticket link
      },
    ],
  },

]