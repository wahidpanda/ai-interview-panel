import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobs, startInterview } from '../../api/client.js'

export default function Hero() {
  const [jobs, setJobs] = useState([])
  const [candidateName, setCandidateName] = useState('')
  const [jobId, setJobId] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [cvFileName, setCvFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const cardRef = useRef(null)
  const [hovering, setHovering] = useState(false)
  const BASE = { x: 3, y: -8 }
  const [tilt, setTilt] = useState({ x: BASE.x, y: BASE.y, glowX: 30, glowY: 30 })

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
      x: BASE.x + (py - 0.5) * -12,
      y: BASE.y + (px - 0.5) * 14,
      glowX: px * 100,
      glowY: py * 100,
    })
    setHovering(true)
  }
  const handleTiltLeave = () => {
    setTilt({ x: BASE.x, y: BASE.y, glowX: 30, glowY: 30 })
    setHovering(false)
  }

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
    <section id="top" style={{ position: 'relative', overflow: 'hidden', minHeight: '92vh', display: 'flex', alignItems: 'center' }}>
      <div className="grid-overlay" />
      <div className="bg-blob" style={{
        width: 480, height: 480, top: '-16%', left: '-8%',
        background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.32), transparent 70%)',
        animation: 'float-blob 16s ease-in-out infinite',
      }} />
      <div className="bg-blob" style={{
        width: 420, height: 420, bottom: '-18%', right: '2%',
        background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.22), transparent 70%)',
        animation: 'float-blob-slow 20s ease-in-out infinite',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'clamp(90px, 12vh, 130px) clamp(16px, 4vw, 48px) clamp(40px, 6vh, 64px)',
        gap: 'clamp(20px, 4vw, 64px)', flexWrap: 'wrap',
      }}>

        {/* Left: hero copy */}
        <div style={{ flex: '1 1 360px', maxWidth: 560, position: 'relative', zIndex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
            <span className="mono" style={{
              fontSize: 10.5, color: 'var(--positive)', background: 'var(--positive-dim)',
              border: '1px solid var(--positive)', borderRadius: 20, padding: '3px 10px',
            }}>
              $0 TO RUN
            </span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>No credit card · No install for candidates</span>
          </div>

          <h1 style={{ fontSize: 'clamp(34px, 4.6vw, 52px)', lineHeight: 1.08, marginBottom: 18, letterSpacing: '-0.02em' }}>
            Four AI interviewers.<br />
            <span style={{
              background: 'linear-gradient(90deg, var(--accent), var(--accent-strong))',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>
              One decisive verdict.
            </span>
          </h1>
          <p style={{ fontSize: 'clamp(14.5px, 1.5vw, 16.5px)', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 480, marginBottom: 24 }}>
            Your candidate joins a live voice-driven interview room, moves through
            HR screening, a technical deep-dive, a live coding round, and a final
            culture-fit conversation — each run by a distinct AI agent, scored
            independently, and combined into a single hire / no-hire recommendation.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {['H', 'T', '{ }', 'F'].map((c, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%', marginLeft: i === 0 ? 0 : -8,
                  background: 'var(--surface-raised)', border: '2px solid var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--accent)', boxShadow: '0 2px 6px rgba(var(--shadow-color), 0.2)',
                }}>
                  {c}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              4 independent agents, scored and combined instantly
            </span>
          </div>
        </div>

        {/* Right: setup form styled as a floating browser window with persistent 3D tilt */}
        <div style={{
          flex: '1 1 320px', maxWidth: 500, position: 'relative', zIndex: 1,
          display: 'flex', justifyContent: 'center', perspective: '1600px', minWidth: 0,
        }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 460 }}>
            <div
              ref={cardRef}
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
              className="tilt-card"
              style={{
                width: '100%',
                transform: `perspective(1600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovering ? 1.015 : 1})`,
                boxShadow: hovering
                  ? '0 40px 80px -25px rgba(var(--shadow-color), 0.45), 0 0 0 1px var(--border)'
                  : '0 28px 60px -25px rgba(var(--shadow-color), 0.4), 0 0 0 1px var(--border)',
                borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                background: `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(var(--accent-rgb), 0.12), transparent 60%)`,
                transition: 'background 0.15s ease',
              }} />

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px',
                background: 'var(--window-chrome)', borderBottom: '1px solid var(--border)',
                position: 'relative', zIndex: 1,
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399' }} />
                <div style={{
                  flex: 1, marginLeft: 10, background: 'var(--surface-alt)', borderRadius: 6,
                  padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
                }}>
                  <span style={{ fontSize: 10 }}>🔒</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    interview-panel.local/setup
                  </span>
                </div>
              </div>

              <form onSubmit={handleStart} style={{ padding: 'clamp(20px, 3vw, 30px)', position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: 18.5, marginBottom: 4 }}>Set up the interview</h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 18 }}>
                  This info is passed to the panel so every agent has real context.
                </p>

                <label style={labelStyle}>Candidate name</label>
                <input
                  value={candidateName}
                  onChange={e => setCandidateName(e.target.value)}
                  placeholder="e.g. Sarah Rahman"
                  required
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(var(--accent-rgb), 0.15)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none' }}
                />

                <label style={{ ...labelStyle, marginTop: 13 }}>Role / job description</label>
                <select
                  value={jobId} onChange={e => setJobId(e.target.value)} style={inputStyle} required
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-light)' }}
                >
                  {jobs.length === 0 && <option value="">Loading…</option>}
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>

                <label style={{ ...labelStyle, marginTop: 13 }}>CV / résumé <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span></label>
                <label
                  htmlFor="cv-upload"
                  style={{
                    ...inputStyle, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    color: cvFileName ? 'var(--text-primary)' : 'var(--text-faint)',
                  }}
                >
                  <span style={{
                    background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 6,
                    padding: '4px 10px', fontSize: 12, fontWeight: 600, flexShrink: 0,
                  }}>
                    Choose file
                  </span>
                  <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cvFileName || 'No file chosen'}
                  </span>
                </label>
                <input
                  id="cv-upload" type="file" accept=".pdf,.txt,.md"
                  onChange={e => {
                    const f = e.target.files?.[0] || null
                    setCvFile(f)
                    setCvFileName(f?.name || '')
                  }}
                  style={{ display: 'none' }}
                />

                {error && (
                  <div style={{ marginTop: 12, padding: '9px 12px', background: 'var(--negative-dim)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: 'var(--negative)', fontSize: 12 }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit" className="btn btn-primary" disabled={loading}
                  style={{ width: '100%', marginTop: 18, padding: '13px 0', fontSize: 14.5, boxShadow: '0 8px 24px -6px rgba(var(--accent-rgb), 0.5)' }}
                >
                  {loading ? 'Starting…' : 'Start Interview →'}
                </button>
              </form>
            </div>

            <div style={{
              position: 'absolute', right: -8, bottom: 'calc(100% + 14px)', width: 150, zIndex: 2,
              background: 'var(--surface)', borderRadius: 11, border: '1px solid var(--border)',
              boxShadow: '0 16px 32px -12px rgba(var(--shadow-color), 0.5)', padding: '10px 13px',
              transform: `perspective(1600px) rotateX(${tilt.x * 0.4}deg) rotateY(${tilt.y * 0.4}deg) rotate(3deg)`,
              transition: 'transform 0.15s ease-out',
            }}>
              <div className="mono" style={{ fontSize: 8, color: 'var(--text-faint)', letterSpacing: '0.06em', marginBottom: 5 }}>AI VERDICT</div>
              <div style={{
                display: 'inline-block', fontSize: 10, fontWeight: 600, color: 'var(--positive)',
                background: 'var(--positive-dim)', border: '1px solid var(--positive)',
                borderRadius: 20, padding: '2px 7px', marginBottom: 7,
              }}>
                Strong Hire
              </div>
              <div className="mono" style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)' }}>
                8.7<span style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 400 }}>/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const labelStyle = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }
const inputStyle = {
  width: '100%', background: 'var(--surface-alt)', border: '1px solid var(--border-light)',
  borderRadius: 8, padding: '11px 13px', color: 'var(--text-primary)', fontSize: 13.5,
  outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
}
