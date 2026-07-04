import { useRef, useState } from 'react'

export default function Demo() {
  const videoRef = useRef(null)
  const [videoMissing, setVideoMissing] = useState(false)
  const [playing, setPlaying] = useState(false)

  const handlePlay = () => {
    const video = videoRef.current
    if (!video) return
    video.play().then(() => setPlaying(true)).catch(() => setVideoMissing(true))
  }

  return (
    <section id="demo" style={{ padding: 'clamp(64px, 10vh, 110px) clamp(20px, 4vw, 48px)', position: 'relative' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <span className="mono" style={{
            fontSize: 11, color: 'var(--accent)', background: 'var(--accent-dim)',
            border: '1px solid var(--accent)', borderRadius: 20, padding: '4px 12px',
          }}>
            SEE IT IN ACTION
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 3.4vw, 38px)', marginTop: 18, marginBottom: 14 }}>
            Watch a full interview, start to finish
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
            HR round, technical questions, live coding, and the final verdict — in one recording.
          </p>
        </div>

        <div style={{
          borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)',
          boxShadow: '0 30px 60px -25px rgba(var(--shadow-color), 0.4)', background: 'var(--surface)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px',
            background: 'var(--window-chrome)', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399' }} />
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 8 }}>
              demo-recording.mp4
            </span>
          </div>

          <div style={{ position: 'relative', aspectRatio: '16/9', background: '#05070b' }}>
            {/*
              Drop your real recording at frontend/public/demo.mp4 (or set the
              src below to a hosted URL) and this plays it directly - no other
              code changes needed. Until then, this shows an honest placeholder
              instead of pretending to be a working video.
            */}
            <video
              ref={videoRef}
              src="/demo.mp4"
              controls={playing}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: playing ? 'block' : 'none' }}
              onError={() => setVideoMissing(true)}
              onEnded={() => setPlaying(false)}
            />

            {!playing && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 16,
                background: 'radial-gradient(circle at 50% 40%, rgba(var(--accent-rgb), 0.15), transparent 60%)',
              }}>
                <button
                  onClick={handlePlay}
                  style={{
                    width: 76, height: 76, borderRadius: '50%', border: '2px solid var(--accent)',
                    background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 26,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ▶
                </button>
                {videoMissing ? (
                  <p style={{ fontSize: 13, color: 'var(--text-faint)', maxWidth: 340, textAlign: 'center', lineHeight: 1.5 }}>
                    No recording added yet — drop your demo video at{' '}
                    <code className="mono" style={{ background: 'var(--surface-alt)', padding: '2px 6px', borderRadius: 4 }}>
                      frontend/public/demo.mp4
                    </code>
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click to play</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}