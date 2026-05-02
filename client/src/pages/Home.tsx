import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useStore } from '../store/useStore'
import { ForteAvatar } from '../components/character/Forte'
import { CURRICULUM, MASTERY_THRESHOLD } from '../lib/constants'
import { isMastered } from '../lib/curriculum'
import { prettyNote } from '../lib/noteUtils'

export default function Home() {
  const xp = useStore((s) => s.xp)
  const practice = useStore((s) => s.practice)

  const masteredCount = CURRICULUM.filter((n) => isMastered(practice.notes[n])).length
  const focusNote = CURRICULUM[Math.min(practice.focusIndex, CURRICULUM.length - 1)]
  const focusMasteryPct = Math.round(
    (practice.notes[focusNote].mastery / MASTERY_THRESHOLD) * 100,
  )

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-surface-950/40 to-transparent" />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link to="/home" className="text-2xl font-bold tracking-tight text-brand-400">
          ToneBridge
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/practice" className="text-surface-300 transition-colors hover:text-brand-400">
            Practice
          </Link>
          <Link to="/multiplayer" className="text-surface-300 transition-colors hover:text-brand-400">
            Multiplayer
          </Link>
          <Link to="/profile" className="text-surface-300 transition-colors hover:text-brand-400">
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-surface-700 px-4 py-2 text-sm font-semibold text-surface-300 transition-colors hover:border-surface-600 hover:text-white"
          >
            Sign out
          </button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-8 pb-24">
        {/* Greeting */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-6 mb-12 flex flex-col items-start gap-4 md:mt-12 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-400">
              Welcome back
            </p>
            <h1 className="mt-2 text-5xl font-black tracking-tight md:text-6xl">
              Build your <span className="text-brand-400">pitch</span> bridge.
            </h1>
            <p className="mt-3 max-w-lg text-lg text-surface-300">
              {masteredCount === 0
                ? "Let's lay the first plank — start with a single note."
                : masteredCount === CURRICULUM.length
                ? 'Every note in the octave is yours. Sharpen your ear with a duel.'
                : `${masteredCount} of ${CURRICULUM.length} notes mastered. Keep going.`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="rounded-2xl border border-surface-700 bg-surface-800/60 px-5 py-3 text-right backdrop-blur">
              <div className="text-xs uppercase tracking-wider text-surface-400">Total XP</div>
              <div className="font-mono text-2xl font-black text-brand-400">{xp}</div>
            </div>
          </div>
        </motion.section>

        {/* CTA cards */}
        <section className="grid gap-5 md:grid-cols-3">
          {/* Practice — primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-2"
          >
            <Link to="/practice" className="group block">
              <div className="relative overflow-hidden rounded-3xl border border-brand-500/40 bg-gradient-to-br from-brand-600/30 via-surface-800 to-surface-900 p-8 transition-all hover:border-brand-400/80 hover:shadow-2xl hover:shadow-brand-500/20">
                <div className="absolute -right-6 -top-6 opacity-90 transition-transform group-hover:scale-105">
                  <ForteAvatar mood="cheering" size={140} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">
                  Singleplayer
                </span>
                <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                  Practice with Forte
                </h2>
                <p className="mt-2 max-w-md text-surface-300">
                  Train your ears note-by-note. Sing the pitch, name the pitch, master each step,
                  and watch the bridge build itself.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 font-bold text-white shadow-lg shadow-brand-500/25 transition-shadow group-hover:shadow-brand-500/40">
                    Start practice →
                  </div>
                  <span className="text-sm text-surface-400">
                    Currently on <span className="font-semibold text-brand-400">{prettyNote(focusNote)}</span> · {focusMasteryPct}%
                  </span>
                </div>

                {/* Curriculum mini-strip */}
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {CURRICULUM.map((note) => {
                    const mastered = isMastered(practice.notes[note])
                    const isFocus = note === focusNote
                    return (
                      <div
                        key={note}
                        className={`flex h-7 w-7 items-center justify-center rounded-md border text-[10px] font-bold ${
                          mastered
                            ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                            : isFocus
                            ? 'border-brand-500 text-white'
                            : 'border-surface-700 bg-surface-900/60 text-surface-500'
                        }`}
                      >
                        {prettyNote(note).slice(0, -1)}
                      </div>
                    )
                  })}
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Multiplayer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link to="/multiplayer" className="group block h-full">
              <div className="flex h-full flex-col rounded-3xl border border-surface-700 bg-surface-800/60 p-6 transition-colors hover:border-surface-600 hover:bg-surface-800">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-400">
                  Multiplayer
                </span>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">1v1 Duel</h3>
                <p className="mt-2 flex-1 text-sm text-surface-300">
                  Race an opponent to identify notes. Climb the leaderboard, raise your ELO.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-400 transition-transform group-hover:translate-x-1">
                  Find a duel →
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link to="/profile" className="group block h-full">
              <div className="flex h-full flex-col rounded-3xl border border-surface-700 bg-surface-800/60 p-6 transition-colors hover:border-surface-600 hover:bg-surface-800">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">
                  Stats
                </span>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">Your profile</h3>
                <p className="mt-2 flex-1 text-sm text-surface-300">
                  Streaks, XP history, and per-note accuracy.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-surface-200 transition-transform group-hover:translate-x-1">
                  View profile →
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Learn */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="md:col-span-3"
          >
            <Link to="/learn" className="group block">
              <div className="rounded-3xl border border-surface-700 bg-surface-800/60 p-6 transition-colors hover:border-surface-600 hover:bg-surface-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">
                      Learn
                    </span>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight">
                      Pitch theory & technique
                    </h3>
                    <p className="mt-1 text-sm text-surface-300">
                      Short reads on cents, intervals, and how the ear actually maps frequencies.
                    </p>
                  </div>
                  <div className="text-2xl text-surface-300 transition-transform group-hover:translate-x-1">
                    →
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </section>
      </main>
    </div>
  )
}
