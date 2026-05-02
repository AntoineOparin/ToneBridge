import type { MissPattern, NoteInfo, NoteName, PitchClass } from '../types'
import { NOTE_FREQUENCIES, PITCH_CLASSES } from './constants'

const A4_HZ = 440
const A4_MIDI = 69

export function hzToMidi(hz: number): number {
  return 12 * Math.log2(hz / A4_HZ) + A4_MIDI
}

export function midiToHz(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12)
}

export function midiToNoteName(midi: number): NoteName {
  const rounded = Math.round(midi)
  const pc = PITCH_CLASSES[((rounded % 12) + 12) % 12]
  const octave = Math.floor(rounded / 12) - 1
  return `${pc}${octave}` as NoteName
}

/** Convert a frequency (Hz) to the nearest named note (e.g. 442 → "A4"). */
export function hzToNote(hz: number): NoteName | '' {
  if (!Number.isFinite(hz) || hz <= 0) return ''
  return midiToNoteName(hzToMidi(hz))
}

/**
 * Cents deviation between an observed frequency and a target frequency.
 * Positive = sharp (above target), negative = flat (below target).
 */
export function centDeviation(hz: number, targetHz: number): number {
  if (!Number.isFinite(hz) || hz <= 0 || targetHz <= 0) return 0
  return 1200 * Math.log2(hz / targetHz)
}

/** Cents deviation from the *nearest* named note (octave-agnostic). */
export function centsFromNearestNote(hz: number): number {
  if (!Number.isFinite(hz) || hz <= 0) return 0
  const midi = hzToMidi(hz)
  const nearest = Math.round(midi)
  return (midi - nearest) * 100
}

/** Parse a note name into its components. */
export function parseNote(name: NoteName): NoteInfo {
  const match = /^([A-G]#?)(-?\d+)$/.exec(name)
  if (!match) {
    throw new Error(`Invalid note name: ${name}`)
  }
  const pitchClass = match[1] as PitchClass
  const octave = parseInt(match[2], 10)
  const pcIndex = PITCH_CLASSES.indexOf(pitchClass)
  const midi = (octave + 1) * 12 + pcIndex
  return {
    name,
    pitchClass,
    octave,
    midi,
    hz: NOTE_FREQUENCIES[name] ?? midiToHz(midi),
  }
}

/** True if `a` and `b` share a pitch class (e.g. C4 and C5). */
export function sameOctaveClass(a: NoteName, b: NoteName): boolean {
  return parseNote(a).pitchClass === parseNote(b).pitchClass
}

/** Number of semitones between two notes (signed). */
export function semitoneDistance(a: NoteName, b: NoteName): number {
  return parseNote(b).midi - parseNote(a).midi
}

/**
 * Classify what kind of mistake the user made when they answered `answer`
 * for `target`. Used to pick contextual tips from the mascot.
 */
export function classifyMiss(target: NoteName, answer: NoteName | null, centsOff: number | null): MissPattern {
  if (centsOff !== null && Math.abs(centsOff) > 30) {
    return centsOff < 0 ? 'flat' : 'sharp'
  }
  if (!answer) return 'random'

  const distance = semitoneDistance(target, answer)
  const abs = Math.abs(distance)
  if (abs === 0) return 'random'
  if (abs % 12 === 0) return 'octave-off'
  if (abs === 7 || abs === 5) return 'fifth-confusion'
  if (abs <= 2) return 'adjacent'
  return 'random'
}

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Build the multiple-choice set for identify mode. **Only notes from `pool`**
 * ever appear — never neighbours from outside the current practice set.
 * If the pool is smaller than `maxChoices`, every practising note is shown.
 */
export function buildIdentifyOptionSet(
  target: NoteName,
  pool: NoteName[],
  maxChoices: number,
): NoteName[] {
  const unique = [...new Set(pool)]
  if (unique.length <= maxChoices) {
    return shuffleArray(unique)
  }
  const others = unique.filter((n) => n !== target)
  const distractorCount = maxChoices - 1
  const picked = shuffleArray(others).slice(0, distractorCount)
  return shuffleArray([target, ...picked])
}

/** Pretty-print a note with proper sharp glyph (e.g. "C#4" → "C♯4"). */
export function prettyNote(name: NoteName): string {
  return name.replace('#', '♯')
}
