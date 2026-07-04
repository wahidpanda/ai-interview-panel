import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getState, sendMessage, finalizeInterview } from '../api/client.js'
import PanelRail from '../components/PanelRail.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import VideoCallPanel from '../components/VideoCallPanel.jsx'
import { useVoiceConversation } from '../hooks/useVoiceConversation.js'

const STAGE_LABEL = { hr: 'HR Round', technical: 'Technical Round', teamlead: 'Final Round' }
const STAGE_AGENT = {
  hr: { name: 'Kylie Jenner', role: 'HR Manager' },
  technical: { name: 'Lisa Chen', role: 'Project Manager' },
  teamlead: { name: 'Mark Rodriguez', role: 'Team Lead' },
}

export default function InterviewRoom() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState('')

  const handleSendRef = useRef(null)
  const voice = useVoiceConversation({
    onAnswer: (text) => handleSendRef.current?.(text),
  })
  // Always-current ref to the voice API - avoids the classic React trap
  // where a useCallback closure (handleSend) captures a stale copy of a
  // hook's return value from whenever it was last created, instead of
  // the actual latest one. Every speak() call below goes through this ref.
  const voiceRef = useRef(voice)
  useEffect(() => { voiceRef.current = voice })

  const hydrate = useCallback(async () => {
    try {
      const s = await getState(sessionId)
      setSession(s)
      if (s.stage === 'coding') {
        navigate(`/interview/${sessionId}/coding`)
        return
      }
      if (s.stage === 'completed') {
        navigate(`/interview/${sessionId}/results`)
        return
      }
      setMessages(s.chat[s.stage] || [])
    } catch {
      setError('Session not found. Start a new interview.')
    }
  }, [sessionId, navigate])

  useEffect(() => { hydrate() }, [hydrate])

  const handleSend = useCallback(async (text) => {
    if (!session) return
    voiceRef.current.muteMic()
    const stageAtSend = session.stage
    setMessages(prev => [...prev, { role: 'candidate', speaker: session.candidate_name, text }])
    setIsThinking(true)
    try {
      const res = await sendMessage(sessionId, text)
      setMessages(prev => [...prev, res.message])

      // Speak this reply immediately, right here, the moment it arrives -
      // no separate effect trying to infer "a new message showed up".
      await voiceRef.current.speakThenListen(res.message.text, stageAtSend)

      if (res.stage_complete) {
        const freshState = await getState(sessionId)
        setSession(freshState)

        if (res.next_stage === 'coding') {
          voiceRef.current.endSession()
          setTimeout(() => navigate(`/interview/${sessionId}/coding`), 600)
          return
        }
        if (res.next_stage === 'completed') {
          voiceRef.current.endSession()
          await finalizeInterview(sessionId)
          setTimeout(() => navigate(`/interview/${sessionId}/results`), 600)
          return
        }
        if (res.next_message) {
          setMessages([res.next_message])
          await voiceRef.current.speakThenListen(res.next_message.text, res.next_stage)
        }
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong talking to the panel.')
    } finally {
      setIsThinking(false)
    }
  }, [session, sessionId, navigate])

  useEffect(() => { handleSendRef.current = handleSend }, [handleSend])

  // The mic needs one real click before browsers will grant permission, but
  // speaking out loud doesn't - so clicking "enable mic" also immediately
  // speaks whatever question is already on screen, imperatively, right here.
  const handleBeginVoice = () => {
    voice.begin()
    const last = messages[messages.length - 1]
    if (last && last.role === 'agent' && session) {
      voice.speakThenListen(last.text, session.stage)
    }
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--negative)' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Back to start</button>
      </div>
    )
  }

  if (!session) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading interview…</div>
  }

  const agent = STAGE_AGENT[session.stage] || STAGE_AGENT.hr

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div style={{ flex: '0 0 260px', borderRight: '1px solid var(--border)', padding: '40px 28px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 44 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="mono" style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700 }}>AI</div>
          </div>
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>INTERVIEW PANEL</span>
        </div>
        <PanelRail currentStage={session.stage} scores={session.scores} />
      </div>

      <div style={{ flex: '0 0 300px', borderRight: '1px solid var(--border)', overflowY: 'auto' }} className="scrollbar-thin">
        <VideoCallPanel
          candidateName={session.candidate_name}
          agentStage={session.stage}
          agentName={agent.name}
          agentRole={agent.role}
          isAgentSpeaking={voice.isSpeaking}
          isListening={voice.isListening}
          interimText={voice.interimText}
          micSupported={voice.supported}
          sessionActive={voice.sessionActive}
          onBeginVoice={handleBeginVoice}
          onMuteToggle={() => (voice.isListening ? voice.muteMic() : voice.unmuteMic())}
          hint={voice.error ? `Voice input error (${voice.error}) — you can type your answer instead.` : ''}
          activityLog={voice.log}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '22px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              {STAGE_LABEL[session.stage]}
            </div>
            <h2 style={{ fontSize: 17 }}>{session.candidate_name}</h2>
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Session {sessionId}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            disabled={isThinking}
            isThinking={isThinking}
            candidateName={session.candidate_name}
            placeholder={voice.isListening ? 'Listening… speak your answer, or type here instead' : undefined}
          />
        </div>
      </div>
    </div>
  )
}