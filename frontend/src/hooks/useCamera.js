import { useEffect, useRef, useState } from 'react'

export function useCamera(enabled) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | requesting | live | denied | unsupported

  useEffect(() => {
    if (!enabled) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      return
    }

    let cancelled = false
    setStatus('requesting')

    navigator.mediaDevices
      .getUserMedia({ video: { width: 480, height: 360 }, audio: false })
      .then(stream => {
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        setStatus('live')
      })
      .catch(() => setStatus('denied'))

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [enabled])

  // Assign srcObject only once the <video> element is actually mounted in
  // the DOM. Doing this inside the getUserMedia .then() above is a common
  // bug: if the <video> is conditionally rendered based on `status`, the
  // element doesn't exist yet at that point (status is still 'requesting'),
  // so the ref is null and the stream silently never gets attached.
  useEffect(() => {
    if (status === 'live' && videoRef.current && streamRef.current) {
      const video = videoRef.current
      video.srcObject = streamRef.current
      // The `autoplay` attribute alone is not reliably enough for a stream
      // assigned via JS after mount - some browsers just leave the frame
      // black until play() is called explicitly.
      const playPromise = video.play()
      if (playPromise?.catch) playPromise.catch(() => { /* ignore - browser will still render once ready */ })
    }
  }, [status])

  return { videoRef, status }
}