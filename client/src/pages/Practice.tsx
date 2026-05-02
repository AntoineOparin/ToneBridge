import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import NoteChallenge from '../components/game/NoteChallenge'
import StreakCounter from '../components/game/StreakCounter'
import Forte from '../components/character/Forte'
import MasteryBridge from '../components/bridge/MasteryBridge'
import BridgeProgress from '../components/bridge/BridgeProgress'
import LevelTutorial from '../components/practice/LevelTutorial'
import { useStore } from '../store/useStore'
import { useTipBot } from '../hooks/useTipBot'
import {
  currentLevel,
  hasSeenTutorial,
  levelProgressPct,
  nextLevel,
  pickTarget,
} from '../lib/curriculum'
import { MAX_LEVEL } from '../lib/constants'
import { classifyMiss, prettyNote } from '../lib/noteUtils'
import type { NoteName, PracticeMode, RoundResult } from '../types'

type Phase = 'tutorial' | 'practice' | 'level-up'

export default function Practice() {
  const practice = useStore((s) => s.practice)
  const recordCorrect = useStore((s) => s.recordCorrect)
  const recordIncorrect = useStore((s) => s.recordIncorrect)
  const advanceLevel = useStore((s) => s.advanceLevel)
  const markTutorialComplete = useStore((s) => s.markTutorialComplete)

  const tipBot = useTipBot()

  const level = currentLevel(practice)
  const next = nextLevel(practice)
  const pct = levelProgressPct(practice)

  // Phase machine — tutorial first time per level, then practice, then level-up.
  const [phase, setPhase] = useState<Phase>(
    hasSeenTutorial(practice, practice.level) ? 'practice' : 'tutorial',
  )
  const [pendingLevelUp, setPendingLevelUp] = useState<{
    fromLevel: number
    fromTitle: string
    toLevel: number | null
    toTitle: string | null
    newNotes: NoteName[]
  } | null>(null)

  // Random target for the current round, chosen once per round.
  const [target, setTarget] = useState<NoteName | null>(null)
  const [mode, setMode] = useState<PracticeMode>('identify')
  const [roundKey, setRoundKey] = useState(0)
  const previousTargetRef = useRef<NoteName | null>(null)
  const introducedLevelRef = useRef<number | null>(null)
  const firstCorrectShownRef = useRef(false)

  const pickNextRound = useCallback(() => {
    const t = pickTarget(practice, previousTargetRef.current)
    previousTargetRef.current = t
    setTarget(t)
    // Identify mode is gentler — bias toward it early in a level.
    const correctSoFar = practice.notes[t]?.correct ?? 0
    const newMode: PracticeMode = correctSoFar < 1 ? 'identify' : Math.random() < 0.55 ? 'identify' : 'sing'
    setMode(newMode)
    setRoundKey((k) => k + 1)
  }, [practice])

  // Greet the user when they arrive in the practice phase for a level.
  useEffect(() => {
    if (phase !== 'practice') return
    if (introducedLevelRef.current !== level.id) {
      introducedLevelRef.current = level.id
      tipBot.showContext('lesson-start', { note: level.notes[0] })
    }
    if (!target) pickNextRound()
  }, [phase, level.id, level.notes, target, tipBot, pickNextRound])

  const handleResult = useCallback(
    (result: RoundResult) => {
      if (result.outcome === 'correct') {
        const cleared = recordCorrect(result.target)
        if (!firstCorrectShownRef.current) {
          firstCorrectShownRef.current = true
          tipBot.showContext('first-correct')
        }
        if (cleared) {
          tipBot.showContext('level-up')
          setPendingLevelUp({
            fromLevel: level.id,
            fromTitle: level.title,
            toLevel: next?.id ?? null,
            toTitle: next?.title ?? null,
            newNotes: next?.newNotes ?? [],
          })
          setPhase('level-up')
          return
        }
      } else {
        const miss = classifyMiss(result.target, result.answer, result.centsOff)
        recordIncorrect(result.target, miss)
        const recent = [...(practice.notes[result.target]?.recentMisses ?? []), miss].slice(-6)
        tipBot.reportMiss(result.target, miss, recent)
      }
      pickNextRound()
    },
    [recordCorrect, recordIncorrect, tipBot, level, next, practice.notes, pickNextRound],
  )

  const handleTutorialComplete = useCallback(() => {
    markTutorialComplete(level.id)
    setPhase('practice')
  }, [markTutorialComplete, level.id])

  const handleLevelUpComplete = useCallback(() => {
    setPendingLevelUp(null)
    advanceLevel()
    firstCorrectShownRef.current = false
    previousTargetRef.current = null
    setTarget(null)

    // If the next level has a tutorial, show it; otherwise jump back into practice.
    const newLevelId = level.id + 1
    if (newLevelId <= MAX_LEVEL && !hasSeenTutorial(practice, newLevelId)) {
      setPhase('tutorial')
    } else {
      setPhase('practice')
    }
  }, [advanceLevel, level.id, practice])

  const allDone = practice.level >= MAX_LEVEL && pct >= 100 && phase !== 'level-up'

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-950 to-transparent" />

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

      {/* Lesson header — always visible during practice */}
      {phase === 'practice' && (
        <section className="relative z-10 mx-auto max-w-5xl px-8">
          <div className="mb-6 flex flex-col items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">
              Level {level.id} of {MAX_LEVEL}
            </span>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              {level.title}
            </h1>
            <BridgeProgress
              progress={pct}
              fromLevel={level.id}
              toLevel={next?.id ?? null}
              className="max-w-md"
            />
          </div>

          <NotePool notes={level.notes} />
        </section>
      )}

      {/* Round area — wrapped in pb-32 so Forte's tip toast at the top
          doesn't visually crowd the content area. */}
      <main className="relative z-10 mx-auto mt-8 flex max-w-5xl flex-col items-center justify-center px-8 pb-32">
        {phase === 'practice' && target && !allDone && (
          <NoteChallenge
            key={`${target}-${roundKey}`}
            mode={mode}
            target={target}
            pool={level.notes}
            roundKey={roundKey}
            onResult={handleResult}
          />
        )}
        {allDone && <AllDone />}
      </main>

      {/* Tutorial overlay */}
      <AnimatePresence>
        {phase === 'tutorial' && (
          <LevelTutorial level={level} onComplete={handleTutorialComplete} />
        )}
      </AnimatePresence>

      {/* Level-up overlay */}
      <AnimatePresence>
        {phase === 'level-up' && pendingLevelUp && (
          <MasteryBridge
            fromLevel={pendingLevelUp.fromLevel}
            fromTitle={pendingLevelUp.fromTitle}
            toLevel={pendingLevelUp.toLevel}
            toTitle={pendingLevelUp.toTitle}
            newNotes={pendingLevelUp.newNotes}
            onComplete={handleLevelUpComplete}
          />
        )}
      </AnimatePresence>

      {/* Mascot — top-of-page toast (non-blocking) + small avatar bottom-right */}
      <Forte
        tip={phase === 'practice' ? tipBot.tip : null}
        onDismiss={tipBot.clear}
        mood={resolveMood(phase, target, practice)}
      />
    </div>
  )
}

function resolveMood(
  phase: Phase,
  target: NoteName | null,
  practice: { notes: PracticeProgressNotes },
): 'happy' | 'concerned' | 'cheering' {
  if (phase === 'level-up') return 'cheering'
  if (target) {
    const stats = practice.notes[target]
    if (stats && stats.incorrect > stats.correct) return 'concerned'
  }
  return 'happy'
}

type PracticeProgressNotes = ReturnType<typeof useStore.getState>['practice']['notes']

function NotePool({ notes }: { notes: NoteName[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 py-2">
      {notes.map((note) => (
        <div
          key={note}
          className="flex h-9 w-9 flex-col items-center justify-center rounded-lg border border-surface-700 bg-surface-800/60 text-[11px] font-bold text-surface-200"
          title={note}
        >
          <span>{prettyNote(note).slice(0, -1)}</span>
        </div>
      ))}
    </div>
  )
}

function AllDone() {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-black tracking-tight">Every bridge built.</h2>
      <p className="mt-3 max-w-md text-surface-300">
        You've cleared the full chromatic curriculum. Keep your ear sharp with Multiplayer, or come
        back tomorrow for your daily challenge.
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
