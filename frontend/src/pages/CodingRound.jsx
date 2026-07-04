import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { startCoding, executeCode, submitCode } from '../api/client.js'
import { useCamera } from '../hooks/useCamera.js'

const LANGUAGES = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
]

export default function CodingRound() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [problem, setProblem] = useState(null)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [customStdin, setCustomStdin] = useState('')
  const [output, setOutput] = useState(null)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [error, setError] = useState('')
  const [tabSwitches, setTabSwitches] = useState(0)
  const [fullscreenExits, setFullscreenExits] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const { videoRef, status: cameraStatus } = useCamera(true)
  const wasFullscreenRef = useRef(false)

  // Integrity monitoring: a website genuinely cannot prevent you from
  // switching tabs or apps - no browser API allows that. What's actually
  // possible, and what real proctoring tools do, is DETECT it: tab
  // visibility changes and exits from fullscreen are logged and included
  // in the final scorecard.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') setTabSwitches(n => n + 1)
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const handleFullscreenChange = () => {
      const nowFullscreen = !!document.fullscreenElement
      if (wasFullscreenRef.current && !nowFullscreen) {
        setFullscreenExits(n => n + 1)
      }
      wasFullscreenRef.current = nowFullscreen
      setIsFullscreen(nowFullscreen)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {
      setError('Could not enter fullscreen - your browser may have blocked it. You can continue without it.')
    })
  }

  useEffect(() => {
    startCoding(sessionId)
      .then(p => {
        setProblem(p)
        setCode(p.starter_code[language] || '')
        setCustomStdin(p.test_case_preview.stdin)
      })
      .catch(err => setError(err?.response?.data?.detail || 'Could not load the coding round.'))
  }, [sessionId])

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    if (problem) setCode(problem.starter_code[lang] || `// starter code not available for ${lang}\n`)
  }

  const handleRun = async () => {
    setRunning(true)
    setOutput(null)
    try {
      const res = await executeCode(sessionId, language, code, customStdin)
      setOutput(res)
    } catch (err) {
      setOutput({ stderr: err?.response?.data?.detail || 'Execution failed.' })
    } finally {
      setRunning(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await submitCode(sessionId, language, code, tabSwitches, fullscreenExits)
      setSubmitResult(res)
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
      setTimeout(() => navigate(`/interview/${sessionId}`), 1600)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (error && !problem) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--negative)' }}>{error}</div>
  }
  if (!problem) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading coding round…</div>
  }

  const violationCount = tabSwitches + fullscreenExits

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--accent)' }}>
            CODING ROUND
          </div>
          <h2 style={{ fontSize: 16 }}>{problem.title}</h2>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', border: '1px solid var(--border-light)', padding: '3px 8px', borderRadius: 5 }}>
            {problem.difficulty}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={language} onChange={e => handleLanguageChange(e.target.value)} style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-light)', borderRadius: 7, color: 'var(--text-primary)', padding: '8px 12px', fontSize: 13 }}>
            {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          {!isFullscreen && (
            <button className="btn" onClick={enterFullscreen} style={{ fontSize: 12, padding: '7px 12px' }}>
              ⛶ Enter Fullscreen
            </button>
          )}
          {violationCount > 0 && (
            <span
              className="mono"
              title={`${tabSwitches} tab switch(es), ${fullscreenExits} fullscreen exit(s) - recorded in your final report`}
              style={{ fontSize: 11, color: 'var(--warning)', border: '1px solid var(--warning)', background: 'var(--warning-dim)', padding: '5px 10px', borderRadius: 6 }}
            >
              ⚠ {violationCount} flagged event{violationCount > 1 ? 's' : ''}
            </span>
          )}
          <div style={{
            width: 46, height: 34, borderRadius: 6, overflow: 'hidden', background: '#05070b',
            border: `1px solid ${cameraStatus === 'live' ? 'var(--border)' : 'var(--negative)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }} title={cameraStatus === 'live' ? 'Camera visible' : 'Camera not available'}>
            {cameraStatus === 'live' ? (
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            ) : (
              <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>—</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Problem panel */}
        <div className="scrollbar-thin" style={{ flex: '0 0 340px', borderRight: '1px solid var(--border)', padding: 28, overflowY: 'auto' }}>
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Problem</h3>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--text-primary)', marginBottom: 24 }}>{problem.prompt}</p>

          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Example</h3>
          <div className="mono card" style={{ padding: 14, fontSize: 12.5, marginBottom: 8 }}>
            <div style={{ color: 'var(--text-faint)', marginBottom: 6 }}>stdin</div>
            <div style={{ marginBottom: 10, whiteSpace: 'pre-wrap' }}>{problem.test_case_preview.stdin}</div>
            <div style={{ color: 'var(--text-faint)', marginBottom: 6 }}>expected stdout</div>
            <div>{problem.test_case_preview.expected}</div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            {problem.total_tests} test cases will run on submit ({problem.total_tests - 1} hidden).
          </p>
        </div>

        {/* Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={language === 'python' ? 'python' : 'javascript'}
              theme="vs-dark"
              value={code}
              onChange={v => setCode(v ?? '')}
              options={{ fontSize: 14, minimap: { enabled: false }, fontFamily: 'JetBrains Mono, monospace', padding: { top: 16 } }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', padding: 16, display: 'flex', gap: 10 }}>
            <input
              value={customStdin}
              onChange={e => setCustomStdin(e.target.value)}
              placeholder="stdin for Run (edit freely)"
              className="mono"
              style={{ flex: 1, background: 'var(--surface-alt)', border: '1px solid var(--border-light)', borderRadius: 7, padding: '9px 12px', color: 'var(--text-primary)', fontSize: 12.5 }}
            />
            <button className="btn" onClick={handleRun} disabled={running}>{running ? 'Running…' : 'Run'}</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Grading…' : 'Submit Solution'}</button>
          </div>
        </div>

        {/* Output panel */}
        <div className="scrollbar-thin" style={{ flex: '0 0 320px', borderLeft: '1px solid var(--border)', padding: 24, overflowY: 'auto' }}>
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Console</h3>

          {!output && !submitResult && <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Run your code to see output here.</p>}

          {output && !submitResult && (
            <div className="mono card" style={{ padding: 14, fontSize: 12.5, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
              {output.error && <div style={{ color: 'var(--negative)' }}>⚠ {output.error}</div>}
              {output.stdout && <div style={{ color: 'var(--text-primary)' }}>{output.stdout}</div>}
              {output.stderr && <div style={{ color: 'var(--negative)', marginTop: output.stdout ? 8 : 0 }}>{output.stderr}</div>}
              {!output.error && !output.stdout && !output.stderr && <div style={{ color: 'var(--text-faint)' }}>(no output)</div>}
            </div>
          )}

          {submitResult && (
            <div>
              <div style={{
                padding: '14px 16px', borderRadius: 10, marginBottom: 16, textAlign: 'center',
                background: submitResult.passed === submitResult.total ? 'var(--positive-dim)' : 'var(--warning-dim)',
                border: `1px solid ${submitResult.passed === submitResult.total ? 'var(--positive)' : 'var(--warning)'}`,
              }}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: submitResult.passed === submitResult.total ? 'var(--positive)' : 'var(--warning)' }}>
                  {submitResult.passed}/{submitResult.total}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>test cases passed — score {submitResult.score}/10</div>
              </div>
              {submitResult.test_results.map((t, i) => (
                <div key={i} className="mono" style={{ fontSize: 11.5, padding: '8px 10px', borderRadius: 6, background: 'var(--surface-alt)', marginBottom: 6, border: `1px solid ${t.passed ? 'var(--border)' : 'rgba(248,113,113,0.3)'}` }}>
                  <span style={{ color: t.passed ? 'var(--positive)' : 'var(--negative)' }}>{t.passed ? '✓ PASS' : '✗ FAIL'}</span>
                </div>
              ))}
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>Moving to the final round…</p>
            </div>
          )}

          {error && <p style={{ fontSize: 12.5, color: 'var(--negative)', marginTop: 12 }}>{error}</p>}
        </div>
      </div>
    </div>
  )
}
