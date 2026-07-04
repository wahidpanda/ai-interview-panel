import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobs, startInterview } from '../api/client.js'
import PanelRail from '../components/PanelRail.jsx'

export default function Landing() {
  const [jobs, setJobs] = useState([])
  const [candidateName, setCandidateName] = useState('')
  const [jobId, setJobId] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [cvFileName, setCvFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, glowX: 50, glowY: 50 })

  useEffect(() => {
    getJobs().then(list => {
      setJobs(list)
      if (list.length) setJobId(list[0].id)
    }).catch(() => setError('Could not reach the backend. Is it running on port 8000?'))
  }, [])

  const handleTiltMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    setTilt({
      x: (py - 0.5) * -8,
      y: (px - 0.5) * 10,
      glowX: px * 100,
      glowY: py * 100,
    })
  }
  const handleTiltLeave = () => setTilt({ x: 0, y: 0, glowX: 50, glowY: 50 })

  const handleStart = async (e) => {
    e.preventDefault()
    if (!candidateName.trim() || !jobId) return
    setLoading(true)
    setError('')
    try {
      const res = await startInterview({ candidateName, jobDescriptionId: jobId, cvFile })
      navigate(`/interview/${res.session_id}`)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to start interview. Check backend logs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative animated background */}
      <div className="grid-overlay" />
      <div className="bg-blob" style={{
        width: 420, height: 420, top: '-8%', left: '-6%',
        background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.35), transparent 70%)',
        animation: 'float-blob 16s ease-in-out infinite',
      }} />
      <div className="bg-blob" style={{
        width: 360, height: 360, bottom: '-10%', right: '5%',
        background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.22), transparent 70%)',
        animation: 'float-blob-slow 20s ease-in-out infinite',
      }} />
      <div className="bg-blob" style={{
        width: 260, height: 260, top: '35%', left: '48%',
        background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.12), transparent 70%)',
        animation: 'float-blob 24s ease-in-out infinite reverse',
      }} />

      {/* Left: hero + rail */}
      <div style={{
        flex: '0 0 44%', padding: '64px 56px', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', zIndex: 1,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: 'var(--accent-dim)', border: '1px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'glow-pulse 3s ease-in-out infinite',
              boxShadow: '0 0 20px rgba(var(--accent-rgb), 0.35)',
            }}>
              <div className="mono" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>AI</div>
            </div>
            <span className="mono" style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>INTERVIEW PANEL</span>
            <span className="mono" style={{
              fontSize: 10.5, color: 'var(--positive)', background: 'var(--positive-dim)',
              border: '1px solid var(--positive)', borderRadius: 20, padding: '3px 10px', marginLeft: 4,
            }}>
              $0 TO RUN
            </span>
          </div>

          <h1 style={{ fontSize: 46, lineHeight: 1.1, marginBottom: 18, maxWidth: 480 }}>
            Four AI interviewers.<br />
            <span style={{
              background: 'linear-gradient(90deg, var(--accent), var(--accent-strong))',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>
              One decisive verdict.
            </span>
          </h1>
          <p style={{ fontSize: 15.5, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 420 }}>
            Your candidate moves through HR screening, a technical deep-dive, a
            live coding round, and a final culture-fit conversation — each run
            by a distinct AI agent, scored independently, and combined into a
            single hire / no-hire recommendation.
          </p>
        </div>

        <div style={{ marginTop: 56 }}>
          <PanelRail currentStage="hr" scores={[]} />
        </div>
      </div>

      {/* Right: setup form styled as a floating browser window with 3D tilt */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative', zIndex: 1, perspective: '1200px' }}>
        <div
          ref={cardRef}
          onMouseMove={handleTiltMove}
          onMouseLeave={handleTiltLeave}
          className="tilt-card"
          style={{
            width: '100%', maxWidth: 460,
            transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1)`,
            boxShadow: `0 30px 60px -20px rgba(var(--shadow-color), 0.35), 0 0 0 1px var(--border)`,
            borderRadius: 14,
            overflow: 'hidden',
            background: 'var(--surface)',
            position: 'relative',
          }}
        >
          {/* glow that follows the cursor for extra depth */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            background: `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(var(--accent-rgb), 0.10), transparent 60%)`,
            transition: 'background 0.15s ease',
          }} />

          {/* Browser window chrome */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
            background: 'var(--window-chrome)', borderBottom: '1px solid var(--border)',
            position: 'relative', zIndex: 1,
          }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#f87171' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#fbbf24' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#34d399' }} />
            <div style={{
              flex: 1, marginLeft: 10, background: 'var(--surface-alt)', borderRadius: 6,
              padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 11 }}>🔒</span>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
                interview-panel.local/setup
              </span>
            </div>
          </div>

          {/* Form content */}
          <form onSubmit={handleStart} style={{ padding: 32, position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>Set up the interview</h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 26 }}>
              This info is passed to the panel so every agent has real context.
            </p>

            <label style={labelStyle}>Candidate name</label>
            <input
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              placeholder="e.g. Tahmid Rahman"
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(var(--accent-rgb), 0.15)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none' }}
            />

            <label style={{ ...labelStyle, marginTop: 18 }}>Role / job description</label>
            <select
              value={jobId} onChange={e => setJobId(e.target.value)} style={inputStyle} required
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-light)' }}
            >
              {jobs.length === 0 && <option value="">Loading…</option>}
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>

            <label style={{ ...labelStyle, marginTop: 18 }}>CV / résumé <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional — .pdf or .txt)</span></label>
            <label
              htmlFor="cv-upload"
              style={{
                ...inputStyle, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                color: cvFileName ? 'var(--text-primary)' : 'var(--text-faint)',
              }}
            >
              <span style={{
                background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 6,
                padding: '4px 10px', fontSize: 12.5, fontWeight: 600, flexShrink: 0,
              }}>
                Choose file
              </span>
              <span style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cvFileName || 'No file chosen'}
              </span>
            </label>
            <input
              id="cv-upload"
              type="file"
              accept=".pdf,.txt,.md"
              onChange={e => {
                const f = e.target.files?.[0] || null
                setCvFile(f)
                setCvFileName(f?.name || '')
              }}
              style={{ display: 'none' }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6 }}>
              No CV? The panel will interview and score based on your answers alone.
            </p>

            {error && (
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--negative-dim)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: 'var(--negative)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: 26, padding: '14px 0', fontSize: 15, boxShadow: '0 8px 20px -6px rgba(var(--accent-rgb), 0.5)' }}
            >
              {loading ? 'Starting…' : 'Start Interview →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 7, fontWeight: 500 }
const inputStyle = {
  width: '100%', background: 'var(--surface-alt)', border: '1px solid var(--border-light)',
  borderRadius: 8, padding: '12px 14px', color: 'var(--text-primary)', fontSize: 14.5,
  outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
}