import { motion } from 'framer-motion'

interface StreakCounterProps {
  streak: number
  sessionXp: number
}

export default function StreakCounter({ streak, sessionXp }: StreakCounterProps) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        animate={streak > 0 ? { scale: [1, 1.08, 1] } : undefined}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 rounded-full border border-surface-700 bg-surface-800/70 px-4 py-2 backdrop-blur"
      >
        <span className="text-lg">🔥</span>
        <span className="font-mono text-sm font-bold text-white">{streak}</span>
        <span className="text-xs uppercase tracking-wider text-surface-400">streak</span>
      </motion.div>
      <div className="flex items-center gap-2 rounded-full border border-surface-700 bg-surface-800/70 px-4 py-2 backdrop-blur">
        <span className="text-brand-400 text-sm font-bold">+{sessionXp}</span>
        <span className="text-xs uppercase tracking-wider text-surface-400">xp</span>
      </div>
    </div>
  )
}
