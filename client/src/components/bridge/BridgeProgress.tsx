import { motion } from 'framer-motion'

interface BridgeProgressProps {
  /** 0–100 progress value. */
  progress: number
  /** Optional level number to display on the left pillar. */
  fromLevel?: number
  /** Optional next level number for the right pillar. */
  toLevel?: number | null
  className?: string
}

/**
 * A bridge-themed progress indicator.
 * Two stone pillars connected by a suspension cable; planks light up
 * along the deck as `progress` increases.
 */
export default function BridgeProgress({
  progress,
  fromLevel,
  toLevel,
  className = '',
}: BridgeProgressProps) {
  const pct = Math.max(0, Math.min(100, progress))
  const plankCount = 14
  const litCount = Math.round((pct / 100) * plankCount)

  return (
    <div className={`w-full ${className}`}>
      <div className="relative mx-auto w-full max-w-xl">
        <svg viewBox="0 0 400 80" className="w-full">
          <defs>
            <linearGradient id="bp-cable" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Left pillar */}
          <g>
            <rect x="12" y="24" width="14" height="56" rx="1.5" fill="#1e293b" />
            <rect x="10" y="20" width="18" height="5" rx="1" fill="#334155" />
            {fromLevel !== undefined && (
              <text
                x="19"
                y="50"
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="10"
                fontWeight="bold"
                fontFamily="Inter, system-ui, sans-serif"
              >
                L{fromLevel}
              </text>
            )}
          </g>

          {/* Right pillar */}
          <g>
            <rect x="374" y="24" width="14" height="56" rx="1.5" fill="#1e293b" />
            <rect x="372" y="20" width="18" height="5" rx="1" fill="#334155" />
            {toLevel !== undefined && toLevel !== null && (
              <text
                x="381"
                y="50"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
                fontWeight="bold"
                fontFamily="Inter, system-ui, sans-serif"
              >
                L{toLevel}
              </text>
            )}
          </g>

          {/* Cables */}
          <path
            d="M 19 20 Q 200 58 381 20"
            fill="none"
            stroke="url(#bp-cable)"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <path
            d="M 19 20 Q 200 54 381 20"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            opacity="0.25"
          />

          {/* Planks */}
          <g>
            {Array.from({ length: plankCount }).map((_, i) => {
              const t = (i + 0.5) / plankCount
              const x = 26 + t * (348)
              const isLit = i < litCount
              return (
                <motion.rect
                  key={i}
                  x={x - 8}
                  y={66}
                  width="16"
                  height="4"
                  rx="1"
                  initial={false}
                  animate={{
                    fill: isLit ? '#f59e0b' : '#1e293b',
                    opacity: isLit ? 1 : 0.4,
                  }}
                  transition={{ duration: 0.35, delay: i * 0.02 }}
                />
              )
            })}
          </g>

          {/* Suspenders */}
          {Array.from({ length: plankCount }).map((_, i) => {
            const t = (i + 0.5) / plankCount
            const x = 26 + t * 348
            const yCable = 20 + Math.sin(t * Math.PI) * 38
            return (
              <line
                key={`s-${i}`}
                x1={x}
                y1={yCable}
                x2={x}
                y2={66}
                stroke="#334155"
                strokeWidth="0.5"
                opacity="0.2"
              />
            )
          })}
        </svg>

        {/* Progress label */}
        <div className="mt-1 flex items-center justify-between px-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
            Start
          </span>
          <span className="text-[10px] font-bold tabular-nums text-brand-400">
            {pct}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
            Next bridge
          </span>
        </div>
      </div>
    </div>
  )
}
