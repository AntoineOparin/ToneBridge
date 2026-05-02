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
import Login from './pages/Login'
import { useProgressSync } from './hooks/useProgressSync'
import { useStore } from './store/useStore'
import { initialPracticeProgress } from './lib/curriculum'

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
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      // On explicit sign-out, wipe the local store so the next user gets a
      // clean slate (otherwise zustand-persist would leak the prior user's
      // cached progress into their session before DB hydration completes).
      if (event === 'SIGNED_OUT') {
        useStore.setState({
          userId: null,
          xp: 0,
          practice: initialPracticeProgress(),
        })
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Sync practice progress with Supabase whenever a session is active. The
  // hook hydrates the Zustand store from the DB on login, then debounce-saves
  // any subsequent changes back to Supabase.
  useProgressSync(session?.user?.id ?? null, session?.user?.email ?? null)

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
      </Routes>
    </BrowserRouter>
  )
}
