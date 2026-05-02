import type { Server, Socket } from 'socket.io'
import { EVENTS } from './events.js'
import { createRoom } from './gameRoom.js'

const MULTI_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']
const SEQUENCE_LENGTH = 50
const REMATCH_TIMEOUT_MS = 15_000

function generateSequence(seed: number): string[] {
  let s = seed
  return Array.from({ length: SEQUENCE_LENGTH }, () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return MULTI_NOTES[s % MULTI_NOTES.length]
  })
}

function startMatch(
  io: Server,
  p1: { socketId: string; userId: string; elo: number },
  p2: { socketId: string; userId: string; elo: number },
) {
  const roomId = `room_${Date.now()}`
  const noteSequence = generateSequence(Date.now())

  io.in(p1.socketId).socketsJoin(roomId)
  io.in(p2.socketId).socketsJoin(roomId)
  createRoom(io, roomId, p1, p2)

  io.to(p1.socketId).emit(EVENTS.MATCH_FOUND, { roomId, opponentId: p2.userId, noteSequence })
  io.to(p2.socketId).emit(EVENTS.MATCH_FOUND, { roomId, opponentId: p1.userId, noteSequence })
}

const queue: { socketId: string; userId: string; elo: number }[] = []
const rematchPending = new Map<string, { socketId: string; opponentId: string; elo: number; timer: ReturnType<typeof setTimeout> }>()

export function registerMatchmaking(io: Server, socket: Socket) {
  socket.on(EVENTS.JOIN_QUEUE, (data: { userId: string; elo: number }) => {
    if (queue.find((q) => q.socketId === socket.id)) return
    queue.push({ socketId: socket.id, userId: data.userId, elo: data.elo })

    if (queue.length >= 2) {
      const [p1, p2] = queue.splice(0, 2)
      startMatch(io, p1, p2)
    }
  })

  socket.on(EVENTS.REMATCH_REQUEST, (data: { myUserId: string; myElo: number; opponentId: string }) => {
    const pending = rematchPending.get(data.opponentId)

    if (pending && pending.opponentId === data.myUserId) {
      clearTimeout(pending.timer)
      rematchPending.delete(data.opponentId)
      startMatch(
        io,
        { socketId: socket.id, userId: data.myUserId, elo: data.myElo },
        { socketId: pending.socketId, userId: data.opponentId, elo: pending.elo },
      )
    } else {
      const timer = setTimeout(() => {
        if (rematchPending.has(data.myUserId)) {
          rematchPending.delete(data.myUserId)
          socket.emit(EVENTS.REMATCH_DECLINED)
        }
      }, REMATCH_TIMEOUT_MS)

      rematchPending.set(data.myUserId, {
        socketId: socket.id,
        opponentId: data.opponentId,
        elo: data.myElo,
        timer,
      })
    }
  })

  socket.on(EVENTS.LEAVE_ROOM, () => {
    const qIdx = queue.findIndex((q) => q.socketId === socket.id)
    if (qIdx !== -1) queue.splice(qIdx, 1)
  })

  socket.on('disconnect', () => {
    const qIdx = queue.findIndex((q) => q.socketId === socket.id)
    if (qIdx !== -1) queue.splice(qIdx, 1)

    for (const [userId, entry] of rematchPending.entries()) {
      if (entry.socketId === socket.id) {
        clearTimeout(entry.timer)
        rematchPending.delete(userId)
        break
      }
    }
  })
}
