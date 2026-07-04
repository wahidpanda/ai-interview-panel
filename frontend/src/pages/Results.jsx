import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getResult, finalizeInterview } from '../api/client.js'
import ScoreCard from '../components/ScoreCard.jsx'

const VERDICT_STYLE = {
  'Strong Hire': { color: 'var(--positive)', bg: 'var(--positive-dim)', ring: 'var(--positive)' },
  'Hire': { color: 'var(--positive)', bg: 'var(--positive-dim)', ring: 'var(--positive)' },
  'Borderline — Further Review': { color: 'var(--warning)', bg: 'var(--warning-dim)', ring: 'var(--warning)' },
  'No Hire': { color: 'var(--negative)', bg: 'var(--negative-dim)', ring: 'var(--negative)' },
}

export default function Results() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getResult(sessionId)
      .catch(() => finalizeInterview(sessionId))
      .then(r => setResult(r?.overall_score !== undefined ? r : null))
      .catch(err => setError(err?.response?.data?.detail || 'Could not load results.'))
  }, [sessionId])

  if (error) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--negative)' }}>{error}</div>
  }
  if (!result) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Calculating final verdict…</div>
  }

  const style = VERDICT_STYLE[result.verdict] || VERDICT_STYLE['Borderline — Further Review']
  const circumference = 2 * Math.PI * 54
  const dash = (result.overall_score / 10) * circumference

  return (
    <div style={{ minHeight: '100vh', padding: '56px 32px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 960 }} id="printable-scorecard">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button className="btn" onClick={() => window.print()}>⬇ Export as PDF</button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '0.08em', marginBottom: 6 }}>INTERVIEW COMPLETE</div>
          <h1 style={{ fontSize: 30, marginBottom: 4 }}>{result.candidate_name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{result.job_title}</p>
        </div>

        <div className="card" style={{ padding: 40, display: 'flex', alignItems: 'center', gap: 40, marginBottom: 32 }}>
          <svg width="130" height="130" style={{ flexShrink: 0 }}>
            <circle cx="65" cy="65" r="54" fill="none" stroke="var(--surface-alt)" strokeWidth="10" />
            <circle
              cx="65" cy="65" r="54" fill="none" stroke={style.ring} strokeWidth="10"
              strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
              transform="rotate(-90 65 65)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <text x="65" y="60" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--text-primary)" fontFamily="JetBrains Mono, monospace">
              {result.overall_score.toFixed(1)}
            </text>
            <text x="65" y="80" textAnchor="middle" fontSize="11" fill="var(--text-faint)">out of 10</text>
          </svg>

          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-block', padding: '7px 16px', borderRadius: 20,
              background: style.bg, border: `1px solid ${style.color}`, color: style.color,
              fontSize: 14, fontWeight: 600, marginBottom: 14,
            }}>
              {result.verdict}
            </div>
            <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.65 }}>{result.summary}</p>
          </div>
        </div>

        <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Panel Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 40 }}>
          {result.stage_scores.map(s => (
            <ScoreCard key={s.stage} label={s.label} score={s.score} summary={s.summary} strengths={s.strengths} concerns={s.concerns} />
          ))}
        </div>

        <div style={{ textAlign: 'center' }} className="no-print">
          <button className="btn" onClick={() => navigate('/')}>Start a new interview</button>
        </div>
      </div>
    </div>
  )
}
