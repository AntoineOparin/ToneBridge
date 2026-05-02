import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  applyCorrect,
  applyIncorrect,
  currentLevel,
  initialPracticeProgress,
  isLevelComplete,
} from '../lib/curriculum'
import {
  BASE_XP_PER_CORRECT,
  LEVEL_UP_XP,
  MAX_LEVEL,
} from '../lib/constants'
import type { MissPattern, NoteName, PracticeProgress } from '../types'

interface AppState {
  userId: string | null
  username: string | null
  xp: number
  practice: PracticeProgress

  setUserId: (id: string) => void
  setUsername: (name: string) => void
  addXp: (amount: number) => void

  /** Record a correct answer for `note`. Returns true if the level just completed. */
  recordCorrect: (note: NoteName) => boolean
  /** Record an incorrect answer for `note`, with the classified miss pattern. */
  recordIncorrect: (note: NoteName, miss: MissPattern) => void
  /** Advance to the next level after the level-up animation finishes. */
  advanceLevel: () => void
  /** Mark the intro tutorial for `levelId` as seen. */
  markTutorialComplete: (levelId: number) => void
  /** Reset session-only stats without losing level progress. */
  resetSession: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      username: null,
      xp: 0,
      practice: initialPracticeProgress(),

      setUserId: (id) => set({ userId: id }),
      setUsername: (name) => set({ username: name }),
      addXp: (amount) => set((s) => ({ xp: s.xp + amount })),

      recordCorrect: (note) => {
        const { practice } = get()
        const updatedStats = applyCorrect(practice.notes[note])
        const streak = practice.streak + 1
        const xpGained = BASE_XP_PER_CORRECT + Math.min(50, streak * 2)
        const nextLevelXp = practice.levelXp + 1

        const nextProgress: PracticeProgress = {
          ...practice,
          levelXp: nextLevelXp,
          streak,
          sessionXp: practice.sessionXp + xpGained,
          notes: { ...practice.notes, [note]: updatedStats },
        }
        const cleared = isLevelComplete(nextProgress)

        set({
          practice: cleared
            ? { ...nextProgress, sessionXp: nextProgress.sessionXp + LEVEL_UP_XP }
            : nextProgress,
          xp: get().xp + xpGained + (cleared ? LEVEL_UP_XP : 0),
        })
        return cleared
      },

      recordIncorrect: (note, miss) => {
        const { practice } = get()
        const updatedStats = applyIncorrect(practice.notes[note], miss)
        set({
          practice: {
            ...practice,
            streak: 0,
            notes: { ...practice.notes, [note]: updatedStats },
          },
        })
      },

      advanceLevel: () => {
        const { practice } = get()
        if (practice.level >= MAX_LEVEL) return
        set({
          practice: {
            ...practice,
            level: practice.level + 1,
            levelXp: 0,
          },
        })
      },

      markTutorialComplete: (levelId) => {
        const { practice } = get()
        if (practice.tutorialCompleted.includes(levelId)) return
        set({
          practice: {
            ...practice,
            tutorialCompleted: [...practice.tutorialCompleted, levelId],
          },
        })
      },

      resetSession: () => {
        const { practice } = get()
        set({
          practice: { ...practice, streak: 0, sessionXp: 0 },
        })
      },
    }),
    {
      name: 'tonebridge-progress',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        xp: state.xp,
        practice: state.practice,
      }),
    },
  ),
)

/** Convenience selector — current level definition. */
export function useCurrentLevel() {
  return useStore((s) => currentLevel(s.practice))
}
