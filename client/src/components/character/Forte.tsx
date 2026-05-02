import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Tip } from '../../types'

interface ForteProps {
  tip: Tip | null
  onDismiss?: () => void
  mood?: 'happy' | 'thinking' | 'cheering' | 'concerned'
  /** Practice page: tap Forte for tips; hover shows a tiny hello only. */
  interactive?: boolean
  onMascotClick?: () => void
}

/**
 * Forte — tips render in a fixed **left** panel so the center practice UI stays clear.
 * Hover shows a small “Hello” near the mascot only; click delivers coaching via `tip`.
 */
export default function Forte({
  tip,
  onDismiss,
  mood = 'happy',
  interactive = false,
  onMascotClick,
}: ForteProps) {
  const [hello, setHello] = useState(false)

  const handleClick = useCallback(() => {
    if (!interactive || !onMascotClick) return
    onMascotClick()
  }, [interactive, onMascotClick])

  const fromMascot = tip?.id.startsWith('mc-')

  return (
    <>
      {/* Tips — left edge, vertically centered; avoids blocking rounds & keyboard */}
      <AnimatePresence>
        {tip && (
          <motion.aside
            key={tip.id}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed left-4 top-28 z-40 w-[min(100%-2rem,300px)] md:left-5 md:top-1/2 md:-translate-y-1/2 md:w-[min(320px,calc(45vw-2rem))]"
          >
            <div className="pointer-events-auto max-h-[min(70vh,520px)] overflow-y-auto rounded-2xl border border-surface-700/90 bg-surface-900/92 p-3 shadow-lg shadow-black/30 backdrop-blur-md">
              <div className="flex gap-2.5">
                <div className="shrink-0 pt-0.5">
                  <ForteAvatar mood="happy" size={36} spotlight={false} />
                </div>
                <div className="min-w-0 flex-1">
                  {fromMascot ? (
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-400">
                      Forte
                    </p>
                  ) : (
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-surface-500">
                      Tip
                    </p>
                  )}
                  <p className="text-sm font-medium leading-snug text-surface-100">{tip.text}</p>
                  {tip.detail && (
                    <p className="mt-1.5 text-xs leading-relaxed text-surface-400">{tip.detail}</p>
                  )}
                </div>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss"
                    className="shrink-0 self-start rounded-md p-1 text-surface-500 transition-colors hover:bg-surface-800 hover:text-surface-200"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mascot */}
      <div
        className={`fixed bottom-6 right-6 z-30 ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <div className="relative flex flex-col items-end">
          {/* Tiny hello — hover only, anchored above Forte */}
          <AnimatePresence>
            {interactive && hello && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-none mb-2 max-w-[160px] rounded-xl border border-surface-600 bg-surface-800/95 px-3 py-2 text-right shadow-md backdrop-blur-sm"
              >
                <p className="text-xs font-medium text-surface-100">Hello!</p>
                <p className="text-[11px] leading-snug text-surface-400">Tap me if you want a tip.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {interactive ? (
            <motion.button
              type="button"
              aria-label="Tap Forte for a coaching tip"
              onPointerEnter={() => setHello(true)}
              onPointerLeave={() => setHello(false)}
              onClick={handleClick}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900"
            >
              <div className="rounded-full bg-surface-950/90 p-0.5 ring-1 ring-brand-500/30 shadow-md shadow-black/40">
                <ForteAvatar mood="happy" size={76} spotlight={false} />
              </div>
            </motion.button>
          ) : (
            <ForteAvatar mood={mood} size={72} spotlight={false} />
          )}
        </div>
      </div>
    </>
  )
}

interface ForteAvatarProps {
  mood: NonNullable<ForteProps['mood']>
  size?: number
  spotlight?: boolean
}

export function ForteAvatar({ mood, size = 96, spotlight = false }: ForteAvatarProps) {
  const eyeY = mood === 'cheering' ? 31 : mood === 'thinking' ? 30 : 33
  const mouth =
    mood === 'cheering'
      ? 'M40 46 Q50 56 60 46'
      : mood === 'concerned'
      ? 'M42 50 Q50 44 58 50'
      : mood === 'thinking'
      ? 'M42 49 L58 49'
      : 'M42 47 Q50 53 58 47'
  const glow =
    mood === 'cheering' ? '#fbbf24' : mood === 'concerned' ? '#94a3b8' : mood === 'thinking' ? '#38bdf8' : '#f59e0b'

  const forkId = `forte-fork-${size}-${mood}`
  const glowId = `forte-glow-${size}-${mood}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
      className={`drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)] ${spotlight ? 'drop-shadow-[0_0_20px_rgba(251,191,36,0.45)]' : ''}`}
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor={glow} stopOpacity={spotlight ? '0.65' : '0.48'} />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={forkId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="55" r="42" fill={`url(#${glowId})`} />

      <rect x="32" y="6" width="6" height="26" rx="2" fill={`url(#${forkId})`} />
      <rect x="62" y="6" width="6" height="26" rx="2" fill={`url(#${forkId})`} />

      <rect x="22" y="28" width="56" height="56" rx="22" fill={`url(#${forkId})`} />
      <rect x="44" y="80" width="12" height="14" rx="3" fill="#b45309" />

      <ellipse cx="50" cy="42" rx="22" ry="12" fill="#fff" opacity="0.18" />

      <circle cx="40" cy={eyeY} r="3" fill="#0f172a" />
      <circle cx="60" cy={eyeY} r="3" fill="#0f172a" />
      <circle cx="41" cy={eyeY - 1} r="0.9" fill="#fff" />
      <circle cx="61" cy={eyeY - 1} r="0.9" fill="#fff" />

      <path d={mouth} stroke="#0f172a" strokeWidth="2.4" fill="none" strokeLinecap="round" />

      <path d="M40 70 L50 66 L60 70 L60 76 L50 72 L40 76 Z" fill="#3b82f6" />
      <circle cx="50" cy="71" r="2" fill="#0f172a" opacity="0.6" />
    </svg>
  )
}
