import { AnimatePresence, motion } from 'framer-motion'
import type { Tip } from '../../types'

interface ForteProps {
  tip: Tip | null
  /** Optional state hint that affects facial expression / glow. */
  mood?: 'happy' | 'thinking' | 'cheering' | 'concerned'
}

/**
 * Forte — the resident pitch mascot. He's an anthropomorphic tuning fork
 * with a friendly face, anchored bottom-right of the practice page. When
 * the tip-bot has something to say, a speech bubble pops in above his head.
 */
export default function Forte({ tip, mood = 'happy' }: ForteProps) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {tip && (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto max-w-xs rounded-2xl border border-surface-700 bg-surface-800/95 px-4 py-3 shadow-xl shadow-black/40 backdrop-blur"
          >
            <p className="text-sm font-medium text-surface-100 leading-snug">{tip.text}</p>
            {tip.detail && (
              <p className="mt-1.5 text-xs text-surface-400 leading-snug">{tip.detail}</p>
            )}
            <div className="absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 border-b border-r border-surface-700 bg-surface-800/95" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          y: mood === 'cheering' ? [-2, -10, -2] : [0, -4, 0],
        }}
        transition={{ duration: mood === 'cheering' ? 0.5 : 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ForteAvatar mood={mood} />
      </motion.div>
    </div>
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
