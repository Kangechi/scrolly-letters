import { useEffect, useRef } from 'react'

// Particle definitions are generated ONCE (module load), so they don't
// jump around on every re-render — position/size/depth stay stable.
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 2 + Math.random() * 4,          // px
  delay: -Math.random() * 12,           // negative = start mid-animation
  duration: 10 + Math.random() * 12,    // s
  depth: 0.3 + Math.random() * 0.7,     // parallax strength (0..1)
}))

export default function AmbientBackground({ emoji }) {
  const rootRef = useRef(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    // target = where the pointer/tilt wants the light; cur = where it is now.
    // We ease cur → target every frame so the glow GLIDES instead of snapping.
    let targetX = 0.5, targetY = 0.5
    let curX = 0.5, curY = 0.5
    let raf = 0

    const setFromPoint = (x, y) => {
      targetX = x / window.innerWidth
      targetY = y / window.innerHeight
    }
    const onMouse = (e) => setFromPoint(e.clientX, e.clientY)
    const onTouch = (e) => {
      const t = e.touches[0]
      if (t) setFromPoint(t.clientX, t.clientY)
    }
    const onTilt = (e) => {
      if (e.gamma == null) return
      const clamp = (v) => Math.max(-1, Math.min(1, v))
      targetX = 0.5 + clamp(e.gamma / 45) * 0.5          // left/right tilt
      targetY = 0.5 + clamp((e.beta - 45) / 45) * 0.5    // front/back tilt
    }

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      el.style.setProperty('--scroll', p.toFixed(3))
    }

    // iOS 13+ hides device tilt behind a permission prompt that needs a
    // user gesture — request it on the first touch, best-effort.
    const requestTilt = () => {
      const DOE = window.DeviceOrientationEvent
      if (DOE && typeof DOE.requestPermission === 'function') {
        DOE.requestPermission().catch(() => {})
      }
      window.removeEventListener('touchstart', requestTilt)
    }

    const tick = () => {
      curX += (targetX - curX) * 0.12
      curY += (targetY - curY) * 0.12
      el.style.setProperty('--mx', (curX * 100).toFixed(2) + '%')
      el.style.setProperty('--my', (curY * 100).toFixed(2) + '%')
      el.style.setProperty('--par-x', (curX - 0.5).toFixed(3))
      el.style.setProperty('--par-y', (curY - 0.5).toFixed(3))
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    onScroll()
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('deviceorientation', onTilt)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('touchstart', requestTilt, { once: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('deviceorientation', onTilt)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('touchstart', requestTilt)
    }
  }, [])

  return (
    <div className="ambient-bg" aria-hidden="true" ref={rootRef}>
      <span className="cursor-glow" />
      <div className="bloom" />
      <div className="particle-field">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              '--depth': p.depth,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>
      <span className="ambient-emoji ambient-emoji--one">{emoji}</span>
      <span className="ambient-emoji ambient-emoji--two">{emoji}</span>
      <span className="ambient-emoji ambient-emoji--three">{emoji}</span>
      <span className="scroll-lure" />
    </div>
  )
}
