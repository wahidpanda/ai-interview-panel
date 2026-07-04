import DemoSimulation from './DemoSimulation.jsx'

export default function Demo() {
  return (
    <section id="demo" style={{ padding: 'clamp(64px, 10vh, 110px) clamp(20px, 4vw, 48px)', position: 'relative' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <span className="mono" style={{
            fontSize: 11, color: 'var(--accent)', background: 'var(--accent-dim)',
            border: '1px solid var(--accent)', borderRadius: 20, padding: '4px 12px',
          }}>
            SEE IT IN ACTION
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 3.4vw, 38px)', marginTop: 18, marginBottom: 14 }}>
            A full interview, start to finish
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
            HR round, candidate response, live coding, and the final verdict — this loop
            shows the real flow, live from the actual UI components.
          </p>
        </div>

        <DemoSimulation />
      </div>
    </section>
  )
}
