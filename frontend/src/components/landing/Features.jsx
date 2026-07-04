const FEATURES = [
  {
    icon: '🎙️',
    title: 'Hands-Free Voice Interview',
    desc: 'Click once and the mic stays live for the whole interview. Each agent asks, listens, auto-detects when you pause, and moves on — no button-mashing between questions.',
  },
  {
    icon: '🧑\u200d🤝\u200d🧑',
    title: 'Four Independent Agents',
    desc: 'HR, Technical, Coding, and Team Lead rounds each run by a distinct AI persona with its own questions and scoring rubric — not one model wearing different hats.',
  },
  {
    icon: '💻',
    title: 'Live Coding IDE',
    desc: 'A real in-browser Monaco editor with actual code execution and hidden test cases. Problems are randomized and AI/ML-themed, not the same puzzle every time.',
  },
  {
    icon: '⚖️',
    title: 'Deterministic Verdict',
    desc: 'The final Hire / No-Hire call is computed from a weighted scoring formula, not another LLM guess — auditable, consistent, and explained in plain language.',
  },
  {
    icon: '🕵️',
    title: 'Integrity Monitoring',
    desc: 'Tab-switch and fullscreen-exit detection during the coding round, shown honestly in the final report — real detection, not a false promise of "prevention".',
  },
  {
    icon: '💸',
    title: '$0 To Run',
    desc: 'Free LLM inference (OpenRouter + Groq fallback), free code execution (Judge0), and free voice (your browser). No credit card, anywhere in the stack.',
  },
]

export default function Features() {
  return (
    <section id="features" style={{ padding: 'clamp(64px, 10vh, 110px) clamp(20px, 4vw, 48px)', position: 'relative' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="mono" style={{
            fontSize: 11, color: 'var(--accent)', background: 'var(--accent-dim)',
            border: '1px solid var(--accent)', borderRadius: 20, padding: '4px 12px',
          }}>
            HOW IT WORKS
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 3.4vw, 38px)', marginTop: 18, marginBottom: 14 }}>
            A full panel, built to feel like a real interview
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Every round is a distinct agent with its own persona, questions, and
            rubric — not a single chatbot pretending to be four people.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card" style={{ padding: 26, transition: 'transform 0.2s ease, border-color 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: 'var(--accent-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 16.5, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
