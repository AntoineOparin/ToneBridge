import type { NoteName, PitchClass } from '../types'

export const PITCH_CLASSES: PitchClass[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
]

const A4_HZ = 440
const A4_MIDI = 69

/** MIDI numbers covering A0 (21) through C8 (108). */
const MIDI_RANGE = { min: 21, max: 108 } as const

function midiToHz(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12)
}

function midiToName(midi: number): NoteName {
  const pc = PITCH_CLASSES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${pc}${octave}` as NoteName
}

export const NOTE_FREQUENCIES: Record<NoteName, number> = (() => {
  const out: Record<string, number> = {}
  for (let m = MIDI_RANGE.min; m <= MIDI_RANGE.max; m++) {
    out[midiToName(m)] = Number(midiToHz(m).toFixed(2))
  }
  return out as Record<NoteName, number>
})()

/**
 * Lesson curriculum: the order in which singleplayer practice unlocks notes.
 * We keep it diatonic in C major within a single comfortable octave so beginners
 * can anchor everything to a familiar reference, then add the upper C5 to
 * cement octave perception before sharps/flats are introduced.
 */
export const CURRICULUM: NoteName[] = [
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5',
]

/** XP awarded per correct answer (modulated by streak). */
export const BASE_XP_PER_CORRECT = 10
/** XP awarded once a note is fully mastered. */
export const MASTERY_XP = 250

/** Mastery score adjustments. */
export const MASTERY_GAIN_CORRECT = 12
export const MASTERY_LOSS_INCORRECT = 4
export const MASTERY_THRESHOLD = 100

/** Cents tolerance for the singing mode (±). */
export const SINGING_CENTS_TOLERANCE = 60
/** How long the user has to hold the target note (ms) for credit. */
export const SINGING_HOLD_MS = 450
/** Minimum pitchy clarity reading before we trust the result. */
export const PITCH_CLARITY_THRESHOLD = 0.92
/** Round time budget per attempt in either mode. */
export const ROUND_TIME_LIMIT_MS = 12_000

/** Distractor count for the identify mode (target + N-1 distractors). */
export const IDENTIFY_CHOICES = 4
