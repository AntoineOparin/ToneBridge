import { motion } from 'framer-motion'

interface BridgeSceneProps {
  /** Height in Tailwind classes (e.g. 'h-48', 'h-64') */
  height?: string
  className?: string
}

/**
 * Decorative suspension bridge rendered as an SVG.
 * Used as a subtle background element on pages that reference the bridge metaphor.
 */
export default function BridgeScene({ height = 'h-48', className = '' }: BridgeSceneProps) {
  return (
    <div className={`relative w-full overflow-hidden ${height} ${className}`}>
      <svg
        viewBox="0 0 800 200"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="bridgeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0.12)" />
            <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
          </linearGradient>
          <linearGradient id="cableGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>

        {/* Pillar left */}
        <g>
          <rect x="60" y="60" width="24" height="140" rx="2" fill="#1e293b" />
          <rect x="56" y="55" width="32" height="8" rx="2" fill="#334155" />
          <rect x="54" y="50" width="36" height="6" rx="2" fill="#475569" />
          <motion.circle
            cx="72"
            cy="45"
            r="5"
            fill="#f59e0b"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>

        {/* Pillar right */}
        <g>
          <rect x="716" y="60" width="24" height="140" rx="2" fill="#1e293b" />
          <rect x="712" y="55" width="32" height="8" rx="2" fill="#334155" />
          <rect x="710" y="50" width="36" height="6" rx="2" fill="#475569" />
          <motion.circle
            cx="728"
            cy="45"
            r="5"
            fill="#f59e0b"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          />
        </g>

        {/* Main cables */}
        <path
          d="M 72 55 Q 400 140 728 55"
          fill="none"
          stroke="url(#cableGrad)"
          strokeWidth="2"
          opacity="0.5"
        />
        <path
          d="M 72 55 Q 400 135 728 55"
          fill="none"
          stroke="#334155"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Vertical suspenders */}
        {Array.from({ length: 12 }).map((_, i) => {
          const t = (i + 1) / 13
          const x = 72 + t * (728 - 72)
          const yMain = 55 + Math.sin(t * Math.PI) * 85
          return (
            <line
              key={i}
              x1={x}
              y1={yMain}
              x2={x}
              y2={170}
              stroke="#334155"
              strokeWidth="1"
              opacity="0.25"
            />
          )
        })}

        {/* Road deck */}
        <rect x="50" y="168" width="700" height="4" rx="2" fill="#1e293b" opacity="0.6" />

        {/* Fog / mist overlay */}
        <rect x="0" y="140" width="800" height="60" fill="url(#bridgeGrad)" />
      </svg>
    </div>
  )
}
