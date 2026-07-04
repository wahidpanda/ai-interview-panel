import { useCallback, useEffect, useRef, useState } from 'react'

const SpeechRecognitionAPI =
  typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

const SILENCE_TIMEOUT_MS = 4800
const STAGE_VOICE = {
  hr: { pitch: 1.15, rate: 1.0 },
  technical: { pitch: 1.05, rate: 1.02 },
  teamlead: { pitch: 0.82, rate: 0.96 },
}

/**
 * One continuous voice session for the whole interview, instead of
 * restarting the mic every turn. `begin()` is called exactly once, from a
 * real click - that's the only user gesture the browser ever needs. After
 * that, the mic is muted while the agent talks and unmuted while it's the
 * candidate's turn, entirely in software - the underlying recognition
 * engine itself just keeps running, so there's no repeated start() call
 * that could get silently blocked.
 */
export function useVoiceConversation({ onAnswer }) {
  const recognitionRef = useRef(null)
  const sessionActiveRef = useRef(false)
  const mutedRef = useRef(true)
  const transcriptRef = useRef('')
  const interimRef = useRef('')
  const silenceTimerRef = useRef(null)
  const onAnswerRef = useRef(onAnswer)
  useEffect(() => { onAnswerRef.current = onAnswer }, [onAnswer])

  const [sessionActive, setSessionActive] = useState(false)
  const [isListening, setIsListening] = useState(false) // unmuted & actively capturing
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState(null)
  const [log, setLog] = useState([])
  const supported = !!SpeechRecognitionAPI

  const pushLog = useCallback((msg) => {
    const time = new Date().toLocaleTimeString([], { hour12: false })
    setLog(prev => [...prev.slice(-9), `${time}  ${msg}`])
  }, [])

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      const finalText = (transcriptRef.current || interimRef.current || '').trim()
      transcriptRef.current = ''
      interimRef.current = ''
      setInterimText('')
      if (finalText) {
        mutedRef.current = true
        setIsListening(false)
        pushLog(`✅ captured: "${finalText.slice(0, 60)}${finalText.length > 60 ? '…' : ''}"`)
        onAnswerRef.current?.(finalText)
      } else {
        pushLog('⚠ silence timeout fired but nothing was captured')
      }
    }, SILENCE_TIMEOUT_MS)
  }, [pushLog])

  // Create the recognition engine once and keep it alive for the whole
  // session, restarting it automatically if the browser cuts it off on
  // its own (common after long continuous listening / network hiccups).
  useEffect(() => {
    if (!supported) return
    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      if (mutedRef.current) return // agent's turn - ignore any stray audio
      let finalChunk = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) finalChunk += chunk
        else interim += chunk
      }
      if (finalChunk) {
        transcriptRef.current = (transcriptRef.current ? transcriptRef.current + ' ' : '') + finalChunk.trim()
        interimRef.current = ''
      } else if (interim) {
        interimRef.current = interim
      }
      if (finalChunk || interim) {
        // Show the FULL running answer so far (captured + in-progress), not
        // just the latest fragment - otherwise the caption looks stale or
        // wrong mid-sentence, and there's no way to see what's actually
        // been captured cumulatively.
        setInterimText((transcriptRef.current + ' ' + interimRef.current).trim())
        setError(null)
        armSilenceTimer()
      }
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(event.error)
        pushLog(`✗ mic error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      // If we didn't deliberately end the session, the browser stopped it
      // on its own - restart immediately so the conversation keeps flowing
      // without the candidate needing to click anything.
      if (sessionActiveRef.current) {
        pushLog('↻ mic engine stopped itself, restarting…')
        try { recognition.start() } catch { pushLog('✗ mic restart failed') }
      }
    }

    recognitionRef.current = recognition
    return () => {
      sessionActiveRef.current = false
      clearSilenceTimer()
      try { recognition.stop() } catch { /* noop */ }
    }
  }, [supported, armSilenceTimer, pushLog])

  /** Call once, from a real click, to turn the mic on for the whole interview. */
  const begin = useCallback(() => {
    if (!recognitionRef.current || sessionActiveRef.current) return
    sessionActiveRef.current = true
    setSessionActive(true)
    mutedRef.current = true // starts muted; caller unmutes after speaking the first question
    pushLog('🎙 voice session started')
    try {
      recognitionRef.current.start()
    } catch {
      pushLog('✗ mic engine failed to start')
    }
  }, [pushLog])

  const endSession = useCallback(() => {
    sessionActiveRef.current = false
    setSessionActive(false)
    mutedRef.current = true
    setIsListening(false)
    clearSilenceTimer()
    try { recognitionRef.current?.stop() } catch { /* noop */ }
  }, [])

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

  /** Speaks the agent's line, then unmutes the mic to capture the candidate's reply. */
  const speakThenListen = useCallback((text, stage) => {
    mutedRef.current = true
    setIsListening(false)
    transcriptRef.current = ''
    interimRef.current = ''
    setInterimText('')
    pushLog(`🔊 speaking (${stage}): "${text.slice(0, 40)}${text.length > 40 ? '…' : ''}"`)

    return new Promise((resolve) => {
      const unmuteAndResolve = () => {
        setIsSpeaking(false)
        if (sessionActiveRef.current) {
          mutedRef.current = false
          setIsListening(true)
          pushLog('🎤 unmuted, listening for your answer')
          // Some browsers need the engine actively running to accept audio;
          // if it stopped for any reason, nudge it back on.
          try { recognitionRef.current?.start() } catch { /* already running */ }
        }
        resolve()
      }

      if (!synth) { pushLog('✗ this browser has no speech synthesis at all'); unmuteAndResolve(); return }
      if (!text) { unmuteAndResolve(); return }

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
        const finish = (why) => {
          if (done) return
          done = true
          pushLog(started ? `✓ finished speaking (${why})` : `✗ never actually spoke (${why}) - browser stayed silent`)
          unmuteAndResolve()
        }

        utterance.onstart = () => { started = true; setIsSpeaking(true) }
        utterance.onend = () => finish('onend')
        utterance.onerror = () => finish('onerror')
        synth.speak(utterance)

        // Chrome occasionally swallows speak() silently (a long-standing
        // bug, worse the more utterances a page has queued over time). If
        // nothing happened after a beat, try once more with the default
        // voice before giving up and just moving on.
        setTimeout(() => {
          if (done || started) return
          if (useVoice) {
            pushLog('↻ no audio yet, retrying with default voice…')
            try { synth.cancel() } catch { /* noop */ }
            speakAttempt(false)
          } else {
            finish('retry also silent, giving up')
          }
        }, 700)

        setTimeout(() => finish('safety timeout'), Math.max(4500, text.length * 90))
      }

      // Only cancel if something is actually in-flight - calling cancel()
      // when nothing is queued is itself a common trigger for Chrome's
      // speech engine getting stuck silent for the rest of the session.
      if (synth.speaking || synth.pending) {
        synth.cancel()
        setTimeout(() => speakAttempt(true), 150)
      } else {
        speakAttempt(true)
      }
    })
  }, [pushLog])

  const muteMic = useCallback(() => {
    mutedRef.current = true
    setIsListening(false)
    transcriptRef.current = ''
    interimRef.current = ''
    setInterimText('')
    clearSilenceTimer()
  }, [])

  const unmuteMic = useCallback(() => {
    if (!sessionActiveRef.current) return
    transcriptRef.current = ''
    interimRef.current = ''
    setInterimText('')
    mutedRef.current = false
    setIsListening(true)
    try { recognitionRef.current?.start() } catch { /* already running */ }
  }, [])

  return {
    supported,
    sessionActive,
    isListening,
    isSpeaking,
    interimText,
    error,
    log,
    begin,
    endSession,
    speakThenListen,
    muteMic,
    unmuteMic,
  }
}