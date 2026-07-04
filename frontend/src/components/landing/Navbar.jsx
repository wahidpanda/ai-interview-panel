export default function Navbar({ theme, onToggleTheme }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  const isDark = theme === 'dark'

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
      background: 'var(--glass-bg)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px clamp(16px, 4vw, 48px)', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="mono" style={{ color: 'var(--accent)', fontSize: 11.5, fontWeight: 700 }}>AI</div>
        </div>
        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
          INTERVIEW PANEL
        </span>
      </div>

      <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 28px)', fontSize: 13 }}>
        <button onClick={() => scrollTo('features')} style={navLinkStyle}>Features</button>
        <button onClick={() => scrollTo('demo')} style={navLinkStyle}>Demo</button>
        <button onClick={() => scrollTo('pricing')} style={navLinkStyle}>Pricing</button>
        <button
          onClick={() => scrollTo('top')}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: 12.5, whiteSpace: 'nowrap' }}
        >
          Get Started
        </button>
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'var(--surface-raised)', border: '1px solid var(--border-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, cursor: 'pointer', transition: 'border-color 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}

const navLinkStyle = {
  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 13, padding: 0, transition: 'color 0.15s ease', whiteSpace: 'nowrap',
}