import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import {
  ensureProfile,
  loadProgress,
  saveNoteStat,
  saveUserProgress,
} from '../lib/progressService'
import type { NoteName, NoteStats, PracticeProgress } from '../types'

interface SyncSnapshot {
  xp: number
  practice: PracticeProgress
}

const SAVE_DEBOUNCE_MS = 700

/**
 * Hydrates the Zustand store from Supabase on login, then writes any subsequent
 * store changes back to the database in a debounced, diff-based fashion. Only
 * the rows that actually changed are sent to Supabase, which keeps writes cheap
 * and avoids round-tripping the entire practice state on every round.
 */
export function useProgressSync(userId: string | null, email: string | null): void {
  const lastSaved = useRef<SyncSnapshot | null>(null)
  const debounceRef = useRef<number | null>(null)
  const flushingRef = useRef(false)
  const hydratedRef = useRef<string | null>(null)

  // ---- Hydrate from DB once per user/session ------------------------
  useEffect(() => {
    if (!userId) {
      hydratedRef.current = null
      lastSaved.current = null
      return
    }
    if (hydratedRef.current === userId) return

    let cancelled = false
    ;(async () => {
      try {
        await ensureProfile(userId, email)
        const loaded = await loadProgress(userId)
        if (cancelled) return

        if (loaded) {
          // DB exists for this user: it wins. Merge into the live store while
          // preserving session-only fields (streak, sessionXp).
          useStore.setState((s) => ({
            userId,
            xp: loaded.xp,
            practice: {
              ...s.practice,
              level: loaded.practice.level,
              levelXp: loaded.practice.levelXp,
              tutorialCompleted: loaded.practice.tutorialCompleted,
              notes: loaded.practice.notes,
            },
          }))
        } else {
          // First-time user: keep whatever's already in the store (which may
          // include localStorage-cached progress from a logged-out session) and
          // write it up so future logins resume correctly.
          useStore.setState({ userId })
        }

        hydratedRef.current = userId
        const state = useStore.getState()
        lastSaved.current = { xp: state.xp, practice: state.practice }
        // Push initial state up if this is a brand-new user.
        if (!loaded) await flush(userId, lastSaved)
      } catch (err) {
        console.warn('[progress] hydrate failed', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, email])

  // ---- Subscribe to store changes and debounce-save ----------------
  useEffect(() => {
    if (!userId) return
    const unsub = useStore.subscribe(() => {
      if (hydratedRef.current !== userId) return
      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(async () => {
        if (flushingRef.current) return
        flushingRef.current = true
        try {
          await flush(userId, lastSaved)
        } finally {
          flushingRef.current = false
        }
      }, SAVE_DEBOUNCE_MS)
    })
    return () => {
      unsub()
      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    }
  }, [userId])

  // ---- Flush on tab close / page hide ------------------------------
  useEffect(() => {
    if (!userId) return
    const handler = () => {
      if (hydratedRef.current !== userId) return
      // Best-effort, fire-and-forget.
      void flush(userId, lastSaved)
    }
    window.addEventListener('beforeunload', handler)
    window.addEventListener('pagehide', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
      window.removeEventListener('pagehide', handler)
    }
  }, [userId])
}

async function flush(
  userId: string,
  lastSavedRef: React.MutableRefObject<SyncSnapshot | null>,
): Promise<void> {
  const prev = lastSavedRef.current
  const state = useStore.getState()
  const xp = state.xp
  const practice = state.practice

  const userChanged =
    !prev ||
    prev.xp !== xp ||
    prev.practice.level !== practice.level ||
    prev.practice.levelXp !== practice.levelXp ||
    prev.practice.streak !== practice.streak ||
    !arrayEqual(prev.practice.tutorialCompleted, practice.tutorialCompleted)

  if (userChanged) {
    await saveUserProgress(userId, {
      xp,
      level: practice.level,
      levelXp: practice.levelXp,
      streak: practice.streak,
      tutorialCompleted: practice.tutorialCompleted,
    })
  }

  // Diff per-note stats and write only what changed.
  const noteEntries = Object.entries(practice.notes) as [NoteName, NoteStats | undefined][]
  for (const [note, cur] of noteEntries) {
    if (!cur) continue
    const before = prev?.practice.notes[note]
    const changed =
      !before ||
      before.correct !== cur.correct ||
      before.incorrect !== cur.incorrect ||
      !arrayEqual(before.recentMisses, cur.recentMisses)
    if (changed) {
      await saveNoteStat(userId, note, cur)
    }
  }

  lastSavedRef.current = { xp, practice }
}

function arrayEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}
