import { motion } from 'framer-motion'

interface LobbyProps {
  onCancel: () => void
}

export default function Lobby({ onCancel }: LobbyProps) {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute h-24 w-24 rounded-full border-2 border-brand-500/40"
            animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <div className="z-10 flex h-20 w-20 items-center justify-center rounded-full bg-surface-800 border border-brand-500/30 text-3xl">
          🎵
        </div>
      </div>

      <div className="text-center">
        <motion.p
          className="text-xl font-bold text-white"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Finding opponent…
        </motion.p>
        <p className="text-surface-400 text-sm mt-1">This may take a moment</p>
      </div>

      <button
        onClick={onCancel}
        className="text-surface-500 hover:text-surface-300 text-sm transition"
      >
        Cancel
      </button>
    </div>
  )
}
