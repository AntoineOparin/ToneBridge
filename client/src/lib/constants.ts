import type { NoteName, PitchClass, PracticeLevel } from '../types'

export const PITCH_CLASSES: PitchClass[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
]

const A4_HZ = 440
const A4_MIDI = 69

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
 * Level progression. Each level introduces a few new notes; targets within a
 * level are randomised across that level's full pool, so simply clicking the
 * "current focus" never works — the user must actually identify the note.
 */
export const LEVELS: PracticeLevel[] = [
  {
    id: 1,
    title: 'White-Key Triad',
    description: 'Three neighbours: C, D, E. Anchor your ear to the major triad.',
    notes: ['C4', 'D4', 'E4'],
    newNotes: ['C4', 'D4', 'E4'],
    xpToComplete: 12,
  },
  {
    id: 2,
    title: 'Pentascale',
    description: 'Add F and G — the first five notes of "Do Re Mi".',
    notes: ['C4', 'D4', 'E4', 'F4', 'G4'],
    newNotes: ['F4', 'G4'],
    xpToComplete: 16,
  },
  {
    id: 3,
    title: 'Diatonic Major',
    description: 'A and B complete the major scale across one octave.',
    notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
    newNotes: ['A4', 'B4'],
    xpToComplete: 20,
  },
  {
    id: 4,
    title: 'Octave Bridge',
    description: 'C5 closes the octave. Train your ear on register, not just letter.',
    notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    newNotes: ['C5'],
    xpToComplete: 24,
  },
  {
    id: 5,
    title: 'First Sharps',
    description: 'F♯ and B♭ — the two black keys closest to the diatonic notes you know.',
    notes: ['C4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'A4', 'A#4', 'B4', 'C5'],
    newNotes: ['F#4', 'A#4'],
    xpToComplete: 28,
  },
  {
    id: 6,
    title: 'Full Chromatic',
    description: 'All twelve pitch classes. Any note, any time.',
    notes: [
      'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4',
      'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5',
    ],
    newNotes: ['C#4', 'D#4', 'G#4'],
    xpToComplete: 32,
  },
]

export const MAX_LEVEL = LEVELS.length

/** XP awarded per correct answer (modulated by streak). */
export const BASE_XP_PER_CORRECT = 10
/** Bonus XP awarded once a level is cleared. */
export const LEVEL_UP_XP = 250

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
