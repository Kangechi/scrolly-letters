/* ============================================================
   CARD FORM — the one definition of what a personal card's form holds and
   how it becomes `sections[]`. Shared by /create (quick card) and
   /customize (the studio), so the two can never build a card differently.

   Extracted verbatim from Create.jsx (15 Sep) — behaviour unchanged.
   ============================================================ */

export const OCCASIONS = ['Happy Father\'s Day', 'Birthday', 'Anniversary', 'Thank You', 'Encouragement', 'Apology', 'Just Because']
export const THEMES = ['hue', 'mint', 'warm', 'lovely', 'exec', 'arsenal', 'bubbly', 'blue', 'bold', 'electric', 'burnt']
export const EMOJIS = ['🎉', '💌', '🌸', '✨', '🎂', '☀️', '🥹', '🎈', '👨🏽‍🍼', '🥸', '🧔🏽', '👨🏽', '👔', '👑']

export const initialState = {
  occasion: OCCASIONS[0],
  recipient: '',
  emoji: EMOJIS[0],
  theme: THEMES[0],
  heroSub: '',
  whoText: '',
  message: '',
  memoryText: '',
  closing: '',
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

/** The flat form → the scene list a card stores. Optional scenes (who,
    memory) are dropped when blank, so a card never shows an empty scene. */
export function buildSections(state) {
  return [
    {
      type: 'hero',
      headline: `A ${state.occasion.toLowerCase()} note for ${state.recipient || 'you'}`,
      sub: state.heroSub,
    },
    state.whoText && {
      type: 'who',
      headline: 'How I see you',
      text: state.whoText,
    },
    {
      type: 'message',
      sub: state.occasion,
      text: state.message,
    },
    state.memoryText && {
      type: 'memory',
      label: 'A moment I carry',
      text: state.memoryText,
    },
    {
      type: 'closing',
      sub: 'With love',
      text: state.recipient,
      line: state.closing,
    },
  ].filter(Boolean)
}
