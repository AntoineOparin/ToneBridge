import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useStore } from '../store/useStore'
import { ForteAvatar } from '../components/character/Forte'
import MasteryBridge from '../components/bridge/MasteryBridge'
import { LEVELS, MAX_LEVEL } from '../lib/constants'
import { currentLevel, hasSeenTutorial, levelProgressPct } from '../lib/curriculum'
import { prettyNote } from '../lib/noteUtils'

export default function Home() {
  const xp = useStore((s) => s.xp)
  const practice = useStore((s) => s.practice)

  const level = currentLevel(practice)
  const pct = levelProgressPct(practice)
  const isFirstTime = !hasSeenTutorial(practice, 1) && practice.level === 1 && practice.levelXp === 0
  const [showBridge, setShowBridge] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-surface-950/40 to-transparent" />

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
          <Link to="/leaderboard" className="text-surface-300 transition-colors hover:text-brand-400">
            Leaderboard
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
              {isFirstTime
                ? "Hit Practice — Forte will introduce the first three notes."
                : practice.level === MAX_LEVEL && pct >= 100
                ? 'Every bridge built. Sharpen your ear with a duel.'
                : `Level ${practice.level} of ${MAX_LEVEL} — ${level.title}.`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="rounded-2xl border border-surface-700 bg-surface-800/60 px-5 py-3 text-right backdrop-blur">
              <div className="text-xs uppercase tracking-wider text-surface-400">Total XP</div>
              <div className="font-mono text-2xl font-black text-brand-400">{xp}</div>
            </div>
          </div>
        </motion.section>

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
                  {isFirstTime ? 'Start with Forte' : 'Continue practicing'}
                </h2>
                <p className="mt-2 max-w-md text-surface-300">
                  {isFirstTime
                    ? 'A short tutorial introduces every note in the level, then practice begins.'
                    : `${practice.levelXp} / ${level.xpToComplete} reps this level. Reach the next bridge to unlock new notes.`}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 font-bold text-white shadow-lg shadow-brand-500/25 transition-shadow group-hover:shadow-brand-500/40">
                    {isFirstTime ? 'Start tutorial →' : 'Continue →'}
                  </div>
                  <span className="text-sm text-surface-400">
                    Level <span className="font-semibold text-brand-400">{practice.level}</span> · {pct}% to next bridge
                  </span>
                </div>

                {/* Level strip */}
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {LEVELS.map((lvl) => {
                    const cleared = practice.level > lvl.id
                    const active = practice.level === lvl.id
                    return (
                      <div
                        key={lvl.id}
                        className={`flex h-7 min-w-[28px] items-center justify-center rounded-md border px-2 text-[10px] font-bold ${
                          cleared
                            ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                            : active
                            ? 'border-brand-500 text-white'
                            : 'border-surface-700 bg-surface-900/60 text-surface-500'
                        }`}
                        title={lvl.title}
                      >
                        L{lvl.id}
                      </div>
                    )
                  })}
                </div>

                {/* Notes in current level */}
                <div className="mt-3 text-xs text-surface-400">
                  This level: {level.notes.map((n) => prettyNote(n)).join(' · ')}
                </div>
              </div>
            </Link>
          </motion.div>

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
        {/* Dev: play bridge animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex justify-center"
        >
          <button
            onClick={() => setShowBridge(true)}
            className="rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-2 text-sm font-semibold text-surface-300 transition-colors hover:border-brand-500 hover:text-brand-400"
          >
            Play bridge animation
          </button>
        </motion.div>
      </main>

      <AnimatePresence>
        {showBridge && (
          <MasteryBridge
            fromLevel={Math.max(1, practice.level - 1)}
            fromTitle={LEVELS[Math.max(0, practice.level - 2)]?.title ?? 'First steps'}
            toLevel={practice.level}
            toTitle={level.title}
            newNotes={level.notes.slice(0, 3)}
            onComplete={() => setShowBridge(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
