import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = io(SOCKET_URL)
    socketRef.current = socket
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  return { socketRef, connected }
}
