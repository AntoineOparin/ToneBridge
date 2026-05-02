import type { Server, Socket } from 'socket.io'
import { EVENTS } from './events.js'
import { calculateElo } from '../lib/elo.js'
import { supabase } from '../lib/supabase.js'

const MATCH_DURATION_MS = 60_000

interface RoomPlayer {
  socketId: string
  userId: string
  score: number
  elo: number
}

interface Room {
  players: [RoomPlayer, RoomPlayer]
  timer: ReturnType<typeof setTimeout>
  startTime: number
}

const rooms = new Map<string, Room>()

export function createRoom(
  io: Server,
  roomId: string,
  p1: { socketId: string; userId: string; elo: number },
  p2: { socketId: string; userId: string; elo: number },
) {
  const timer = setTimeout(() => endMatch(io, roomId, 'timeout'), MATCH_DURATION_MS)

  rooms.set(roomId, {
    players: [
      { ...p1, score: 0 },
      { ...p2, score: 0 },
    ],
    timer,
    startTime: Date.now(),
  })
}

async function endMatch(io: Server, roomId: string, reason: 'timeout' | 'disconnect') {
  const room = rooms.get(roomId)
  if (!room) return

  clearTimeout(room.timer)
  rooms.delete(roomId)

  const [p1, p2] = room.players
  const isDraw = p1.score === p2.score

  let winner = 'draw'
  let eloChange: Record<string, number> = { [p1.userId]: 0, [p2.userId]: 0 }

  if (!isDraw) {
    const [w, l] = p1.score > p2.score ? [p1, p2] : [p2, p1]
    winner = w.userId

    const result = calculateElo(w.elo, l.elo)
    const wChange = result.winner - w.elo
    const lChange = result.loser - l.elo

    eloChange = { [w.userId]: wChange, [l.userId]: lChange }

    // Update ELO in DB (fire and forget — don't block the emit)
    Promise.all([
      supabase.from('users').update({ elo: result.winner }).eq('id', w.userId),
      supabase.from('users').update({ elo: result.loser }).eq('id', l.userId),
    ]).catch((err) => console.error('ELO update failed:', err))
  }

  io.to(roomId).emit(EVENTS.MATCH_END, {
    winner,
    scores: { [p1.userId]: p1.score, [p2.userId]: p2.score },
    eloChange,
    reason,
  })
}

export function registerGameRoom(io: Server, socket: Socket) {
  socket.on(EVENTS.NOTE_RESULT, (data: { roomId: string; correct: boolean; skipped?: boolean }) => {
    const room = rooms.get(data.roomId)
    if (!room) return

    const player = room.players.find((p) => p.socketId === socket.id)
    if (!player) return

    if (data.correct) player.score++
    else if (data.skipped) player.score = Math.max(0, player.score - 1)

    const timeRemaining = Math.max(
      0,
      Math.round((MATCH_DURATION_MS - (Date.now() - room.startTime)) / 1000),
    )

    const [p1, p2] = room.players
    io.to(data.roomId).emit(EVENTS.ROUND_UPDATE, {
      scores: { [p1.userId]: p1.score, [p2.userId]: p2.score },
      timeRemaining,
    })
  })

  socket.on('disconnect', () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.some((p) => p.socketId === socket.id)) {
        endMatch(io, roomId, 'disconnect')
        break
      }
    }
  })
}
