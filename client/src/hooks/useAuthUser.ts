import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export interface AuthUserSummary {
  id: string
  email: string | null
  /** ISO timestamp the auth user was created. */
  createdAt: string | null
  /** Display name from Google OAuth metadata, when available. */
  fullName: string | null
  /** Avatar URL from OAuth metadata, when available. */
  avatarUrl: string | null
}

function summarise(user: User | null): AuthUserSummary | null {
  if (!user) return null
  const meta = (user.user_metadata ?? {}) as {
    full_name?: string
    name?: string
    avatar_url?: string
    picture?: string
  }
  return {
    id: user.id,
    email: user.email ?? null,
    createdAt: user.created_at ?? null,
    fullName: meta.full_name ?? meta.name ?? null,
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
  }
}

/**
 * Reactive accessor for the currently authenticated Supabase user. Returns
 * `null` while loading or when signed out.
 */
export function useAuthUser(): AuthUserSummary | null {
  const [user, setUser] = useState<AuthUserSummary | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUser(summarise(data.user))
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(summarise(session?.user ?? null))
    })
    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return user
}
