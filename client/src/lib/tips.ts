import type { MascotTipContext, MissPattern, NoteName, Tip } from '../types'
import { prettyNote } from './noteUtils'

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
    id: 'level-up',
    triggers: ['level-up'],
    text: 'Level up! New notes are coming — your ear just expanded its vocabulary.',
  },
  {
    id: 'level-up-sharps',
    triggers: ['level-up'],
    text: 'Sharps and flats live *between* the white keys. Their character is "leaning" — half-steps in motion.',
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

  // --- Mascot hover — quick micro-hints (Practice page, dwell on Forte) ---
  {
    id: 'mc-hover-breath',
    triggers: ['mascot-hover'],
    text: "I'm Forte — hover here whenever you need a whisper of wisdom.",
    detail: 'One slow breath clears mental noise before you listen or sing.',
  },
  {
    id: 'mc-hover-ear',
    triggers: ['mascot-hover'],
    text: 'Your ear learns faster when you guess wrong once — mistakes are data.',
    detail: 'Replay the reference; imagine the shape before you answer.',
  },
  {
    id: 'mc-hover-cents',
    triggers: ['mascot-hover'],
    text: 'Think in cents, not panic — tiny adjustments beat big jumps.',
    detail: 'Sharp = pull back air; flat = brighten your vowel slightly.',
  },
  {
    id: 'mc-hover-body',
    triggers: ['mascot-hover'],
    text: 'Shoulders down, jaw soft — your pitch lives in relaxation.',
    detail: 'Tension creeps pitch sharp on almost everyone.',
  },
  {
    id: 'mc-hover-interval',
    triggers: ['mascot-hover'],
    text: 'Intervals are friendships between notes — remember songs, not letters.',
    detail: 'Hum a tune you know that starts with the same leap.',
  },
  {
    id: 'mc-hover-streak',
    triggers: ['mascot-hover'],
    text: 'Streaks are fun, but accuracy beats speed every time.',
    detail: 'Slow down one round if you feel rushed.',
  },

  // --- Mascot click — deeper coaching when you tap Forte ---
  {
    id: 'mc-click-coach',
    triggers: ['mascot-click'],
    text: "You've got this — I'm your pocket vocal coach.",
    detail:
      'Identify mode: eliminate obvious wrong tiles first, then compare finalists. Sing mode: hear the reference, hum, then sing on one steady breath.',
  },
  {
    id: 'mc-click-identify',
    triggers: ['mascot-click'],
    text: 'Naming the note is pattern-matching — build a mental keyboard.',
    detail:
      'Ask: does it feel low in the chest or brighter above? That narrows register before letter.',
  },
  {
    id: 'mc-click-sing',
    triggers: ['mascot-click'],
    text: 'Singing mode needs courage — tiny voice is OK.',
    detail:
      'Watch the cents meter: tiny corrections beat heroic scoops. Sustain half a second so pitchy can lock on.',
  },
  {
    id: 'mc-click-register',
    triggers: ['mascot-click'],
    text: 'Octave slips happen when you recognise pitch class but pick the wrong octave.',
    detail: 'Compare against A4 in your head — above or below middle?',
  },
  {
    id: 'mc-click-level',
    triggers: ['mascot-click'],
    text: 'Every level adds colours to the same palette — trust earlier notes as anchors.',
    detail: 'New notes borrow flavour from neighbours you already trained.',
  },
  {
    id: 'mc-click-reset',
    triggers: ['mascot-click'],
    text: 'If you spiral, reset: listen → hum → answer. Same ritual every round.',
    detail: 'Ritual kills anxiety; anxiety kills pitch.',
  },
  {
    id: 'mc-click-mic',
    triggers: ['mascot-click'],
    text: 'Mic shy? Move in close — loudness helps pitch detectors trust you.',
    detail: 'Quiet humming works too if you stay steady.',
  },
  {
    id: 'mc-click-celebrate',
    triggers: ['mascot-click'],
    text: "I'm rooting for you — every bridge plank is your ear getting stronger.",
    detail: 'Celebrate small wins; learning pitch is a marathon in neon sneakers.',
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

export function pickMascotTip(
  kind: 'hover' | 'click',
  lastShownId: string | null,
  ctx: MascotTipContext,
): Tip {
  const trig = kind === 'hover' ? 'mascot-hover' : 'mascot-click'
  let pool = TIPS.filter((t) => t.triggers.includes(trig)).filter((t) => t.id !== lastShownId)
  if (pool.length === 0) pool = TIPS.filter((t) => t.triggers.includes(trig))

  if (kind === 'click') {
    if (ctx.mode === 'sing') {
      const singFirst = pool.find((t) => t.id === 'mc-click-sing')
      if (singFirst && Math.random() < 0.45) pool = [singFirst, ...pool.filter((t) => t !== singFirst)]
    }
    if (ctx.mode === 'identify') {
      const idFirst = pool.find((t) => t.id === 'mc-click-identify')
      if (idFirst && Math.random() < 0.35) pool = [idFirst, ...pool.filter((t) => t !== idFirst)]
    }
  }

  const tip =
    pool[Math.floor(Math.random() * pool.length)] ??
    pool[0] ??
    TIPS[0]
  const parts: string[] = []
  if (tip.detail) parts.push(tip.detail)
  if (ctx.mode === 'sing' && ctx.targetNote) {
    parts.push(`You're singing toward ${prettyNote(ctx.targetNote)} — steady vowel, steady breath.`)
  }
  if (ctx.mode === 'identify') {
    parts.push('In identify rounds, trust your first instinct after replaying the tone twice.')
  }
  if (ctx.streak !== undefined && ctx.streak >= 5) {
    parts.push(`Streak ${ctx.streak} — you're on fire.`)
  }
  return {
    ...tip,
    detail: parts.join(' '),
  }
}

export function pickTipFor(
  trigger: 'lesson-start' | 'idle' | 'level-up' | 'first-correct',
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
