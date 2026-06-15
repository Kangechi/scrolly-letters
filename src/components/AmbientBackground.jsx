export default function AmbientBackground({ emoji }) {
    return (
        <div className="ambient-bg" aria-hidden="true">
            <span className="glow-orb glow-orb--one" />
            <span className="glow-orb glow-orb--two" />
            <span className="ambient-emoji ambient-emoji--one">{emoji}</span>
            <span className="ambient-emoji ambient-emoji--two">{emoji}</span>
            <span className="ambient-emoji ambient-emoji--three">{emoji}</span>
        </div>
    )
}
