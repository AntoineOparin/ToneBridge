import { useCallback, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import type { NoteName } from '../types'

/**
 * Tone.js-backed note playback for reference and identify rounds. We use a
 * lightweight FM synth that sounds vaguely "bell + mallet" so notes are easy
 * to perceive against any background. The audio context is started lazily on
 * first user interaction to comply with browser autoplay rules.
 */
export function useAudio() {
  const synthRef = useRef<Tone.PolySynth | null>(null)

  useEffect(() => {
    const synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2.5,
      modulationIndex: 6,
      envelope: { attack: 0.005, decay: 0.4, sustain: 0.2, release: 1.2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.5 },
    }).toDestination()
    synth.volume.value = -8
    synthRef.current = synth
    return () => {
      synth.releaseAll()
      synth.dispose()
      synthRef.current = null
    }
  }, [])

  const ensureStarted = useCallback(async () => {
    if (Tone.getContext().state !== 'running') {
      await Tone.start()
    }
  }, [])

  /** Play a single sustained note for `durationSec` seconds. */
  const playNote = useCallback(
    async (note: NoteName, durationSec = 1.4) => {
      await ensureStarted()
      synthRef.current?.triggerAttackRelease(note, durationSec)
    },
    [ensureStarted],
  )

  /** Brief "correct" sparkle (a major triad arpeggio). */
  const playCorrect = useCallback(async () => {
    await ensureStarted()
    const now = Tone.now()
    synthRef.current?.triggerAttackRelease('C5', 0.15, now)
    synthRef.current?.triggerAttackRelease('E5', 0.15, now + 0.08)
    synthRef.current?.triggerAttackRelease('G5', 0.25, now + 0.16)
  }, [ensureStarted])

  /** Brief "wrong" buzz — a tritone tucked low. */
  const playWrong = useCallback(async () => {
    await ensureStarted()
    const now = Tone.now()
    synthRef.current?.triggerAttackRelease('B2', 0.2, now)
    synthRef.current?.triggerAttackRelease('F3', 0.3, now + 0.05)
  }, [ensureStarted])

  /** Triumphant chord stack used when a note is mastered. */
  const playMastered = useCallback(async () => {
    await ensureStarted()
    const now = Tone.now()
    synthRef.current?.triggerAttackRelease('C4', 1.4, now)
    synthRef.current?.triggerAttackRelease('E4', 1.4, now + 0.08)
    synthRef.current?.triggerAttackRelease('G4', 1.4, now + 0.16)
    synthRef.current?.triggerAttackRelease('C5', 1.6, now + 0.24)
  }, [ensureStarted])

  return { playNote, playCorrect, playWrong, playMastered, ensureStarted }
}
