import { create } from 'zustand'
import {
  applyCorrect,
  applyIncorrect,
  initialPracticeProgress,
  isMastered,
} from '../lib/curriculum'
import { BASE_XP_PER_CORRECT, MASTERY_XP } from '../lib/constants'
import type { MissPattern, NoteName, PracticeProgress } from '../types'

interface AppState {
  userId: string | null
  username: string | null
  xp: number
  level: number
  practice: PracticeProgress

  setUserId: (id: string) => void
  setUsername: (name: string) => void
  addXp: (amount: number) => void

  /** Record a correct answer for `note`. Returns true if the note just reached mastery. */
  recordCorrect: (note: NoteName) => boolean
  /** Record an incorrect answer for `note`, with the classified miss pattern. */
  recordIncorrect: (note: NoteName, miss: MissPattern) => void
  /** Advance to the next note in the curriculum (after mastery animation). */
  advanceFocus: () => void
  /** Reset session-only stats (XP popups, streak) without losing mastery. */
  resetSession: () => void
}

export const useStore = create<AppState>((set, get) => ({
  userId: null,
  username: null,
  xp: 0,
  level: 1,
  practice: initialPracticeProgress(),

  setUserId: (id) => set({ userId: id }),
  setUsername: (name) => set({ username: name }),
  addXp: (amount) => set((s) => ({ xp: s.xp + amount })),

  recordCorrect: (note) => {
    const before = get().practice.notes[note]
    const wasMastered = isMastered(before)
    const updated = applyCorrect(before)
    const justMastered = !wasMastered && isMastered(updated)
    const streak = get().practice.streak + 1
    const xpGained = BASE_XP_PER_CORRECT + Math.min(50, streak * 2)
    set((s) => ({
      practice: {
        ...s.practice,
        streak,
        sessionXp: s.practice.sessionXp + xpGained + (justMastered ? MASTERY_XP : 0),
        notes: { ...s.practice.notes, [note]: updated },
      },
      xp: s.xp + xpGained + (justMastered ? MASTERY_XP : 0),
    }))
    return justMastered
  },

  recordIncorrect: (note, miss) => {
    const updated = applyIncorrect(get().practice.notes[note], miss)
    set((s) => ({
      practice: {
        ...s.practice,
        streak: 0,
        notes: { ...s.practice.notes, [note]: updated },
      },
    }))
  },

  advanceFocus: () =>
    set((s) => ({
      practice: {
        ...s.practice,
        focusIndex: s.practice.focusIndex + 1,
      },
    })),

  resetSession: () =>
    set((s) => ({
      practice: { ...s.practice, streak: 0, sessionXp: 0 },
    })),
}))
