import { useCamera } from '../hooks/useCamera.js'
import AgentAvatar from './AgentAvatar.jsx'

export default function VideoCallPanel({
  candidateName,
  agentStage,
  agentName,
  agentRole,
  isAgentSpeaking,
  isListening,
  interimText,
  micSupported,
  sessionActive,
  onBeginVoice,
  onMuteToggle,
  hint,
}) {
  const { videoRef, status } = useCamera(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
      {/* Agent tile */}
      <div className="card" style={{ padding: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          On the panel
        </div>
        <div style={{ margin: '0 auto 14px', width: 84 }}>
          <AgentAvatar stage={agentStage} isSpeaking={isAgentSpeaking} size={84} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{agentName}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{agentRole}</div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4, height: 28 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 4, borderRadius: 2,
                background: isAgentSpeaking ? 'var(--accent)' : 'var(--border-light)',
                height: isAgentSpeaking ? undefined : 5,
                animation: isAgentSpeaking ? `wave-bar 0.9s ease-in-out infinite ${i * 0.08}s` : 'none',
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: isAgentSpeaking ? 'var(--accent)' : isListening ? 'var(--negative)' : 'var(--text-faint)', marginTop: 10 }}>
          {isAgentSpeaking ? 'Speaking…' : isListening ? 'Listening to you…' : sessionActive ? 'Muted' : 'Voice not started'}
        </div>
      </div>

      {/* Candidate camera tile */}
      <div className="card" style={{ padding: 14, position: 'relative' }}>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          You — {candidateName}
        </div>
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 10,
          background: '#05070b', overflow: 'hidden', border: `1px solid ${isListening ? 'var(--negative)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s ease',
        }}>
          {status === 'live' && (
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          )}
          {status !== 'live' && (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                {status === 'requesting' && 'Requesting camera…'}
                {status === 'denied' && 'Camera access denied'}
                {status === 'unsupported' && 'Camera not supported'}
              </div>
            </div>
          )}
          {isListening && (
            <div style={{
              position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(248,113,113,0.15)', border: '1px solid var(--negative)', borderRadius: 20, padding: '4px 10px',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--negative)', animation: 'pulse-ring 1.5s infinite' }} />
              <span style={{ fontSize: 11, color: 'var(--negative)' }}>LISTENING</span>
            </div>
          )}
        </div>

        <div style={{ minHeight: 18, marginTop: 8 }}>
          {interimText && (
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              "{interimText}"
            </div>
          )}
        </div>

        {!sessionActive ? (
          <button
            className="btn btn-primary"
            onClick={onBeginVoice}
            disabled={!micSupported}
            style={{ width: '100%', marginTop: 8, padding: '11px 0', fontSize: 13.5 }}
          >
            🎤 Start Voice Interview
          </button>
        ) : (
          <button
            className="btn"
            onClick={onMuteToggle}
            style={{
              width: '100%', marginTop: 8, fontSize: 12.5, padding: '9px 0',
              background: isListening ? 'var(--negative-dim)' : undefined,
              borderColor: isListening ? 'var(--negative)' : undefined,
              color: isListening ? 'var(--negative)' : undefined,
            }}
          >
            {isListening ? '🔇 Mute' : '🎤 Unmute'}
          </button>
        )}

        {!micSupported && (
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
            Voice needs Chrome or Edge. You can still type your answer below.
          </div>
        )}
        {micSupported && hint && (
          <div style={{ fontSize: 11.5, color: 'var(--warning)', marginTop: 6, lineHeight: 1.4 }}>
            ⚠ {hint}
          </div>
        )}
        {micSupported && !hint && !sessionActive && (
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
            One click starts the mic for the whole interview — no need to press it again between questions.
          </div>
        )}
        {micSupported && !hint && sessionActive && (
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
            The mic stays on for the whole interview — it just listens when it's your turn.
          </div>
        )}
      </div>

      <style>{`
        @keyframes wave-bar {
          0%, 100% { height: 6px; }
          50% { height: 26px; }
        }
      `}</style>
    </div>
  )
}