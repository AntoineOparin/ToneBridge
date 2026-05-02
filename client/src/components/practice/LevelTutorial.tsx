import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../ui/Button'
import NoteDisplay from '../audio/NoteDisplay'
import { ForteAvatar } from '../character/Forte'
import { useAudio } from '../../hooks/useAudio'
import { prettyNote } from '../../lib/noteUtils'
import type { NoteName, PracticeLevel } from '../../types'

interface LevelTutorialProps {
  level: PracticeLevel
  onComplete: () => void
}

interface Step {
  kind: 'intro' | 'note' | 'outro'
  note?: NoteName
}

/**
 * First-time tutorial for a level: walks through each note in the level's
 * pool, plays it, and lets the user listen / sing / continue. Forte narrates.
 */
export default function LevelTutorial({ level, onComplete }: LevelTutorialProps) {
  const audio = useAudio()
  const steps: Step[] = [
    { kind: 'intro' },
    ...level.notes.map<Step>((n) => ({ kind: 'note', note: n })),
    { kind: 'outro' },
  ]
  const [stepIdx, setStepIdx] = useState(0)
  const step = steps[stepIdx]

  const advance = useCallback(() => {
    setStepIdx((i) => Math.min(i + 1, steps.length - 1))
  }, [steps.length])

  // Auto-play the note whenever the user lands on a note step.
  useEffect(() => {
    if (step.kind === 'note' && step.note) {
      const t = window.setTimeout(() => {
        void audio.playNote(step.note as NoteName, 1.4)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [stepIdx, step, audio])

  const isLast = stepIdx === steps.length - 1

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-surface-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-4 w-full max-w-3xl rounded-3xl border border-surface-700 bg-surface-900/95 p-8 shadow-2xl"
      >
        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIdx
                  ? 'w-8 bg-brand-400'
                  : i < stepIdx
                  ? 'w-3 bg-brand-600'
                  : 'w-3 bg-surface-700'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step.kind === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 inline-flex"><ForteAvatar mood="happy" size={88} /></div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">
                Level {level.id}
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-white">{level.title}</h2>
              <p className="mt-3 max-w-lg mx-auto text-surface-300">{level.description}</p>
              <p className="mt-4 max-w-md mx-auto text-sm text-surface-400">
                I'll play each note for you once. Listen carefully — try to picture where it sits in
                your voice.
              </p>
              <div className="mt-6 flex justify-center">
                <Button onClick={advance}>Let's begin</Button>
              </div>
            </motion.div>
          )}

          {step.kind === 'note' && step.note && (
            <NoteStep
              key={`note-${step.note}`}
              note={step.note}
              isNew={level.newNotes.includes(step.note)}
              onReplay={() => audio.playNote(step.note as NoteName, 1.4)}
              onNext={advance}
            />
          )}

          {step.kind === 'outro' && (
            <motion.div
              key="outro"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 inline-flex"><ForteAvatar mood="cheering" size={88} /></div>
              <h2 className="text-3xl font-black tracking-tight text-white">You've heard them all.</h2>
              <p className="mt-3 max-w-md mx-auto text-surface-300">
                Now I'll play any of these {level.notes.length} notes at random — sometimes you'll see
                multiple choices, sometimes you'll need to sing it back. Ready?
              </p>
              <div className="mt-6 flex justify-center">
                <Button onClick={onComplete}>Start practicing →</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip link (also serves as escape hatch) */}
        {!isLast && step.kind !== 'outro' && (
          <button
            onClick={onComplete}
            className="absolute right-4 top-4 text-xs font-semibold uppercase tracking-wider text-surface-500 transition-colors hover:text-surface-300"
          >
            Skip tutorial
          </button>
        )}
      </motion.div>
    </div>
  )
}

interface NoteStepProps {
  note: NoteName
  isNew: boolean
  onReplay: () => void
  onNext: () => void
}

function NoteStep({ note, isNew, onReplay, onNext }: NoteStepProps) {
  return (
    <motion.div
      key={`note-${note}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center"
    >
      {isNew && (
        <span className="mb-3 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-300">
          New note
        </span>
      )}
      <NoteDisplay note={note} />
      <p className="mt-5 max-w-md text-center text-surface-300">
        This is <span className="font-semibold text-brand-400">{prettyNote(note)}</span>. Listen,
        then hum it back to yourself before moving on.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" onClick={onReplay}>
          Hear it again
        </Button>
        <Button onClick={onNext}>Next →</Button>
      </div>
    </motion.div>
  )
}
