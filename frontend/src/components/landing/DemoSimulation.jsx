import { useEffect, useState } from 'react'
import AgentAvatar from '../AgentAvatar.jsx'

const STEPS = [
  {
    key: 'hr-ask',
    label: 'HR Round',
    kind: 'agent-speaking',
    stage: 'hr',
    speaker: 'Kylie Jenner · HR Manager',
    text: 'What motivated you to pursue a career in AI/ML, and what draws you to this role?',
    duration: 3400,
  },
  {
    key: 'candidate-answer',
    label: 'HR Round',
    kind: 'candidate-speaking',
    text: "I love building systems that actually ship — turning a research idea into something reliable at scale is what got me hooked.",
    duration: 3200,
  },
  {
    key: 'coding',
    label: 'Coding Round',
    kind: 'coding',
    duration: 4200,
  },
  {
    key: 'verdict',
    label: 'Final Verdict',
    kind: 'verdict',
    duration: 3600,
  },
]

export default function DemoSimulation() {
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]

  useEffect(() => {
    const timer = setTimeout(() => {
      setStepIndex(i => (i + 1) % STEPS.length)
    }, step.duration)
    return () => clearTimeout(timer)
  }, [stepIndex, step.duration])

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)',
      boxShadow: '0 30px 60px -25px rgba(var(--shadow-color), 0.4)', background: 'var(--surface)',
    }}>
      {/* Browser chrome */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px',
        background: 'var(--window-chrome)', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399' }} />
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 8 }}>
          interview-panel.local · {step.label}
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 5 }}>
          {STEPS.map((s, i) => (
            <span key={s.key} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: i === stepIndex ? 'var(--accent)' : 'var(--border-light)',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Stage */}
      <div style={{
        position: 'relative', aspectRatio: '16/9', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <div className="grid-overlay" style={{ opacity: 0.6 }} />

        {step.kind === 'agent-speaking' && (
          <div key={step.key} style={{ position: 'relative', zIndex: 1, textAlign: 'center', animation: 'fade-in-up 0.4s ease', maxWidth: '80%' }}>
            <div style={{ margin: '0 auto 18px', width: 76 }}>
              <AgentAvatar stage={step.stage} isSpeaking size={76} />
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 10 }}>{step.speaker}</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 20, marginBottom: 14,
            }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} style={{
                  width: 3, borderRadius: 2, background: 'var(--accent)',
                  animation: `wave-bar 0.9s ease-in-out infinite ${i * 0.08}s`,
                }} />
              ))}
            </div>
            <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.5, padding: '0 12px' }}>
              "{step.text}"
            </p>
          </div>
        )}

        {step.kind === 'candidate-speaking' && (
          <div key={step.key} style={{ position: 'relative', zIndex: 1, textAlign: 'center', animation: 'fade-in-up 0.4s ease', maxWidth: '80%' }}>
            <div style={{
              width: 76, height: 76, borderRadius: '50%', margin: '0 auto 18px',
              background: 'var(--negative-dim)', border: '2px solid var(--negative)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              animation: 'pulse-ring 1.6s infinite',
            }}>
              🎤
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--negative)', marginBottom: 10, letterSpacing: '0.04em' }}>
              ● LISTENING — CANDIDATE
            </div>
            <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.5, padding: '0 12px', fontStyle: 'italic' }}>
              "{step.text}"
            </p>
          </div>
        )}

        {step.kind === 'coding' && <CodingStep />}
        {step.kind === 'verdict' && <VerdictStep />}
      </div>
    </div>
  )
}

function CodingStep() {
  const lines = [
    'def is_valid(s):',
    '    stack = []',
    '    pairs = {")":"(", "]":"[", "}":"{"}',
    '    for ch in s:',
    '        if ch in pairs:',
    '            if not stack or stack.pop() != pairs[ch]:',
    '                return False',
    '        else:',
    '            stack.append(ch)',
    '    return not stack',
  ]
  const [visibleLines, setVisibleLines] = useState(0)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    setVisibleLines(0)
    setShowResults(false)
    const lineTimer = setInterval(() => {
      setVisibleLines(v => {
        if (v >= lines.length) { clearInterval(lineTimer); return v }
        return v + 1
      })
    }, 180)
    const resultTimer = setTimeout(() => setShowResults(true), 2200)
    return () => { clearInterval(lineTimer); clearTimeout(resultTimer) }
  }, [])

  return (
    <div key="coding" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 560, display: 'flex', gap: 14, padding: '0 20px', animation: 'fade-in-up 0.4s ease' }}>
      <div className="mono" style={{
        flex: 1, background: 'var(--surface-alt)', borderRadius: 10, padding: 16, fontSize: 11.5,
        border: '1px solid var(--border)', minHeight: 200,
      }}>
        <div style={{ color: 'var(--text-faint)', marginBottom: 8 }}>Valid Parentheses — Python</div>
        {lines.slice(0, visibleLines).map((line, i) => (
          <div key={i} style={{ color: 'var(--text-primary)', whiteSpace: 'pre', opacity: 0, animation: 'fade-in-up 0.2s ease forwards' }}>
            {line}
          </div>
        ))}
      </div>
      {showResults && (
        <div className="mono" style={{
          width: 140, background: 'var(--surface-alt)', borderRadius: 10, padding: 14, fontSize: 11,
          border: '1px solid var(--border)', animation: 'fade-in-up 0.3s ease', flexShrink: 0,
        }}>
          <div style={{ color: 'var(--text-faint)', marginBottom: 10 }}>Test Results</div>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ color: 'var(--positive)', marginBottom: 6, display: 'flex', gap: 6 }}>
              <span>✓</span><span>Test {n} passed</span>
            </div>
          ))}
          <div style={{ marginTop: 10, color: 'var(--positive)', fontWeight: 700, fontSize: 13 }}>3/3 · Score 10/10</div>
        </div>
      )}
    </div>
  )
}

function VerdictStep() {
  return (
    <div key="verdict" style={{ position: 'relative', zIndex: 1, textAlign: 'center', animation: 'fade-in-up 0.4s ease' }}>
      <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.06em', marginBottom: 14 }}>
        PANEL DECISION
      </div>
      <div style={{
        display: 'inline-block', fontSize: 15, fontWeight: 700, color: 'var(--positive)',
        background: 'var(--positive-dim)', border: '1.5px solid var(--positive)',
        borderRadius: 24, padding: '8px 22px', marginBottom: 18,
      }}>
        Strong Hire
      </div>
      <div className="mono" style={{ fontSize: 44, fontWeight: 700, color: 'var(--text-primary)' }}>
        8.7<span style={{ fontSize: 18, color: 'var(--text-faint)', fontWeight: 400 }}>/10</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12, maxWidth: 340, lineHeight: 1.5 }}>
        Strong technical depth, clean code, and clear communication across all four rounds.
      </p>
    </div>
  )
}