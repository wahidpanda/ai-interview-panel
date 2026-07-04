const TIERS = [
  {
    name: 'Self-Hosted',
    price: '$0',
    period: 'forever',
    tagline: 'Run it yourself, own everything',
    features: [
      'Full source code, MIT licensed',
      'All 4 AI agents + coding IDE',
      'Your own free API keys (OpenRouter, Groq)',
      'Unlimited interviews',
      'Community support (GitHub Issues)',
    ],
    cta: 'Clone on GitHub',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$--',
    period: '/ month',
    tagline: 'Managed hosting, zero setup',
    features: [
      'Everything in Self-Hosted',
      'Hosted for you, no server to run',
      'Priority model access, fewer rate limits',
      'Team dashboard for multiple roles',
      'Email support',
    ],
    cta: 'Contact Sales',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    tagline: 'For hiring at scale',
    features: [
      'Everything in Pro',
      'SSO / SAML',
      'Dedicated infrastructure',
      'Custom agent personas & scoring rubric',
      'Dedicated support & onboarding',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" style={{ padding: 'clamp(64px, 10vh, 110px) clamp(20px, 4vw, 48px)', position: 'relative' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <span className="mono" style={{
            fontSize: 11, color: 'var(--accent)', background: 'var(--accent-dim)',
            border: '1px solid var(--accent)', borderRadius: 20, padding: '4px 12px',
          }}>
            PRICING
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 3.4vw, 38px)', marginTop: 18, marginBottom: 14 }}>
            Free to run today. Scales when you need it to.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-faint)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
            This project runs entirely free right now — Pro and Enterprise are
            illustrative tiers for a hosted version, not live billing.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {TIERS.map((tier, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: 30, position: 'relative',
                border: tier.highlighted ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                boxShadow: tier.highlighted ? '0 20px 50px -20px rgba(var(--accent-rgb), 0.35)' : 'none',
                transform: tier.highlighted ? 'translateY(-8px)' : 'none',
              }}
            >
              {tier.highlighted && (
                <span className="mono" style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 10, color: '#06201d', background: 'var(--accent)',
                  borderRadius: 20, padding: '3px 12px', fontWeight: 700,
                }}>
                  MOST POPULAR
                </span>
              )}

              <h3 style={{ fontSize: 18, marginBottom: 4 }}>{tier.name}</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 18 }}>{tier.tagline}</p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 22 }}>
                <span className="mono" style={{ fontSize: 34, fontWeight: 700, color: 'var(--text-primary)' }}>{tier.price}</span>
                {tier.period && <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>{tier.period}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
                {tier.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--positive)', flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <button
                className={tier.highlighted ? 'btn btn-primary' : 'btn'}
                style={{ width: '100%', padding: '11px 0', fontSize: 13.5 }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
