import type { Server } from 'socket.io'
import { registerMatchmaking } from './matchmaking.js'

export function initSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)
    registerMatchmaking(io, socket)
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id))
  })
}
