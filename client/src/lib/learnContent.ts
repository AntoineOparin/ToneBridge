import type { PitchClass } from '../types'

/** Reference octave for ear-training demos on this page. */
export const LEARN_REFERENCE_OCTAVE = 4 as const

export interface PitchTip {
  recognize: string
  sing: string
}

/** Mnemonics and coaching copy per pitch class (octave-agnostic). */
export const PITCH_TIPS: Record<PitchClass, PitchTip> = {
  C: {
    recognize:
      'Often feels “home” in major keys. Imagine the solid foundation under “Happy Birthday” opening.',
    sing:
      'Relax your jaw; aim for a rounded vowel so you don’t scoop flat.',
  },
  'C#': {
    recognize:
      'The leading tone tension toward D — slightly brighter than C; hear the half-step “lean”.',
    sing:
      'Brighten slightly compared to C — think “narrow vowel,” not louder.',
  },
  D: {
    recognize:
      'Major scale degree 2 — opens upward like “Frère Jacques” first neighbor.',
    sing:
      'Keep chest resonance light so you don’t push sharp.',
  },
  'D#': {
    recognize:
      'Between D and E — small half-step; compare against both anchors.',
    sing:
      'Tiny lift from D; avoid clenching — tension pushes sharp.',
  },
  E: {
    recognize:
      'Major third up from C — warm, stable “bright middle”.',
    sing:
      'Lift soft palate; E likes space so it doesn’t pinch sharp.',
  },
  F: {
    recognize:
      'Fourth above C — feels wider than a third; “Here Comes the Bride” leap.',
    sing:
      'Lower jaw slightly from E and stay relaxed below E.',
  },
  'F#': {
    recognize:
      'Trailing tone toward G — notice the leading-tone pull if resolving upward.',
    sing:
      'Bright edge without tightening throat.',
  },
  G: {
    recognize:
      'Perfect fifth from C — strong anchor (Twinkle → fifth leap).',
    sing:
      'Forward placement but grounded breath.',
  },
  'G#': {
    recognize:
      'Between G and A — chromatic step; listen for the smallest slide.',
    sing:
      'Minimal lift from G; control airspeed.',
  },
  A: {
    recognize:
      'Orchestral tuning reference (440 Hz @ A4). Familiar “bright open” quality.',
    sing:
      'Neutral resonance — neither swallowed nor pushed sharp.',
  },
  'A#': {
    recognize:
      'Half-step under B — lean toward B without committing.',
    sing:
      'Keep vowel narrow between A and B.',
  },
  B: {
    recognize:
      'Leading tone into C — strongest pull to tonic in major.',
    sing:
      'Forward tilt toward resolution without squeezing.',
  },
}

export interface LearnArticle {
  id: string
  title: string
  subtitle: string
  bullets: string[]
}

export const ARTICLES: LearnArticle[] = [
  {
    id: 'cents',
    title: 'Cents — measuring pitch error',
    subtitle: 'One hundredth of a semitone',
    bullets: [
      'Music divides each octave into 12 semitones. Between semitones there are 100 cents: sharp means positive cents, flat means negative.',
      '±50¢ sounds noticeably wrong on sustained tones; within ±25¢ feels close on fast drills.',
      'Formula hint: one octave doubles frequency (×2 Hz); each semitone multiplies by 2^(1/12).',
      'Train by humming until your tuner reads ~0¢ instead of guessing letter names first.',
    ],
  },
  {
    id: 'hz',
    title: 'Frequency & equal temperament',
    subtitle: 'Hz tells you how fast the air vibrates',
    bullets: [
      'A4 = 440 Hz is the usual tuning anchor — concert pitch.',
      'Going one octave up doubles Hz; one semitone ≈ 6% change in frequency.',
      'Equal temperament spreads tiny compromises so all keys work — relative intervals matter more than “perfect Hz”.',
      'Your ear compares intervals (distance between two notes), not absolute Hz.',
    ],
  },
  {
    id: 'intervals',
    title: 'Intervals — your ear’s shortcuts',
    subtitle: 'Relative distances stay constant across octaves',
    bullets: [
      'A **perfect fifth** (e.g. C→G) feels open and stable — root of power chords.',
      'A **major third** is wider than a minor third — brightness vs warmth.',
      'Use famous melodies as anchors: **minor third** opening of “Greensleeves”, **fourth** start of “Here Comes the Bride”.',
      'Sing both notes back-to-back before naming them — naming comes after matching.',
    ],
  },
  {
    id: 'register',
    title: 'Registers — chest, mix, head',
    subtitle: 'Same pitch class can live in different resonances',
    bullets: [
      'Low notes resonate in the chest; high notes lift into head voice — **same letter name** can feel different.',
      'Octave errors happen when you recognize the pitch class but sing the wrong register.',
      'Anchor **A4** mentally as “middle”: anything below sits lower in the body.',
      'Hum quietly first — it pre-lights the vocal folds on the target frequency.',
    ],
  },
]
