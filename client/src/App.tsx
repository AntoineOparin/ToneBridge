import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import type { Session } from '@supabase/supabase-js'
import Home from './pages/Home'
import Learn from './pages/Learn'
import Practice from './pages/Practice'
import Multiplayer from './pages/Multiplayer'
import Profile from './pages/Profile'
import Login from './pages/Login'

function ProtectedRoute({ session, children }: { session: Session | null; children: JSX.Element }) {
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
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute session={session}><Home /></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute session={session}><Learn /></ProtectedRoute>} />
        <Route path="/practice" element={<ProtectedRoute session={session}><Practice /></ProtectedRoute>} />
        <Route path="/multiplayer" element={<ProtectedRoute session={session}><Multiplayer /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute session={session}><Profile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
