import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '../ui/Button'
import NoteDisplay from '../audio/NoteDisplay'
import MicInput from '../audio/MicInput'
import PianoKeyboard from '../audio/PianoKeyboard'
import ScorePopup from './ScorePopup'
import { useAudio } from '../../hooks/useAudio'
import { usePitchDetection } from '../../hooks/usePitchDetection'
import {
  buildIdentifyOptionSet,
  centDeviation,
  hzToNote,
  parseNote,
} from '../../lib/noteUtils'
import {
  IDENTIFY_CHOICES,
  ROUND_TIME_LIMIT_MS,
  SINGING_CENTS_TOLERANCE,
  SINGING_HOLD_MS,
} from '../../lib/constants'
import type { NoteName, PracticeMode, RoundResult } from '../../types'

interface NoteChallengeProps {
  mode: PracticeMode
  target: NoteName
  /** Pool of notes available as distractors (already-unlocked notes). */
  pool: NoteName[]
  onResult: (result: RoundResult) => void
  /** Round identifier — paired with the parent's `key` prop to force remount. */
  roundKey: number
  /** When false, suppresses score/feedback popups (used in multiplayer). */
  showPopup?: boolean
}

export default function NoteChallenge({
  mode,
  target,
  pool,
  onResult,
  showPopup = true,
}: NoteChallengeProps) {
  const { playNote, playCorrect, playWrong } = useAudio()
  const pitch = usePitchDetection()

  const targetHz = useMemo(() => parseNote(target).hz, [target])
  const [hasPlayed, setHasPlayed] = useState(false)
  const [singing, setSinging] = useState(false)
  const [centsOff, setCentsOff] = useState<number | null>(null)
  const [detected, setDetected] = useState('')
  const [holdMs, setHoldMs] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [popup, setPopup] = useState<{ show: boolean; amount: number; variant: 'correct' | 'wrong'; message?: string }>({
    show: false,
    amount: 0,
    variant: 'correct',
  })
  const [lockedAnswer, setLockedAnswer] = useState<NoteName | null>(null)
  const [revealed, setRevealed] = useState(false)

  // Distractor options are computed once per mount via a lazy initializer
  // (the parent re-keys the component to remount each round, giving a fresh
  // shuffle). Lazy `useState` is the canonical place for impure setup work.
  const [identifyOptions] = useState<NoteName[]>(() => {
    if (mode !== 'identify') return []
    return buildIdentifyOptionSet(target, pool, IDENTIFY_CHOICES)
  })

  const [startTime] = useState<number>(() => Date.now())
  const holdAccumRef = useRef<number>(0)
  const lastTickRef = useRef<number>(0)
  const finishedRef = useRef(false)

  const finish = useCallback(
    (result: RoundResult) => {
      if (finishedRef.current) return
      finishedRef.current = true
      setRevealed(true)
      setFeedback(result.outcome === 'correct' ? 'correct' : 'wrong')
      const amount = result.outcome === 'correct' ? 10 : 0
      setPopup({
        show: true,
        amount,
        variant: result.outcome === 'correct' ? 'correct' : 'wrong',
        message:
          result.outcome === 'incorrect'
            ? result.skipped
              ? 'Skipped'
              : result.answer
                ? `That was ${result.answer.replace('#', '♯')}`
                : undefined
            : undefined,
      })
      if (result.outcome === 'correct') void playCorrect()
      else void playWrong()

      // Stop the mic so the next round starts cleanly.
      if (singing) pitch.stop()
      setSinging(false)

      window.setTimeout(() => {
        setPopup((p) => ({ ...p, show: false }))
        onResult(result)
      }, 1100)
    },
    [playCorrect, playWrong, onResult, pitch, singing],
  )

  // Singing mode — track pitch and accumulate hold time. setState is the
  // correct shape here: pitch.reading is an external audio stream and we need
  // to project it into UI-visible derivations (cents, detected note, hold ms).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (mode !== 'sing' || !singing) return
    const reading = pitch.reading
    const now = performance.now()
    const dt = lastTickRef.current === 0 ? 0 : now - lastTickRef.current
    lastTickRef.current = now

    if (!reading || reading.hz <= 0) {
      setCentsOff(null)
      setDetected('')
      holdAccumRef.current = Math.max(0, holdAccumRef.current - dt * 0.5)
      setHoldMs(holdAccumRef.current)
      return
    }

    const cents = centDeviation(reading.hz, targetHz)
    setCentsOff(cents)
    const detectedNote = hzToNote(reading.hz)
    setDetected(detectedNote)

    if (Math.abs(cents) <= SINGING_CENTS_TOLERANCE) {
      holdAccumRef.current += dt
    } else {
      holdAccumRef.current = Math.max(0, holdAccumRef.current - dt * 0.6)
    }
    setHoldMs(holdAccumRef.current)

    if (holdAccumRef.current >= SINGING_HOLD_MS) {
      finish({
        mode: 'sing',
        target,
        answer: hzToNote(reading.hz) || null,
        outcome: 'correct',
        timeMs: Date.now() - startTime,
        centsOff: cents,
      })
    }
  }, [mode, singing, pitch.reading, targetHz, target, finish, startTime])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Time-out failure for singing mode.
  useEffect(() => {
    if (mode !== 'sing' || !singing) return
    const id = window.setTimeout(() => {
      if (finishedRef.current) return
      finish({
        mode: 'sing',
        target,
        answer: detected ? (detected as NoteName) : null,
        outcome: 'incorrect',
        timeMs: Date.now() - startTime,
        centsOff: centsOff,
      })
    }, ROUND_TIME_LIMIT_MS)
    return () => clearTimeout(id)
  }, [mode, singing, finish, target, detected, centsOff, startTime])

  const handlePlayReference = useCallback(async () => {
    setHasPlayed(true)
    await playNote(target, 1.4)
  }, [playNote, target])

  const handleStartSinging = useCallback(async () => {
    if (singing) return
    holdAccumRef.current = 0
    lastTickRef.current = 0
    setHoldMs(0)
    setSinging(true)
    await pitch.start()
  }, [pitch, singing])

  const handleSkip = useCallback(() => {
    finish({
      mode,
      target,
      answer: null,
      outcome: 'incorrect',
      timeMs: Date.now() - startTime,
      centsOff: null,
      skipped: true,
    })
  }, [finish, mode, target, startTime])

  const handleIdentifyPick = useCallback(
    (pick: NoteName) => {
      if (lockedAnswer || finishedRef.current) return
      setLockedAnswer(pick)
      const correct = pick === target
      const cents = correct ? 0 : null
      finish({
        mode: 'identify',
        target,
        answer: pick,
        outcome: correct ? 'correct' : 'incorrect',
        timeMs: Date.now() - startTime,
        centsOff: cents,
      })
    },
    [finish, lockedAnswer, target, startTime],
  )

  // Identify mode: one automatic play shortly after the round opens (deps must not
  // include the whole useAudio() object — it changes every render and would replay
  // on every tip/state update from the parent).
  useEffect(() => {
    if (mode !== 'identify') return
    const id = window.setTimeout(() => {
      void playNote(target, 1.4)
      setHasPlayed(true)
    }, 350)
    return () => clearTimeout(id)
  }, [mode, target, playNote])

  return (
    <div className="relative flex w-full flex-col items-center gap-8">
      <ModeBadge mode={mode} />

      <NoteDisplay note={target} hidden={mode === 'identify' && !revealed} flash={feedback} />

      {showPopup && (
        <div
          className="flex min-h-[3rem] w-full max-w-lg shrink-0 items-center justify-center px-2 sm:min-h-[3.5rem]"
          aria-live="polite"
        >
          <ScorePopup
            show={popup.show}
            amount={popup.amount}
            variant={popup.variant}
            message={popup.message}
          />
        </div>
      )}

      {mode === 'sing' ? (
        <div className="flex w-full flex-col items-center gap-5">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary" onClick={handlePlayReference}>
              {hasPlayed ? 'Hear it again' : 'Hear the note'}
            </Button>
            <Button
              variant="primary"
              onClick={handleStartSinging}
              disabled={singing || !hasPlayed}
            >
              {singing ? 'Listening…' : 'Sing it'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSkip} disabled={revealed}>
              Skip
            </Button>
          </div>

          <MicInput
            state={pitch.state}
            reading={pitch.reading}
            centsOff={centsOff}
            detected={detected}
            holdProgress={Math.min(1, holdMs / SINGING_HOLD_MS)}
          />

          {pitch.state === 'denied' && (
            <p className="text-sm text-red-400">
              Mic access was denied. Enable it in your browser to use this mode.
            </p>
          )}
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-5">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary" onClick={handlePlayReference}>
              {hasPlayed ? 'Replay' : 'Play note'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSkip} disabled={revealed}>
              Skip
            </Button>
          </div>

          <PianoKeyboard
            options={identifyOptions}
            correctAnswer={revealed ? target : null}
            userPick={lockedAnswer}
            disabled={revealed}
            onPick={handleIdentifyPick}
          />
        </div>
      )}
    </div>
  )
}

function ModeBadge({ mode }: { mode: PracticeMode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="rounded-full border border-surface-700 bg-surface-800/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-400 backdrop-blur"
      >
        {mode === 'sing' ? '🎤 Sing the note' : '🎧 Name the note'}
      </motion.div>
    </AnimatePresence>
  )
}
