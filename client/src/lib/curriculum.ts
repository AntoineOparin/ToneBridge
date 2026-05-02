import type { NoteName, NoteProgress, PracticeProgress } from '../types'
import {
  CURRICULUM,
  MASTERY_GAIN_CORRECT,
  MASTERY_LOSS_INCORRECT,
  MASTERY_THRESHOLD,
} from './constants'

export function emptyNoteProgress(): NoteProgress {
  return { mastery: 0, correct: 0, incorrect: 0, recentMisses: [] }
}

export function initialPracticeProgress(): PracticeProgress {
  const notes: Record<string, NoteProgress> = {}
  for (const n of CURRICULUM) notes[n] = emptyNoteProgress()
  return {
    focusIndex: 0,
    notes: notes as Record<NoteName, NoteProgress>,
    streak: 0,
    sessionXp: 0,
  }
}

/** The note currently being trained (always defined while CURRICULUM has items). */
export function currentFocusNote(progress: PracticeProgress): NoteName {
  const idx = Math.min(progress.focusIndex, CURRICULUM.length - 1)
  return CURRICULUM[idx]
}

/** The note that comes next after the focus note, or null if the curriculum is complete. */
export function nextFocusNote(progress: PracticeProgress): NoteName | null {
  const idx = progress.focusIndex + 1
  return idx < CURRICULUM.length ? CURRICULUM[idx] : null
}

/** All notes the user has been exposed to so far (current + previously mastered). */
export function unlockedNotes(progress: PracticeProgress): NoteName[] {
  return CURRICULUM.slice(0, Math.min(progress.focusIndex + 1, CURRICULUM.length))
}

export function applyCorrect(p: NoteProgress): NoteProgress {
  return {
    ...p,
    mastery: Math.min(MASTERY_THRESHOLD, p.mastery + MASTERY_GAIN_CORRECT),
    correct: p.correct + 1,
  }
}

export function applyIncorrect(p: NoteProgress, miss: NoteProgress['recentMisses'][number]): NoteProgress {
  const recent = [...p.recentMisses, miss].slice(-6)
  return {
    ...p,
    mastery: Math.max(0, p.mastery - MASTERY_LOSS_INCORRECT),
    incorrect: p.incorrect + 1,
    recentMisses: recent,
  }
}

export function isMastered(p: NoteProgress): boolean {
  return p.mastery >= MASTERY_THRESHOLD
}
