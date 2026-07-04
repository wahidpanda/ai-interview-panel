export default function Footer() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: 'clamp(40px, 6vh, 56px) clamp(20px, 4vw, 48px) 28px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between',
          marginBottom: 36,
        }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7, background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div className="mono" style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700 }}>AI</div>
              </div>
              <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>INTERVIEW PANEL</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-faint)', lineHeight: 1.6 }}>
              A free, full-stack multi-agent AI interview system with a voice-driven
              video-call room, live coding IDE, and automatic scoring.
            </p>
          </div>

          <FooterColumn title="Product" links={[
            { label: 'Features', onClick: () => scrollTo('features') },
            { label: 'Demo', onClick: () => scrollTo('demo') },
            { label: 'Pricing', onClick: () => scrollTo('pricing') },
          ]} />

          <FooterColumn title="Resources" links={[
            { label: 'GitHub Repository', href: 'https://github.com' },
            { label: 'Documentation (README)', href: 'https://github.com' },
            { label: 'Report an Issue', href: 'https://github.com' },
          ]} />

          <FooterColumn title="Legal" links={[
            { label: 'MIT License', href: '#' },
            { label: 'Privacy Policy', href: '#' },
            { label: 'Terms of Use', href: '#' },
          ]} />
        </div>

        <div style={{
          borderTop: '1px solid var(--border)', paddingTop: 20,
          display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between',
          fontSize: 12, color: 'var(--text-faint)',
        }}>
          <span>© 2026 AI Interview Panel. Built with FastAPI + React.</span>
          <span className="mono">$0 to run · MIT Licensed</span>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.06em', marginBottom: 14 }}>
        {title.toUpperCase()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map((link, i) => (
          link.href ? (
            <a key={i} href={link.href} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {link.label}
            </a>
          ) : (
            <button key={i} onClick={link.onClick} style={{
              fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none',
              padding: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {link.label}
            </button>
          )
        ))}
      </div>
    </div>
  )
}