import { useState } from 'react'
import AmbientBackground from './AmbientBackground'
import EnvelopeOpening from './EnvelopeOpening'

/* The studio's preview of the OPENING — what the recipient sees before the
   card. Same .landing styles the real card page uses, sized to the phone
   frame. The parent bumps `key` to replay it. */

export default function OpeningPreview({ opening, theme, colorStyle, emoji, recipient }) {
  const [opened, setOpened] = useState(false)

  return (
    <div className={`landing st-opening ${colorStyle ? '' : `theme-${theme}`}`} style={colorStyle}>
      <AmbientBackground emoji={emoji} />
      <div className="landing-inner">
        {opened ? (
          <>
            <span className="landing-emoji">✨</span>
            <h2 className="landing-title">…and the card begins</h2>
            <p className="landing-sub">They scroll from here.</p>
            <button type="button" className="read-me-btn" onClick={() => setOpened(false)}>↻ Watch again</button>
          </>
        ) : opening === 'envelope' ? (
          <EnvelopeOpening addressedTo={`For ${recipient || 'you'}`} onOpened={() => setOpened(true)} />
        ) : (
          <>
            <span className="landing-emoji">{emoji}</span>
            <h2 className="landing-title">Someone sent you<br />something special</h2>
            <p className="landing-sub">A message made just for you</p>
            <button type="button" className="read-me-btn" onClick={() => setOpened(true)}>Read Me ✨</button>
          </>
        )}
      </div>
    </div>
  )
}
