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

export interface NoteProgress {
  /** mastery score 0..100 */
  mastery: number
  /** total correct answers across both modes */
  correct: number
  /** total incorrect answers */
  incorrect: number
  /** rolling miss patterns for tip selection */
  recentMisses: MissPattern[]
}

export interface PracticeProgress {
  /** index into CURRICULUM marking the active focus note */
  focusIndex: number
  /** per-note progress keyed by NoteName */
  notes: Record<NoteName, NoteProgress>
  /** current round-streak across all notes */
  streak: number
  /** XP earned this session */
  sessionXp: number
}

export interface Tip {
  id: string
  /** which patterns/contexts this tip addresses */
  triggers: Array<MissPattern | 'idle' | 'lesson-start' | 'mastered' | 'first-correct'>
  text: string
  /** optional longer detail / mnemonic */
  detail?: string
}
