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

/**
 * Pick `count` distinct distractor notes for the identify mode. Distractors are
 * drawn from notes the user has already encountered so the pool always feels
 * familiar; if not enough are available we fall back to neighbours of `target`.
 */
export function pickDistractors(
  target: NoteName,
  pool: NoteName[],
  count: number,
): NoteName[] {
  const candidates = new Set<NoteName>()
  for (const n of pool) {
    if (n !== target) candidates.add(n)
  }

  if (candidates.size < count) {
    const targetMidi = parseNote(target).midi
    for (let offset = 1; candidates.size < count + 1 && offset <= 12; offset++) {
      const up = midiToNoteName(targetMidi + offset)
      const down = midiToNoteName(targetMidi - offset)
      if (up !== target) candidates.add(up)
      if (down !== target) candidates.add(down)
    }
  }

  const arr = Array.from(candidates)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, count)
}

/** Pretty-print a note with proper sharp glyph (e.g. "C#4" → "C♯4"). */
export function prettyNote(name: NoteName): string {
  return name.replace('#', '♯')
}
