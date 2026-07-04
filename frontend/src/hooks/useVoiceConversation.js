import { useCallback, useEffect, useRef, useState } from 'react'
import { transcribeAudio } from '../api/client.js'

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
const STAGE_VOICE = {
  hr: { pitch: 1.15, rate: 1.0 },
  technical: { pitch: 1.05, rate: 1.02 },
  teamlead: { pitch: 0.82, rate: 0.96 },
}

const SILENCE_MS = 2200               // stop recording after this much quiet, once you've started talking
const MAX_WAIT_FOR_SPEECH_MS = 20000  // give up if nothing is said at all
const MAX_RECORDING_MS = 60000        // hard safety cap
const SILENCE_RMS_THRESHOLD = 0.02    // volume level below which audio counts as "quiet"

/**
 * Records the candidate's answer with MediaRecorder and transcribes it via
 * Groq's free Whisper API - far more accurate and broadly-supported than
 * the browser's built-in SpeechRecognition (which only works reliably in
 * Chrome/Edge, depends on Google's cloud service being reachable, and has
 * been the main source of dropped/garbled answers in this app).
 *
 * One click (begin()) grants mic access for the whole interview, same as
 * before - after that everything runs on the one persistent audio stream,
 * no repeated permission prompts.
 */
export function useVoiceConversation({ onAnswer }) {
  const streamRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const rafRef = useRef(null)
  const sessionActiveRef = useRef(false)
  const recordingRef = useRef(false)
  const onAnswerRef = useRef(onAnswer)
  useEffect(() => { onAnswerRef.current = onAnswer }, [onAnswer])

  const [sessionActive, setSessionActive] = useState(false)
  const [isListening, setIsListening] = useState(false)   // actively recording the candidate
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState(null)
  const [log, setLog] = useState([])

  const supported = typeof window !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && typeof window.MediaRecorder !== 'undefined'

  const pushLog = useCallback((msg) => {
    const time = new Date().toLocaleTimeString([], { hour12: false })
    setLog(prev => [...prev.slice(-9), `${time}  ${msg}`])
  }, [])

  const stopSilenceWatch = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  // ---------- Recording (candidate's turn) ----------

  const stopRecording = useCallback(() => {
    stopSilenceWatch()
    if (recordingRef.current && recorderRef.current?.state !== 'inactive') {
      try { recorderRef.current.stop() } catch { /* already stopped */ }
    }
    recordingRef.current = false
    setIsListening(false)
  }, [])

  const startRecording = useCallback(() => {
    if (!sessionActiveRef.current || !streamRef.current || recordingRef.current) return

    const recorder = new MediaRecorder(streamRef.current)
    chunksRef.current = []
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      if (blob.size < 800) {
        pushLog('⚠ no audio captured — click "Speak Now" or type your answer')
        return
      }
      setIsTranscribing(true)
      pushLog('📤 transcribing your answer (Whisper)…')
      try {
        const text = await transcribeAudio(blob)
        if (text) {
          pushLog(`✅ heard: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`)
          onAnswerRef.current?.(text)
        } else {
          pushLog('⚠ got an empty transcription — try again or type your answer')
        }
      } catch (err) {
        const detail = err?.response?.data?.detail || err.message
        pushLog(`✗ transcription failed: ${detail}`)
        setError('transcription-failed')
      } finally {
        setIsTranscribing(false)
      }
    }

    recorder.start()
    recorderRef.current = recorder
    recordingRef.current = true
    setIsListening(true)
    pushLog('🎤 recording your answer…')
    watchForSilence()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushLog])

  const watchForSilence = () => {
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Uint8Array(analyser.fftSize)
    const startedAt = Date.now()
    let hasSpoken = false
    let silenceSince = null

    const tick = () => {
      if (!recordingRef.current) return
      analyser.getByteTimeDomainData(data)

      let sumSquares = 0
      for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128
        sumSquares += normalized * normalized
      }
      const rms = Math.sqrt(sumSquares / data.length)
      const now = Date.now()

      if (rms > SILENCE_RMS_THRESHOLD) {
        hasSpoken = true
        silenceSince = null
      } else if (hasSpoken) {
        if (silenceSince === null) silenceSince = now
        else if (now - silenceSince > SILENCE_MS) {
          stopRecording()
          return
        }
      }

      if (!hasSpoken && now - startedAt > MAX_WAIT_FOR_SPEECH_MS) {
        pushLog('⚠ no speech detected — click "Speak Now" and try again, or type your answer')
        stopRecording()
        return
      }
      if (now - startedAt > MAX_RECORDING_MS) {
        stopRecording()
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  // ---------- Session lifecycle ----------

  /** Call once, from a real click, to grant mic access for the whole interview. */
  const begin = useCallback(async () => {
    if (sessionActiveRef.current) return
    if (!supported) {
      setError('unsupported')
      pushLog('✗ this browser does not support audio recording')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioCtx()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      audioCtxRef.current = audioCtx
      analyserRef.current = analyser

      sessionActiveRef.current = true
      setSessionActive(true)
      setError(null)
      pushLog('🎙 voice session started — transcribing via Groq Whisper')
    } catch {
      setError('mic-denied')
      pushLog('✗ microphone access was denied or unavailable')
    }
  }, [supported, pushLog])

  const endSession = useCallback(() => {
    sessionActiveRef.current = false
    setSessionActive(false)
    stopRecording()
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    analyserRef.current = null
    synth?.cancel()
  }, [stopRecording])

  useEffect(() => () => endSession(), []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Speaking (agent's turn) ----------

  const voicesRef = useRef([])
  useEffect(() => {
    if (!synth) return
    const load = () => { voicesRef.current = synth.getVoices() }
    load()
    synth.addEventListener('voiceschanged', load)
    return () => synth.removeEventListener('voiceschanged', load)
  }, [])

  const pickVoice = (stage) => {
    const pool = voicesRef.current.filter(v => v.lang?.startsWith('en'))
    const list = pool.length ? pool : voicesRef.current
    if (!list.length) return null
    let hash = 0
    for (const ch of stage) hash = (hash * 31 + ch.charCodeAt(0)) % list.length
    return list[hash] || list[0]
  }

  /** Speaks the agent's line, then starts recording the candidate's reply. */
  const speakThenListen = useCallback((text, stage) => {
    return new Promise((resolve) => {
      const afterSpeaking = () => {
        setIsSpeaking(false)
        if (sessionActiveRef.current) startRecording()
        resolve()
      }

      if (!synth || !text) { afterSpeaking(); return }
      synth.cancel()

      const speakAttempt = (useVoice) => {
        const utterance = new SpeechSynthesisUtterance(text)
        if (useVoice) {
          const voice = pickVoice(stage)
          if (voice) utterance.voice = voice
        }
        const cfg = STAGE_VOICE[stage] || { pitch: 1.0, rate: 1.0 }
        utterance.pitch = cfg.pitch
        utterance.rate = cfg.rate

        let started = false
        let done = false
        const finish = () => { if (done) return; done = true; afterSpeaking() }

        utterance.onstart = () => { started = true; setIsSpeaking(true) }
        utterance.onend = finish
        utterance.onerror = finish
        synth.speak(utterance)

        setTimeout(() => {
          if (done || started) return
          if (useVoice) { try { synth.cancel() } catch { /* noop */ } speakAttempt(false) }
          else finish()
        }, 900)
        setTimeout(finish, Math.max(4500, text.length * 90))
      }

      if (synth.speaking || synth.pending) {
        synth.cancel()
        setTimeout(() => speakAttempt(true), 150)
      } else {
        speakAttempt(true)
      }
    })
  }, [])

  // ---------- Manual overrides ----------

  const muteMic = useCallback(() => {
    stopRecording()
  }, [stopRecording])

  const unmuteMic = useCallback(() => {
    startRecording()
  }, [startRecording])

  return {
    supported,
    sessionActive,
    isListening,
    isTranscribing,
    isSpeaking,
    error,
    log,
    begin,
    endSession,
    speakThenListen,
    muteMic,
    unmuteMic,
  }
}
