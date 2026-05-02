import { AnimatePresence, motion } from 'framer-motion'

interface ScorePopupProps {
  show: boolean
  amount: number
  variant: 'correct' | 'wrong'
  message?: string
}

export default function ScorePopup({ show, amount, variant, message }: ScorePopupProps) {
  const text =
    variant === 'correct' ? `+${amount} XP` : message ?? 'Try again'
  const long = text.length > 14

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-none max-w-[min(100%,20rem)] select-none text-center font-black tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] ${
            long ? 'text-2xl leading-snug sm:text-3xl' : 'text-3xl sm:text-4xl'
          } ${variant === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
