import { AnimatePresence, motion } from 'framer-motion'
import type { Tip } from '../../types'

interface ForteProps {
  tip: Tip | null
  onDismiss?: () => void
  /** Optional state hint that affects facial expression / glow. */
  mood?: 'happy' | 'thinking' | 'cheering' | 'concerned'
}

/**
 * Forte — the resident pitch mascot. The tip "speech bubble" is rendered as
 * a top-of-page toast banner so it never overlaps the round content. The
 * mascot avatar floats in the bottom-right purely for personality and
 * pulses gently when there is an active tip.
 */
export default function Forte({ tip, onDismiss, mood = 'happy' }: ForteProps) {
  return (
    <>
      {/* Top toast — sits below the nav, never blocks the round area. */}
      <AnimatePresence>
        {tip && (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4"
          >
            <div className="pointer-events-auto flex w-full max-w-2xl items-start gap-3 rounded-2xl border border-surface-700 bg-surface-800/95 p-3 pr-4 shadow-xl shadow-black/40 backdrop-blur">
              <div className="shrink-0">
                <ForteAvatar mood={mood} size={44} />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-sm font-semibold leading-snug text-surface-100">{tip.text}</p>
                {tip.detail && (
                  <p className="mt-1 text-xs text-surface-400 leading-snug">{tip.detail}</p>
                )}
              </div>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  aria-label="Dismiss tip"
                  className="shrink-0 rounded-md p-1 text-surface-400 transition-colors hover:bg-surface-700/60 hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot — fixed bottom-right, small. Pulses gently when a tip is active. */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-30">
        <motion.div
          animate={{
            y: mood === 'cheering' ? [-2, -10, -2] : [0, -4, 0],
            scale: tip ? [1, 1.05, 1] : 1,
          }}
          transition={{
            y: { duration: mood === 'cheering' ? 0.5 : 3, repeat: Infinity, ease: 'easeInOut' },
            scale: { duration: 1.5, repeat: tip ? Infinity : 0, ease: 'easeInOut' },
          }}
        >
          <ForteAvatar mood={mood} size={72} />
        </motion.div>
      </div>
    </>
  )
}

interface ForteAvatarProps {
  mood: NonNullable<ForteProps['mood']>
  size?: number
}

export function ForteAvatar({ mood, size = 96 }: ForteAvatarProps) {
  const eyeY = mood === 'cheering' ? 31 : 33
  const mouth =
    mood === 'cheering'
      ? 'M40 46 Q50 56 60 46'
      : mood === 'concerned'
      ? 'M42 50 Q50 44 58 50'
      : mood === 'thinking'
      ? 'M42 49 L58 49'
      : 'M42 47 Q50 53 58 47'
  const glow = mood === 'cheering' ? '#fbbf24' : mood === 'concerned' ? '#94a3b8' : '#f59e0b'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
      className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
    >
      <defs>
        <radialGradient id="forte-glow" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.55" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="forte-fork" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="55" r="42" fill="url(#forte-glow)" />

      {/* Tuning-fork prongs */}
      <rect x="32" y="6" width="6" height="26" rx="2" fill="url(#forte-fork)" />
      <rect x="62" y="6" width="6" height="26" rx="2" fill="url(#forte-fork)" />

      {/* Head / body capsule */}
      <rect x="22" y="28" width="56" height="56" rx="22" fill="url(#forte-fork)" />
      <rect x="44" y="80" width="12" height="14" rx="3" fill="#b45309" />

      {/* Face highlight */}
      <ellipse cx="50" cy="42" rx="22" ry="12" fill="#fff" opacity="0.18" />

      {/* Eyes */}
      <circle cx="40" cy={eyeY} r="3" fill="#0f172a" />
      <circle cx="60" cy={eyeY} r="3" fill="#0f172a" />
      <circle cx="41" cy={eyeY - 1} r="0.9" fill="#fff" />
      <circle cx="61" cy={eyeY - 1} r="0.9" fill="#fff" />

      {/* Mouth */}
      <path d={mouth} stroke="#0f172a" strokeWidth="2.4" fill="none" strokeLinecap="round" />

      {/* Bowtie */}
      <path d="M40 70 L50 66 L60 70 L60 76 L50 72 L40 76 Z" fill="#3b82f6" />
      <circle cx="50" cy="71" r="2" fill="#0f172a" opacity="0.6" />
    </svg>
  )
}
