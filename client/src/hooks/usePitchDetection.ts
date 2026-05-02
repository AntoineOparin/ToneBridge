import { useCallback, useEffect, useRef, useState } from 'react'
import { PitchDetector } from 'pitchy'
import { PITCH_CLARITY_THRESHOLD } from '../lib/constants'

export type MicState = 'idle' | 'requesting' | 'ready' | 'listening' | 'denied' | 'error'

export interface PitchReading {
  hz: number
  clarity: number
  /** RMS-derived amplitude 0..1 for visualisations. */
  level: number
}

interface UsePitchDetectionResult {
  state: MicState
  reading: PitchReading | null
  start: () => Promise<void>
  stop: () => void
}

/**
 * Real-time pitch detection using the McLeod method via `pitchy`. The hook
 * handles `getUserMedia` permission, the AudioContext lifecycle, and a
 * requestAnimationFrame loop that publishes the latest pitch + clarity.
 */
export function usePitchDetection(): UsePitchDetectionResult {
  const [state, setState] = useState<MicState>('idle')
  const [reading, setReading] = useState<PitchReading | null>(null)

  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const detectorRef = useRef<ReturnType<typeof PitchDetector.forFloat32Array> | null>(null)
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)

  const stop = useCallback(() => {
    runningRef.current = false
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    sourceRef.current?.disconnect()
    analyserRef.current?.disconnect()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    void ctxRef.current?.close()
    sourceRef.current = null
    analyserRef.current = null
    streamRef.current = null
    ctxRef.current = null
    detectorRef.current = null
    bufferRef.current = null
    setReading(null)
    setState('idle')
  }, [])

  const start = useCallback(async () => {
    if (runningRef.current) return
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      streamRef.current = stream

      const AudioCtor: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtor()
      ctxRef.current = ctx

      const source = ctx.createMediaStreamSource(stream)
      sourceRef.current = source

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.1
      source.connect(analyser)
      analyserRef.current = analyser

      const buffer = new Float32Array(new ArrayBuffer(analyser.fftSize * 4))
      bufferRef.current = buffer

      detectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize)

      runningRef.current = true
      setState('listening')

      // Local self-referencing animation loop (avoids hook-in-hook lint rules).
      const loop = () => {
        if (!runningRef.current) return
        const a = analyserRef.current
        const d = detectorRef.current
        const b = bufferRef.current
        const c = ctxRef.current
        if (a && d && b && c) {
          a.getFloatTimeDomainData(b)

          let sumSquares = 0
          for (let i = 0; i < b.length; i++) sumSquares += b[i] * b[i]
          const rms = Math.sqrt(sumSquares / b.length)
          const level = Math.min(1, rms * 4)

          const [hz, clarity] = d.findPitch(b, c.sampleRate)
          if (clarity >= PITCH_CLARITY_THRESHOLD && hz > 30 && hz < 4000) {
            setReading({ hz, clarity, level })
          } else {
            setReading({ hz: 0, clarity, level })
          }
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    } catch (err) {
      const isPermission = err instanceof DOMException && err.name === 'NotAllowedError'
      setState(isPermission ? 'denied' : 'error')
      runningRef.current = false
    }
  }, [])

  useEffect(() => () => stop(), [stop])

  return { state, reading, start, stop }
}
