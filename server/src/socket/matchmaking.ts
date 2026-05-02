import type { Server, Socket } from 'socket.io'
import { EVENTS } from './events.js'

const queue: { socketId: string; userId: string; elo: number }[] = []

export function registerMatchmaking(io: Server, socket: Socket) {
  socket.on(EVENTS.JOIN_QUEUE, (data: { userId: string; elo: number }) => {
    queue.push({ socketId: socket.id, ...data })
    if (queue.length >= 2) {
      const [p1, p2] = queue.splice(0, 2)
      const roomId = `room_${Date.now()}`
      io.to(p1.socketId).emit(EVENTS.MATCH_FOUND, { roomId, opponent: p2.userId })
      io.to(p2.socketId).emit(EVENTS.MATCH_FOUND, { roomId, opponent: p1.userId })
    }
  })

  socket.on(EVENTS.LEAVE_ROOM, () => {
    const idx = queue.findIndex((q) => q.socketId === socket.id)
    if (idx !== -1) queue.splice(idx, 1)
  })
}
