import { supabase } from './supabaseClient'
import type { MissPattern, NoteName, NoteStats, PracticeProgress } from '../types'

interface UserRow {
  id: string
  username: string
  email: string
  xp: number | null
  elo: number | null
  streak: number | null
  level: number | null
  level_xp: number | null
  tutorial_completed: number[] | null
}

interface NoteStatRow {
  note: string
  correct: number
  incorrect: number
  recent_misses: string[] | null
}

export interface LoadedProgress {
  xp: number
  practice: Pick<PracticeProgress, 'level' | 'levelXp' | 'tutorialCompleted' | 'notes'>
}

/**
 * Make sure a `users` row exists for this auth user. We pin `users.id` to
 * `auth.uid()` so RLS policies (`auth.uid() = id`) work. Username is derived
 * from the email's local-part with a 4-char suffix from the auth ID for
 * uniqueness.
 */
export async function ensureProfile(userId: string, email: string | null): Promise<void> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "no rows returned" — anything else is unexpected.
    console.warn('[progress] ensureProfile select failed', error)
  }
  if (data) return

  const safeEmail = email ?? `${userId}@unknown.local`
  const usernameBase = safeEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16) || 'player'
  const username = `${usernameBase}_${userId.slice(0, 4)}`

  const { error: insertError } = await supabase.from('users').insert({
    id: userId,
    email: safeEmail,
    username,
  })
  if (insertError) {
    console.warn('[progress] ensureProfile insert failed', insertError)
  }
}

export async function loadProgress(userId: string): Promise<LoadedProgress | null> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, username, email, xp, elo, streak, level, level_xp, tutorial_completed')
    .eq('id', userId)
    .maybeSingle<UserRow>()

  if (userError) {
    console.warn('[progress] loadProgress users failed', userError)
    return null
  }
  if (!user) return null

  const { data: stats, error: statsError } = await supabase
    .from('note_stats')
    .select('note, correct, incorrect, recent_misses')
    .eq('user_id', userId)
    .returns<NoteStatRow[]>()

  if (statsError) {
    console.warn('[progress] loadProgress note_stats failed', statsError)
  }

  const notes: Partial<Record<NoteName, NoteStats>> = {}
  for (const row of stats ?? []) {
    notes[row.note as NoteName] = {
      correct: row.correct,
      incorrect: row.incorrect,
      recentMisses: ((row.recent_misses ?? []) as string[]).filter(isMissPattern),
    }
  }

  return {
    xp: user.xp ?? 0,
    practice: {
      level: user.level ?? 1,
      levelXp: user.level_xp ?? 0,
      tutorialCompleted: user.tutorial_completed ?? [],
      notes,
    },
  }
}

export interface UserProgressPayload {
  xp: number
  level: number
  levelXp: number
  streak: number
  tutorialCompleted: number[]
}

export async function saveUserProgress(
  userId: string,
  payload: UserProgressPayload,
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      xp: payload.xp,
      level: payload.level,
      level_xp: payload.levelXp,
      streak: payload.streak,
      tutorial_completed: payload.tutorialCompleted,
      last_active: new Date().toISOString().slice(0, 10),
    })
    .eq('id', userId)
  if (error) console.warn('[progress] saveUserProgress failed', error)
}

export async function saveNoteStat(
  userId: string,
  note: NoteName,
  stats: NoteStats,
): Promise<void> {
  const { error } = await supabase.from('note_stats').upsert(
    {
      user_id: userId,
      note,
      correct: stats.correct,
      incorrect: stats.incorrect,
      recent_misses: stats.recentMisses,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,note' },
  )
  if (error) console.warn('[progress] saveNoteStat failed', { note, error })
}

const MISS_PATTERNS = new Set<MissPattern>([
  'flat', 'sharp', 'adjacent', 'octave-off', 'fifth-confusion', 'random',
])

function isMissPattern(s: string): s is MissPattern {
  return MISS_PATTERNS.has(s as MissPattern)
}
