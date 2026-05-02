import type { MissPattern, NoteName, Tip } from '../types'

/**
 * Tip catalog. Each tip is tagged with the patterns / contexts in which it is
 * appropriate. The mascot picks the best-matching tip whenever the user errs
 * or hits a milestone.
 */
export const TIPS: Tip[] = [
  // --- Lesson start / encouragement ---
  {
    id: 'welcome',
    triggers: ['lesson-start'],
    text: "Hi, I'm Forte! Let's anchor this note in your ears.",
    detail: 'Listen to the reference twice before you sing — your first reproduction is always more accurate than your guess.',
  },
  {
    id: 'breathe',
    triggers: ['lesson-start', 'idle'],
    text: 'Take a slow breath before you sing. Tense bodies produce tense pitch.',
  },

  // --- Singing flat (under the target) ---
  {
    id: 'flat-yawn',
    triggers: ['flat'],
    text: 'You drifted flat. Try a tiny "yawn" before you sing — it lifts the soft palate and brightens the pitch.',
  },
  {
    id: 'flat-support',
    triggers: ['flat'],
    text: 'Flat again. Push gently from your diaphragm and aim *just above* the note in your head.',
  },

  // --- Singing sharp (over the target) ---
  {
    id: 'sharp-relax',
    triggers: ['sharp'],
    text: 'You went sharp. Drop your shoulders and unclench your jaw — tension squeezes the pitch up.',
  },
  {
    id: 'sharp-aim-low',
    triggers: ['sharp'],
    text: 'Sharp again. Mentally aim for a note one cent below the target; your body will land on it.',
  },

  // --- Adjacent confusion (e.g. C vs D, E vs F) ---
  {
    id: 'adjacent-step',
    triggers: ['adjacent'],
    text: "Close — you picked a neighbour. Whole steps feel 'open', half steps feel 'leaning'. Listen for that lean.",
  },
  {
    id: 'adjacent-mneumonic',
    triggers: ['adjacent'],
    text: 'Use a song you know: C → D is the first two notes of "Frère Jacques". E → F is the leaning half-step in "Jaws".',
  },

  // --- Octave error ---
  {
    id: 'octave-register',
    triggers: ['octave-off'],
    text: "Right note, wrong register! Notice if it sits in your chest, throat, or head before answering.",
  },
  {
    id: 'octave-anchor',
    triggers: ['octave-off'],
    text: 'Anchor every note to A4 (440Hz) — middle of the keyboard. If a note is below it, it lives in chest voice.',
  },

  // --- Fifth / fourth confusion ---
  {
    id: 'fifth-twinkle',
    triggers: ['fifth-confusion'],
    text: "Fifths and fourths sound 'open'. Hum the start of *Twinkle Twinkle*: that leap is a perfect fifth (C → G).",
  },
  {
    id: 'fifth-amazing',
    triggers: ['fifth-confusion'],
    text: 'A perfect fourth is the first leap of *Here Comes the Bride*. Imagine that sound to lock it in.',
  },

  // --- Random/no signal ---
  {
    id: 'random-listen',
    triggers: ['random'],
    text: "Don't guess — re-play the reference and hum it under your breath first. Internalise, then commit.",
  },
  {
    id: 'random-quiet',
    triggers: ['random'],
    text: "I couldn't hear a clear pitch. Move closer to your mic and sustain the note for at least half a second.",
  },

  // --- Milestones ---
  {
    id: 'first-correct',
    triggers: ['first-correct'],
    text: "That's it! Your ear just felt the shape of that note — keep that feeling.",
  },
  {
    id: 'mastered',
    triggers: ['mastered'],
    text: 'Mastered! That note now lives rent-free in your auditory memory. On to the next pillar.',
  },

  // --- Idle encouragement ---
  {
    id: 'idle-curious',
    triggers: ['idle'],
    text: "Curious fact: only ~1 in 10,000 people are born with perfect pitch — but it can be trained.",
  },
  {
    id: 'idle-humming',
    triggers: ['idle'],
    text: 'Hum, then sing. Humming pre-locks your vocal cords on the right pitch.',
  },
]

/**
 * Pick the best tip for a given miss-pattern history. We prefer tips that
 * directly address the most recent miss but vary them so the mascot doesn't
 * repeat itself round after round.
 */
export function pickTipForMiss(
  recentMisses: MissPattern[],
  lastShownId: string | null,
): Tip {
  const last = recentMisses[recentMisses.length - 1]

  // If the user is repeating the same mistake, escalate to a deeper tip.
  const sameStreak = countTrailing(recentMisses, last)
  const candidates = TIPS.filter(t => t.triggers.includes(last))
  const filtered = candidates.filter(t => t.id !== lastShownId)
  const pool = filtered.length > 0 ? filtered : candidates

  if (pool.length === 0) {
    return TIPS.find(t => t.id === 'random-listen') ?? TIPS[0]
  }

  // After 2+ consecutive same-pattern misses, lean toward the second tip if
  // available (tends to be the deeper / more specific one).
  if (sameStreak >= 2 && pool.length > 1) {
    return pool[1]
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

export function pickTipFor(
  trigger: 'lesson-start' | 'idle' | 'mastered' | 'first-correct',
  lastShownId: string | null,
  context?: { note?: NoteName },
): Tip {
  const candidates = TIPS.filter(t => t.triggers.includes(trigger))
  const filtered = candidates.filter(t => t.id !== lastShownId)
  const pool = filtered.length > 0 ? filtered : candidates
  const tip = pool[Math.floor(Math.random() * pool.length)] ?? TIPS[0]
  if (trigger === 'lesson-start' && context?.note) {
    return {
      ...tip,
      text: `${tip.text} Today's note: ${context.note.replace('#', '♯')}.`,
    }
  }
  return tip
}

function countTrailing<T>(arr: T[], value: T): number {
  let n = 0
  for (let i = arr.length - 1; i >= 0 && arr[i] === value; i--) n++
  return n
}
