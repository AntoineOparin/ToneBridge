import type { MissPattern, NoteName, NoteStats, PracticeLevel, PracticeProgress } from '../types'
import { LEVELS, MAX_LEVEL } from './constants'

export function emptyNoteStats(): NoteStats {
  return { correct: 0, incorrect: 0, recentMisses: [] }
}

export function initialPracticeProgress(): PracticeProgress {
  return {
    level: 1,
    levelXp: 0,
    notes: {},
    streak: 0,
    sessionXp: 0,
    tutorialCompleted: [],
  }
}

export function getLevel(id: number): PracticeLevel {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, id))
  return LEVELS[clamped - 1]
}

export function currentLevel(progress: PracticeProgress): PracticeLevel {
  return getLevel(progress.level)
}

export function nextLevel(progress: PracticeProgress): PracticeLevel | null {
  return progress.level < MAX_LEVEL ? getLevel(progress.level + 1) : null
}

export function levelProgressPct(progress: PracticeProgress): number {
  const lvl = currentLevel(progress)
  return Math.min(100, Math.round((progress.levelXp / lvl.xpToComplete) * 100))
}

export function isLevelComplete(progress: PracticeProgress): boolean {
  return progress.levelXp >= currentLevel(progress).xpToComplete
}

export function hasSeenTutorial(progress: PracticeProgress, levelId: number): boolean {
  return progress.tutorialCompleted.includes(levelId)
}

/**
 * Pick a random target note from the current level's pool. Targets are
 * weighted toward notes the user has *struggled* with (to give them more reps)
 * but still ensure at least 25% of the time we pick a fresh note.
 */
export function pickTarget(
  progress: PracticeProgress,
  previous: NoteName | null,
): NoteName {
  const level = currentLevel(progress)
  const pool = level.notes
  if (pool.length === 1) return pool[0]

  // Build a weight per note: base 1, +1 per recent incorrect (capped), -0.4 if
  // it was the last target (avoid back-to-back repeats).
  const weights = pool.map((note) => {
    const stats = progress.notes[note]
    let w = 1
    if (stats) {
      const accuracy = stats.correct + stats.incorrect > 0
        ? stats.correct / (stats.correct + stats.incorrect)
        : 1
      // Lower accuracy → higher weight, capped at +2.
      w += Math.min(2, (1 - accuracy) * 3)
      // Newly introduced notes that haven't been answered yet get a boost.
      if (stats.correct === 0 && stats.incorrect === 0) w += 1.2
    } else {
      w += 1.5 // never seen this note → prioritise it
    }
    if (note === previous) w *= 0.4
    return w
  })

  const total = weights.reduce((s, w) => s + w, 0)
  let r = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

export function applyCorrect(stats: NoteStats | undefined): NoteStats {
  const base = stats ?? emptyNoteStats()
  return { ...base, correct: base.correct + 1 }
}

export function applyIncorrect(
  stats: NoteStats | undefined,
  miss: MissPattern,
): NoteStats {
  const base = stats ?? emptyNoteStats()
  return {
    ...base,
    incorrect: base.incorrect + 1,
    recentMisses: [...base.recentMisses, miss].slice(-6),
  }
}
