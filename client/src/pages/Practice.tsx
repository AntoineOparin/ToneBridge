import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import NoteChallenge from '../components/game/NoteChallenge'
import StreakCounter from '../components/game/StreakCounter'
import Forte from '../components/character/Forte'
import MasteryBridge from '../components/bridge/MasteryBridge'
import { useStore } from '../store/useStore'
import { useTipBot } from '../hooks/useTipBot'
import {
  CURRICULUM,
  MASTERY_THRESHOLD,
} from '../lib/constants'
import {
  currentFocusNote,
  isMastered,
  nextFocusNote,
  unlockedNotes,
} from '../lib/curriculum'
import { classifyMiss, prettyNote } from '../lib/noteUtils'
import type { PracticeMode, RoundResult } from '../types'

export default function Practice() {
  const practice = useStore((s) => s.practice)
  const recordCorrect = useStore((s) => s.recordCorrect)
  const recordIncorrect = useStore((s) => s.recordIncorrect)
  const advanceFocus = useStore((s) => s.advanceFocus)

  const tipBot = useTipBot()

  const focus = currentFocusNote(practice)
  const next = nextFocusNote(practice)
  const focusProgress = practice.notes[focus]
  const masteryPct = Math.round((focusProgress.mastery / MASTERY_THRESHOLD) * 100)

  const pool = useMemo(() => unlockedNotes(practice), [practice])

  const [mode, setMode] = useState<PracticeMode>('identify')
  const [roundKey, setRoundKey] = useState(0)
  const [pendingMastery, setPendingMastery] = useState<{ from: typeof focus; to: typeof next } | null>(null)
  const introducedFocusRef = useRef<typeof focus | null>(null)
  const firstCorrectShownRef = useRef(false)

  // Greet the user / introduce a new lesson when the focus note changes.
  useEffect(() => {
    if (introducedFocusRef.current !== focus) {
      introducedFocusRef.current = focus
      tipBot.showContext('lesson-start', { note: focus })
    }
  }, [focus, tipBot])

  const pickNextMode = useCallback((): PracticeMode => {
    // Identify mode is gentler; bias toward it early on, then alternate.
    const correctSoFar = focusProgress.correct
    if (correctSoFar < 2) return 'identify'
    return Math.random() < 0.55 ? 'identify' : 'sing'
  }, [focusProgress.correct])

  const advanceRound = useCallback(() => {
    setMode(pickNextMode())
    setRoundKey((k) => k + 1)
  }, [pickNextMode])

  const handleResult = useCallback(
    (result: RoundResult) => {
      if (result.outcome === 'correct') {
        const mastered = recordCorrect(result.target)
        if (!firstCorrectShownRef.current) {
          firstCorrectShownRef.current = true
          tipBot.showContext('first-correct')
        }
        if (mastered) {
          tipBot.showContext('mastered', { note: result.target })
          setPendingMastery({ from: result.target, to: next })
          return
        }
      } else {
        const miss = classifyMiss(result.target, result.answer, result.centsOff)
        recordIncorrect(result.target, miss)
        const recent = [...practice.notes[result.target].recentMisses, miss].slice(-6)
        tipBot.reportMiss(result.target, miss, recent)
      }
      advanceRound()
    },
    [recordCorrect, recordIncorrect, tipBot, next, practice.notes, advanceRound],
  )

  const handleMasteryComplete = useCallback(() => {
    setPendingMastery(null)
    advanceFocus()
    firstCorrectShownRef.current = false
    // Start the next lesson with identify mode (gentler intro to a new note).
    setMode('identify')
    setRoundKey((k) => k + 1)
  }, [advanceFocus])

  const allDone = practice.focusIndex >= CURRICULUM.length - 1 && isMastered(focusProgress) && !pendingMastery

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-900 text-white">
      {/* Background gradient + glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-950 to-transparent" />

      {/* Top nav */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6">
        <Link to="/home" className="text-2xl font-bold tracking-tight text-brand-400">
          ToneBridge
        </Link>
        <div className="flex items-center gap-3">
          <StreakCounter streak={practice.streak} sessionXp={practice.sessionXp} />
          <Link
            to="/home"
            className="rounded-lg border border-surface-700 px-4 py-2 text-sm font-semibold text-surface-300 transition-colors hover:border-surface-600 hover:text-white"
          >
            Exit
          </Link>
        </div>
      </header>

      {/* Lesson header */}
      <section className="relative z-10 mx-auto max-w-5xl px-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">
            Lesson {practice.focusIndex + 1} of {CURRICULUM.length}
          </span>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Master <span className="text-brand-400">{prettyNote(focus)}</span>
          </h1>
          <div className="w-full max-w-md">
            <div className="h-2 overflow-hidden rounded-full bg-surface-800">
              <motion.div
                animate={{ width: `${masteryPct}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-surface-400">
              <span>{masteryPct}% mastered</span>
              <span>
                {focusProgress.correct} ✓ · {focusProgress.incorrect} ✗
              </span>
            </div>
          </div>
        </div>

        {/* Lesson tiles row — shows the curriculum and which notes are mastered */}
        <CurriculumStrip />
      </section>

      {/* Round area */}
      <main className="relative z-10 mx-auto mt-8 flex max-w-5xl flex-col items-center justify-center px-8 pb-24">
        {!allDone ? (
          <NoteChallenge
            key={`${focus}-${roundKey}`}
            mode={mode}
            target={focus}
            pool={pool}
            roundKey={roundKey}
            onResult={handleResult}
          />
        ) : (
          <AllDone />
        )}
      </main>

      {/* Mastery overlay */}
      <AnimatePresence>
        {pendingMastery && (
          <MasteryBridge
            fromNote={pendingMastery.from}
            toNote={pendingMastery.to}
            onComplete={handleMasteryComplete}
          />
        )}
      </AnimatePresence>

      {/* Mascot */}
      <Forte
        tip={tipBot.tip}
        mood={pendingMastery ? 'cheering' : focusProgress.incorrect > focusProgress.correct ? 'concerned' : 'happy'}
      />
    </div>
  )
}

function CurriculumStrip() {
  const practice = useStore((s) => s.practice)
  const focus = currentFocusNote(practice)

  return (
    <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
      {CURRICULUM.map((note, i) => {
        const p = practice.notes[note]
        const mastered = isMastered(p)
        const isFocus = note === focus
        const cls = mastered
          ? 'border-brand-500 bg-brand-500/15 text-brand-300'
          : isFocus
          ? 'border-brand-500 bg-surface-800 text-white animate-pulse'
          : i < practice.focusIndex
          ? 'border-surface-700 bg-surface-800 text-surface-300'
          : 'border-surface-800 bg-surface-900/60 text-surface-500'
        return (
          <div
            key={note}
            className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl border-2 text-sm font-bold transition-colors ${cls}`}
            title={note}
          >
            <span>{prettyNote(note).slice(0, -1)}</span>
            <span className="text-[9px] font-medium opacity-70">{prettyNote(note).slice(-1)}</span>
          </div>
        )
      })}
    </div>
  )
}

function AllDone() {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-black tracking-tight">All bridges built</h2>
      <p className="mt-3 max-w-md text-surface-300">
        You've mastered every note in the C major octave. Take a breath, then come back to keep your
        ear sharp — sharps and flats are coming next.
      </p>
      <Link
        to="/home"
        className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-3 font-bold text-white shadow-lg shadow-brand-500/25"
      >
        Back to home
      </Link>
    </div>
  )
}
