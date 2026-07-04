export default function ScoreCard({ label, score, summary, strengths = [], concerns = [] }) {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100))
  const color = score >= 7 ? 'var(--positive)' : score >= 5 ? 'var(--warning)' : 'var(--negative)'

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <h3 style={{ fontSize: 15 }}>{label}</h3>
        <span className="mono" style={{ fontSize: 18, fontWeight: 700, color }}>{score.toFixed(1)}<span style={{ fontSize: 12, color: 'var(--text-faint)' }}>/10</span></span>
      </div>

      <div style={{ height: 6, borderRadius: 4, background: 'var(--surface-alt)', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>

      <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: strengths.length || concerns.length ? 14 : 0 }}>
        {summary}
      </p>

      {strengths.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {strengths.map((s, i) => (
            <div key={i} style={{ fontSize: 12.5, color: 'var(--positive)', display: 'flex', gap: 6, marginBottom: 4 }}>
              <span>+</span><span style={{ color: 'var(--text-muted)' }}>{s}</span>
            </div>
          ))}
        </div>
      )}
      {concerns.length > 0 && (
        <div>
          {concerns.map((c, i) => (
            <div key={i} style={{ fontSize: 12.5, color: 'var(--negative)', display: 'flex', gap: 6, marginBottom: 4 }}>
              <span>−</span><span style={{ color: 'var(--text-muted)' }}>{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
