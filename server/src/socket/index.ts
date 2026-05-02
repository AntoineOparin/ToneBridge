import type { Server } from 'socket.io'
import { registerMatchmaking } from './matchmaking.js'
import { registerGameRoom } from './gameRoom.js'

export function initSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)
    registerMatchmaking(io, socket)
    registerGameRoom(io, socket)
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id))
  })
}
