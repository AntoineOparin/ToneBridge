import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import type { Session } from '@supabase/supabase-js'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Learn from './pages/Learn'
import Practice from './pages/Practice'
import Multiplayer from './pages/Multiplayer'
import Profile from './pages/Profile'
import LeaderboardPage from './pages/Leaderboard'
import Login from './pages/Login'

function ProtectedRoute({ session, children }: { session: Session | null; children: ReactNode }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    }).catch(() => setLoading(false))

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<ProtectedRoute session={session}><Home /></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute session={session}><Learn /></ProtectedRoute>} />
        <Route path="/practice" element={<ProtectedRoute session={session}><Practice /></ProtectedRoute>} />
        <Route path="/multiplayer" element={<ProtectedRoute session={session}><Multiplayer /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute session={session}><Profile /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute session={session}><LeaderboardPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
