import { AnimatePresence, motion } from 'framer-motion'

interface ScorePopupProps {
  show: boolean
  amount: number
  variant: 'correct' | 'wrong'
  message?: string
}

export default function ScorePopup({ show, amount, variant, message }: ScorePopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: -8, scale: 1 }}
          exit={{ opacity: 0, y: -32, scale: 0.9 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-5xl font-black tracking-tight drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)] ${
            variant === 'correct' ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {variant === 'correct' ? `+${amount} XP` : message ?? 'Try again'}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
