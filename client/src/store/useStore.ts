import { create } from 'zustand'

interface AppState {
  userId: string | null
  xp: number
  setUserId: (id: string) => void
  addXp: (amount: number) => void
}

export const useStore = create<AppState>((set) => ({
  userId: null,
  xp: 0,
  setUserId: (id) => set({ userId: id }),
  addXp: (amount) => set((s) => ({ xp: s.xp + amount })),
}))
