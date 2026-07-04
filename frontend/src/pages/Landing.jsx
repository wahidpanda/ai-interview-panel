import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobs, startInterview } from '../api/client.js'
import PanelRail from '../components/PanelRail.jsx'

export default function Landing() {
  const [jobs, setJobs] = useState([])
  const [candidateName, setCandidateName] = useState('')
  const [jobId, setJobId] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getJobs().then(list => {
      setJobs(list)
      if (list.length) setJobId(list[0].id)
    }).catch(() => setError('Could not reach the backend. Is it running on port 8000?'))
  }, [])

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
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left: hero + rail */}
      <div style={{
        flex: '0 0 44%', padding: '64px 56px', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="mono" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>AI</div>
            </div>
            <span className="mono" style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>INTERVIEW PANEL</span>
          </div>

          <h1 style={{ fontSize: 44, lineHeight: 1.12, marginBottom: 18, maxWidth: 480 }}>
            Four AI interviewers.<br />One decisive verdict.
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

      {/* Right: setup form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <form onSubmit={handleStart} className="card" style={{ width: '100%', maxWidth: 440, padding: 36 }}>
          <h2 style={{ fontSize: 20, marginBottom: 6 }}>Set up the interview</h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 28 }}>
            This info is passed to the panel so every agent has real context.
          </p>

          <label style={labelStyle}>Candidate name</label>
          <input
            value={candidateName}
            onChange={e => setCandidateName(e.target.value)}
            placeholder="e.g. Tahmid Rahman"
            required
            style={inputStyle}
          />

          <label style={{ ...labelStyle, marginTop: 18 }}>Role / job description</label>
          <select value={jobId} onChange={e => setJobId(e.target.value)} style={inputStyle} required>
            {jobs.length === 0 && <option value="">Loading…</option>}
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>

          <label style={{ ...labelStyle, marginTop: 18 }}>CV / résumé <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional — .pdf or .txt)</span></label>
          <input
            type="file"
            accept=".pdf,.txt,.md"
            onChange={e => setCvFile(e.target.files?.[0] || null)}
            style={{ ...inputStyle, padding: 10 }}
          />
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6 }}>
            No CV? The panel will interview and score based on your answers alone.
          </p>

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--negative-dim)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: 'var(--negative)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 26, padding: '13px 0' }}>
            {loading ? 'Starting…' : 'Start Interview →'}
          </button>
        </form>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 7, fontWeight: 500 }
const inputStyle = {
  width: '100%', background: 'var(--surface-alt)', border: '1px solid var(--border-light)',
  borderRadius: 8, padding: '12px 14px', color: 'var(--text-primary)', fontSize: 14.5,
  outline: 'none', fontFamily: 'var(--font-body)',
}
