import { motion } from 'framer-motion'
import { SINGING_CENTS_TOLERANCE } from '../../lib/constants'
import type { MicState, PitchReading } from '../../hooks/usePitchDetection'

interface MicInputProps {
  state: MicState
  reading: PitchReading | null
  centsOff: number | null
  detected: string
  /** Progress toward holding the target note long enough (0..1). */
  holdProgress: number
}

/**
 * Live mic visualisation. Shows input level, detected note, and a needle that
 * tracks how flat / sharp the user is relative to the target.
 */
export default function MicInput({
  state,
  reading,
  centsOff,
  detected,
  holdProgress,
}: MicInputProps) {
  const level = reading?.level ?? 0
  const cents = centsOff ?? 0
  const clamped = Math.max(-100, Math.min(100, cents))
  const inTune = Math.abs(cents) <= SINGING_CENTS_TOLERANCE
  const stateLabel = stateLabelFor(state)

  return (
    <div className="w-full max-w-xl rounded-3xl border border-surface-700 bg-surface-800/60 p-6 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`relative flex h-3 w-3 ${state === 'listening' ? '' : 'opacity-40'}`}
            aria-hidden
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-500" />
          </span>
          <span className="text-sm font-semibold uppercase tracking-wider text-surface-300">
            {stateLabel}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-surface-400">Detected</div>
          <div className="font-mono text-2xl font-bold text-white">
            {detected || '—'}
          </div>
        </div>
      </div>

      {/* Cents needle */}
      <div className="relative h-12 rounded-2xl border border-surface-700 bg-surface-900/80 overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 w-px bg-surface-600" />
        <div
          className={`absolute inset-y-2 left-1/2 -translate-x-1/2 rounded-full ${
            inTune ? 'bg-emerald-500/30' : 'bg-brand-500/20'
          }`}
          style={{ width: `${(SINGING_CENTS_TOLERANCE / 100) * 100}%` }}
        />
        <motion.div
          animate={{ x: `${clamped}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className={`absolute top-1 bottom-1 left-1/2 w-1 rounded-full ${
            inTune ? 'bg-emerald-400' : 'bg-brand-400'
          }`}
        />
        <div className="absolute inset-x-2 bottom-1 flex justify-between text-[10px] uppercase tracking-wider text-surface-500">
          <span>flat -100¢</span>
          <span className="text-surface-300">on pitch</span>
          <span>sharp +100¢</span>
        </div>
      </div>

      {/* Input level */}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-900/80">
        <motion.div
          animate={{ width: `${Math.round(level * 100)}%` }}
          transition={{ duration: 0.06 }}
          className="h-full bg-gradient-to-r from-brand-500 to-brand-300"
        />
      </div>

      {/* Hold progress */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-900/80">
        <motion.div
          animate={{ width: `${Math.round(holdProgress * 100)}%` }}
          transition={{ duration: 0.06 }}
          className="h-full bg-emerald-400"
        />
      </div>
    </div>
  )
}

function stateLabelFor(state: MicState): string {
  switch (state) {
    case 'idle':
      return 'Mic off'
    case 'requesting':
      return 'Requesting mic…'
    case 'ready':
      return 'Mic ready'
    case 'listening':
      return 'Listening'
    case 'denied':
      return 'Mic permission denied'
    case 'error':
      return 'Mic error'
  }
}
