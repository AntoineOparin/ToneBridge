export type PitchClass = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'

export type NoteName = `${PitchClass}${number}`

export interface NoteInfo {
  name: NoteName
  pitchClass: PitchClass
  octave: number
  midi: number
  hz: number
}

export type PracticeMode = 'sing' | 'identify'

export type RoundOutcome = 'correct' | 'incorrect' | 'pending'

export interface RoundResult {
  mode: PracticeMode
  target: NoteName
  answer: NoteName | null
  outcome: RoundOutcome
  timeMs: number
  centsOff: number | null
}

export type MissPattern =
  | 'flat'
  | 'sharp'
  | 'adjacent'
  | 'octave-off'
  | 'fifth-confusion'
  | 'random'

export interface PracticeLevel {
  /** 1-indexed level number. */
  id: number
  title: string
  /** Short flavour line shown in the level header / tutorial. */
  description: string
  /** Every note that can appear as a target / option at this level. */
  notes: NoteName[]
  /** Notes added vs the previous level — highlighted on level-up. */
  newNotes: NoteName[]
  /** Correct answers required to clear this level. */
  xpToComplete: number
}

export interface NoteStats {
  correct: number
  incorrect: number
  recentMisses: MissPattern[]
}

export interface PracticeProgress {
  /** Current 1-indexed level the user is training. */
  level: number
  /** Correct answers earned within the current level. */
  levelXp: number
  /** Per-note running stats (used for tip targeting). */
  notes: Partial<Record<NoteName, NoteStats>>
  /** Round-streak across all notes. */
  streak: number
  /** XP earned across the current session (for the HUD). */
  sessionXp: number
  /** Levels for which the user has already seen the intro tutorial. */
  tutorialCompleted: number[]
}

export interface Tip {
  id: string
  triggers: Array<MissPattern | 'idle' | 'lesson-start' | 'level-up' | 'first-correct'>
  text: string
  detail?: string
}
