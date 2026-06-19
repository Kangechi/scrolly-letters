import { useState } from 'react'

export default function Outro({ data, isPreview }) {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp() {
    const message = `Someone made you a scrolly letter 💌\n${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`)
  }

  return (
    <div className="scene-card">
      <h2 className="scene-label">{data.sub}</h2>
      <h5 className="scene-label">{data.text}</h5>
      <p className="scene-text">{data.line}</p>

      {!isPreview && (
        <button className="cta-button" onClick={() => setShowModal(true)}>
          Share this card ✨
        </button>
      )}

      {showModal && (
        <div className="share-backdrop" onClick={() => setShowModal(false)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <button className="share-modal-close" onClick={() => setShowModal(false)}>✕</button>
            <p className="scene-label">Send your card</p>
            <p className="scene-sub" style={{ marginBottom: '1.5rem' }}>
              Choose how you'd like to share it
            </p>
            <button className="cta-button" onClick={handleWhatsApp}>
              Share on WhatsApp 💬
            </button>
            <button className="cta-button cta-button--ghost" onClick={handleCopy}>
              {copied ? 'Copied! ✓' : 'Copy link'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
