import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSocket } from '../hooks/useSocket'
import Lobby from '../components/multiplayer/Lobby'
import DuelArena from '../components/multiplayer/DuelArena'
import type { NoteName } from '../types'

type Phase = 'idle' | 'queuing' | 'playing' | 'results'

interface MatchResult {
  winner: string
  scores: Record<string, number>
  eloChange: Record<string, number>
  reason: 'timeout' | 'disconnect'
}

const EVENTS = {
  JOIN_QUEUE: 'join_queue',
  MATCH_FOUND: 'match_found',
  NOTE_RESULT: 'note_result',
  ROUND_UPDATE: 'round_update',
  MATCH_END: 'match_end',
  LEAVE_ROOM: 'leave_room',
  REMATCH_REQUEST: 'rematch_request',
  REMATCH_DECLINED: 'rematch_declined',
}

export default function Multiplayer() {
  const navigate = useNavigate()
  const { socketRef, connected } = useSocket()
  const [phase, setPhase] = useState<Phase>('idle')
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [myElo, setMyElo] = useState(1000)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [opponentId, setOpponentId] = useState<string | null>(null)
  const [opponentLabel, setOpponentLabel] = useState('Opponent')
  const [noteSequence, setNoteSequence] = useState<NoteName[]>([])
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [waitingRematch, setWaitingRematch] = useState(false)
  const listenersAttached = useRef(false)
  const myUserIdRef = useRef<string | null>(null)
  const myEloRef = useRef(1000)

  // Fetch userId + current ELO
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      setMyUserId(data.user.id)
      myUserIdRef.current = data.user.id

      const { data: profile } = await supabase
        .from('users')
        .select('elo')
        .eq('id', data.user.id)
        .maybeSingle()
      if (profile?.elo) {
        setMyElo(profile.elo)
        myEloRef.current = profile.elo
      }
    })
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !connected || listenersAttached.current) return
    listenersAttached.current = true

    socket.on(EVENTS.MATCH_FOUND, async (data: { roomId: string; opponentId: string; noteSequence: string[] }) => {
      setRoomId(data.roomId)
      setOpponentId(data.opponentId)
      setNoteSequence(data.noteSequence as NoteName[])
      setMyScore(0)
      setOpponentScore(0)
      setMatchResult(null)
      setWaitingRematch(false)
      setPhase('playing')

      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', data.opponentId)
        .maybeSingle()
      if (user?.email) setOpponentLabel(user.email.split('@')[0])
    })

    socket.on(EVENTS.ROUND_UPDATE, (data: { scores: Record<string, number> }) => {
      const uid = myUserIdRef.current
      if (!uid) return
      setMyScore(data.scores[uid] ?? 0)
      const oppId = Object.keys(data.scores).find((id) => id !== uid)
      if (oppId) setOpponentScore(data.scores[oppId] ?? 0)
    })

    socket.on(EVENTS.MATCH_END, (data: MatchResult) => {
      setMatchResult(data)
      // Update local ELO immediately from server result
      const uid = myUserIdRef.current
      if (uid && data.eloChange[uid]) {
        const newElo = myEloRef.current + data.eloChange[uid]
        setMyElo(newElo)
        myEloRef.current = newElo
      }
      if (data.reason === 'disconnect') {
        setTimeout(() => { setMatchResult(null); setPhase('idle') }, 3000)
      } else {
        setPhase('results')
      }
    })

    socket.on(EVENTS.REMATCH_DECLINED, () => {
      setWaitingRematch(false)
      findMatch()
    })

    return () => {
      socket.off(EVENTS.MATCH_FOUND)
      socket.off(EVENTS.ROUND_UPDATE)
      socket.off(EVENTS.MATCH_END)
      socket.off(EVENTS.REMATCH_DECLINED)
      listenersAttached.current = false
    }
  }, [connected, socketRef])

  function findMatch() {
    const socket = socketRef.current
    if (!socket || !myUserIdRef.current) return
    setPhase('queuing')
    setMatchResult(null)
    setWaitingRematch(false)
    socket.emit(EVENTS.JOIN_QUEUE, { userId: myUserIdRef.current, elo: myEloRef.current })
  }

  function cancelQueue() {
    const socket = socketRef.current
    if (!socket) return
    socket.emit(EVENTS.LEAVE_ROOM)
    setPhase('idle')
  }

  function handleNoteResult(correct: boolean, skipped?: boolean) {
    const socket = socketRef.current
    if (!socket || !roomId) return
    socket.emit(EVENTS.NOTE_RESULT, { roomId, correct, skipped: skipped ?? false })
    if (correct) setMyScore((s) => s + 1)
    else if (skipped) setMyScore((s) => Math.max(0, s - 1))
  }

  function handleRematch() {
    const socket = socketRef.current
    if (!socket || !myUserIdRef.current || !opponentId) return
    setWaitingRematch(true)
    socket.emit(EVENTS.REMATCH_REQUEST, {
      myUserId: myUserIdRef.current,
      myElo: myEloRef.current,
      opponentId,
    })
  }

  function handleLeave() {
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-8 py-6"
      >
        <Link to="/" className="text-2xl font-bold text-brand-400 tracking-tight">ToneBridge</Link>
        <div className="flex items-center gap-6">
          {myElo > 0 && (
            <span className="text-surface-400 text-sm">
              ELO <span className="text-brand-400 font-bold">{myElo}</span>
            </span>
          )}
          <Link to="/home" className="text-surface-300 hover:text-brand-400 transition-colors text-sm">← Back</Link>
        </div>
      </motion.nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        {phase === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8 text-center"
          >
            <div>
              <h1 className="text-5xl font-black text-white">1v1 Duel</h1>
              <p className="text-surface-400 mt-2 text-lg">60 seconds. Most correct notes wins.</p>
            </div>

            <div className="flex flex-col gap-3 text-surface-400 text-sm">
              <div className="flex items-center gap-2">🎧 <span>Listen and identify the note</span></div>
              <div className="flex items-center gap-2">🎤 <span>Pitch challenges — sing to match</span></div>
              <div className="flex items-center gap-2">⚡ <span>Win to gain ELO, lose to lose it</span></div>
            </div>

            <motion.button
              onClick={findMatch}
              disabled={!connected || !myUserId}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-10 py-4 rounded-xl bg-brand-500 text-white font-bold text-xl hover:bg-brand-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {connected ? 'Find Match' : 'Connecting…'}
            </motion.button>
          </motion.div>
        )}

        {phase === 'queuing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Lobby onCancel={cancelQueue} />
          </motion.div>
        )}

        {(phase === 'playing' || phase === 'results') && myUserId && opponentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-6"
          >
            <DuelArena
              roomId={roomId!}
              noteSequence={noteSequence}
              myUserId={myUserId}
              opponentId={opponentId}
              opponentLabel={opponentLabel}
              myScore={myScore}
              opponentScore={opponentScore}
              matchResult={matchResult}
              waitingRematch={waitingRematch}
              onNoteResult={handleNoteResult}
              onRematch={handleRematch}
              onFindNew={findMatch}
              onLeave={handleLeave}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}
