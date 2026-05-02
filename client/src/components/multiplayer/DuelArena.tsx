import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NoteChallenge from '../game/NoteChallenge'
import type { NoteName, PracticeMode, RoundResult } from '../../types'

const DURATION = 60
const MULTI_POOL: NoteName[] = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']

// Every 4th challenge is a pitch-matching (sing) challenge
function getMode(index: number): PracticeMode {
  return index % 4 === 3 ? 'sing' : 'identify'
}

interface MatchResult {
  winner: string
  scores: Record<string, number>
  eloChange: Record<string, number>
  reason: 'timeout' | 'disconnect'
}

interface DuelArenaProps {
  roomId: string
  noteSequence: NoteName[]
  myUserId: string
  opponentId: string
  opponentLabel: string
  myScore: number
  opponentScore: number
  matchResult: MatchResult | null
  waitingRematch: boolean
  onNoteResult: (correct: boolean, skipped?: boolean) => void
  onRematch: () => void
  onFindNew: () => void
  onLeave: () => void
}

export default function DuelArena({
  noteSequence,
  myUserId,
  opponentId,
  opponentLabel,
  myScore,
  opponentScore,
  matchResult,
  waitingRematch,
  onNoteResult,
  onRematch,
  onFindNew,
  onLeave,
}: DuelArenaProps) {
  const [noteIndex, setNoteIndex] = useState(0)
  const [roundKey, setRoundKey] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const startRef = useRef(Date.now())
  const gameOverRef = useRef(false)

  useEffect(() => {
    if (matchResult) { gameOverRef.current = true; return }
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000)
      setTimeLeft(Math.max(0, DURATION - elapsed))
    }, 500)
    return () => clearInterval(id)
  }, [matchResult])

  function handleResult(result: RoundResult) {
    if (gameOverRef.current) return
    const correct = result.outcome === 'correct'
    const skipped = !correct && result.answer === null
    onNoteResult(correct, skipped)
    setNoteIndex((i) => Math.min(i + 1, noteSequence.length - 1))
    setRoundKey((k) => k + 1)
  }

  const currentNote = noteSequence[noteIndex] ?? 'C4'
  const currentMode = getMode(noteIndex)
  const myPct = myScore / ((myScore + opponentScore) || 1)
  const isDisconnect = matchResult?.reason === 'disconnect'
  const isWinner = matchResult?.winner === myUserId
  const isDraw = matchResult?.winner === 'draw'

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* Header: timer + scores */}
      <div className="w-full flex items-center gap-4">
        <div className="flex-1 text-center">
          <p className="text-surface-400 text-xs uppercase tracking-widest mb-1">You</p>
          <p className="text-3xl font-black text-brand-400">{myScore}</p>
        </div>

        <div className="flex flex-col items-center">
          <motion.div
            className={`text-4xl font-black tabular-nums ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}
            animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
          >
            {timeLeft}
          </motion.div>
          <p className="text-surface-500 text-xs">seconds</p>
        </div>

        <div className="flex-1 text-center">
          <p className="text-surface-400 text-xs uppercase tracking-widest mb-1">{opponentLabel}</p>
          <p className="text-3xl font-black text-accent-400">{opponentScore}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-surface-800 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-500 to-accent-400"
          animate={{ width: `${myPct * 100}%` }}
          transition={{ type: 'spring', stiffness: 120 }}
        />
      </div>

      {/* Note challenge */}
      <div className="w-full">
        <NoteChallenge
          key={roundKey}
          mode={currentMode}
          target={currentNote}
          pool={MULTI_POOL}
          onResult={handleResult}
          roundKey={roundKey}
          showPopup={false}
        />
      </div>

      {/* Match result overlay */}
      <AnimatePresence>
        {matchResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex flex-col items-center gap-6 rounded-2xl bg-surface-800 border border-surface-700 px-12 py-10 text-center max-w-sm w-full mx-4"
            >
              {isDisconnect ? (
                <>
                  <div className="text-6xl">🚪</div>
                  <h2 className="text-3xl font-black text-white">Opponent left</h2>
                  <p className="text-surface-400 text-sm">Returning to menu…</p>
                </>
              ) : (
                <>
                  <div className="text-6xl">
                    {isDraw ? '🤝' : isWinner ? '🏆' : '💀'}
                  </div>
                  <h2 className="text-4xl font-black text-white">
                    {isDraw ? 'Draw!' : isWinner ? 'You win!' : 'You lose!'}
                  </h2>

                  <div className="flex gap-8">
                    <div>
                      <p className="text-surface-400 text-sm">You</p>
                      <p className="text-3xl font-black text-brand-400">
                        {matchResult.scores[myUserId] ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-surface-400 text-sm">{opponentLabel}</p>
                      <p className="text-3xl font-black text-accent-400">
                        {matchResult.scores[opponentId] ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* ELO change */}
                  {matchResult.eloChange[myUserId] !== undefined && (
                    <div className="flex flex-col items-center">
                      <p className="text-surface-500 text-xs uppercase tracking-widest mb-1">ELO</p>
                      <motion.p
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className={`text-2xl font-black ${matchResult.eloChange[myUserId] >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {matchResult.eloChange[myUserId] >= 0 ? '+' : ''}{matchResult.eloChange[myUserId]}
                      </motion.p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 w-full pt-2">
                    <motion.button
                      onClick={onRematch}
                      disabled={waitingRematch}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-3 rounded-xl bg-brand-500 text-white font-bold hover:bg-brand-400 transition disabled:opacity-50"
                    >
                      {waitingRematch ? 'Waiting for opponent…' : '⚔️ Rematch'}
                    </motion.button>

                    <motion.button
                      onClick={onFindNew}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-3 rounded-xl bg-surface-700 text-white font-bold hover:bg-surface-600 transition"
                    >
                      🔍 Find New Player
                    </motion.button>

                    <button
                      onClick={onLeave}
                      className="w-full py-2 text-surface-400 hover:text-surface-200 text-sm transition"
                    >
                      Leave
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
