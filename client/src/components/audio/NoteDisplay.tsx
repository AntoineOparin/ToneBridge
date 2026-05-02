import { motion } from 'framer-motion'
import { prettyNote } from '../../lib/noteUtils'
import type { NoteName } from '../../types'

interface NoteDisplayProps {
  note: NoteName
  /** Hide the note name (used in identify mode where the user shouldn't see it). */
  hidden?: boolean
  /** Optional flash color overlay to convey correct/wrong feedback. */
  flash?: 'correct' | 'wrong' | null
}

export default function NoteDisplay({ note, hidden = false, flash = null }: NoteDisplayProps) {
  const flashClass =
    flash === 'correct'
      ? 'shadow-[0_0_60px_8px_rgba(16,185,129,0.45)] border-emerald-400'
      : flash === 'wrong'
      ? 'shadow-[0_0_60px_8px_rgba(239,68,68,0.45)] border-red-400'
      : 'shadow-[0_0_40px_4px_rgba(245,158,11,0.25)] border-brand-500/60'

  return (
    <motion.div
      key={note + (hidden ? '?' : '')}
      initial={{ opacity: 0, scale: 0.85, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex h-56 w-56 items-center justify-center rounded-3xl border bg-gradient-to-br from-surface-800 to-surface-900 transition-shadow ${flashClass}`}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-500/10 to-transparent" />
      <div className="relative text-center">
        {hidden ? (
          <span className="text-8xl font-black text-surface-500 select-none">?</span>
        ) : (
          <>
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="block text-8xl font-black tracking-tight text-white select-none"
            >
              {prettyNote(note).slice(0, -1)}
            </motion.span>
            <span className="mt-1 block text-2xl font-semibold text-brand-400 select-none">
              octave {prettyNote(note).slice(-1)}
            </span>
          </>
        )}
      </div>
    </motion.div>
  )
}
