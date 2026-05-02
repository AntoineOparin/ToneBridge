import { motion } from 'framer-motion'
import { prettyNote } from '../../lib/noteUtils'
import type { NoteName } from '../../types'

interface PianoKeyboardProps {
  options: NoteName[]
  /** When set, options become non-interactive and `correctAnswer` lights up. */
  correctAnswer?: NoteName | null
  /** The user's most recent pick (for showing wrong-answer feedback). */
  userPick?: NoteName | null
  disabled?: boolean
  onPick: (note: NoteName) => void
}

/**
 * A row of large note tiles used as the multiple-choice answer set in
 * the identify-the-note mode. Visually evokes piano keys but stays accessible
 * (each is a real button with the note name).
 */
export default function PianoKeyboard({
  options,
  correctAnswer = null,
  userPick = null,
  disabled = false,
  onPick,
}: PianoKeyboardProps) {
  return (
    <div className="flex w-full max-w-2xl flex-wrap justify-center gap-3">
      {options.map((note) => {
        const isCorrect = correctAnswer && note === correctAnswer
        const isWrongPick = userPick === note && correctAnswer && correctAnswer !== note
        const showState = correctAnswer !== null

        const stateClass = showState
          ? isCorrect
            ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200'
            : isWrongPick
            ? 'border-red-400 bg-red-500/15 text-red-200'
            : 'border-surface-800 bg-surface-900/50 text-surface-500'
          : 'border-surface-700 bg-surface-800 text-white hover:border-brand-500 hover:bg-surface-700'

        return (
          <motion.button
            key={note}
            whileHover={disabled || showState ? undefined : { scale: 1.04 }}
            whileTap={disabled || showState ? undefined : { scale: 0.96 }}
            disabled={disabled || showState}
            onClick={() => onPick(note)}
            className={`relative flex h-24 min-w-[140px] flex-1 max-w-[180px] flex-col items-center justify-center rounded-2xl border-2 font-bold transition-colors ${stateClass} disabled:cursor-default`}
          >
            <span className="text-3xl">{prettyNote(note).slice(0, -1)}</span>
            <span className="text-xs font-medium opacity-70">octave {prettyNote(note).slice(-1)}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
