import { useEffect, useRef } from 'react'

export default function ChatPanel({ messages, onSend, disabled, isThinking, candidateName, placeholder }) {
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isThinking])

  const handleSubmit = (e) => {
    e.preventDefault()
    const val = inputRef.current.value.trim()
    if (!val || disabled) return
    onSend(val)
    inputRef.current.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        ref={scrollRef}
        className="scrollbar-thin"
        style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'candidate' ? 'flex-end' : 'flex-start',
              maxWidth: '72%',
              animation: 'fade-in-up 0.25s ease',
            }}
          >
            <div style={{
              fontSize: 11, color: 'var(--text-faint)', marginBottom: 5,
              textAlign: m.role === 'candidate' ? 'right' : 'left',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {m.role === 'candidate' ? candidateName : m.speaker}
            </div>
            <div style={{
              padding: '13px 16px',
              borderRadius: m.role === 'candidate' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
              background: m.role === 'candidate' ? 'var(--accent-dim)' : 'var(--surface-alt)',
              border: `1px solid ${m.role === 'candidate' ? 'rgba(79,209,197,0.25)' : 'var(--border)'}`,
              color: 'var(--text-primary)',
              fontSize: 14.5,
              lineHeight: 1.55,
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {isThinking && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '72%' }}>
            <div style={{ padding: '13px 16px', borderRadius: '14px 14px 14px 3px', background: 'var(--surface-alt)', border: '1px solid var(--border)', display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <span key={i} className="mono" style={{
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)',
                  animation: `blink-dot 1.4s infinite ${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, padding: '18px 32px', borderTop: '1px solid var(--border)' }}>
        <input
          ref={inputRef}
          placeholder={placeholder || (disabled ? 'Waiting for the panel…' : 'Type your answer…')}
          disabled={disabled}
          style={{
            flex: 1, background: 'var(--surface-alt)', border: '1px solid var(--border-light)',
            borderRadius: 8, padding: '13px 16px', color: 'var(--text-primary)', fontSize: 14.5,
            outline: 'none', fontFamily: 'var(--font-body)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
        />
        <button className="btn btn-primary" disabled={disabled} type="submit">Send</button>
      </form>
    </div>
  )
}
