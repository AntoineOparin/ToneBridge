import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useStore } from '../store/useStore'
import { useAuthUser } from '../hooks/useAuthUser'
import { ForteAvatar } from '../components/character/Forte'
import { LEVELS, MAX_LEVEL } from '../lib/constants'
import {
  computeMastery,
  currentLevel,
  levelProgressPct,
} from '../lib/curriculum'
import { prettyNote } from '../lib/noteUtils'
import type { NoteName, NoteStats } from '../types'

export default function Profile() {
  const xp = useStore((s) => s.xp)
  const practice = useStore((s) => s.practice)
  const auth = useAuthUser()

  const level = currentLevel(practice)
  const levelPct = levelProgressPct(practice)

  const totals = useMemo(() => {
    let correct = 0
    let incorrect = 0
    for (const stats of Object.values(practice.notes)) {
      if (!stats) continue
      correct += stats.correct
      incorrect += stats.incorrect
    }
    const reps = correct + incorrect
    const accuracy = reps > 0 ? Math.round((correct / reps) * 100) : 0
    return { correct, incorrect, reps, accuracy }
  }, [practice.notes])

  const masteryRows = useMemo(() => {
    const entries = Object.entries(practice.notes) as [NoteName, NoteStats | undefined][]
    return entries
      .filter((entry): entry is [NoteName, NoteStats] => entry[1] !== undefined)
      .map(([note, stats]) => ({
        note,
        stats,
        mastery: computeMastery(stats),
      }))
      .sort((a, b) => b.mastery - a.mastery || a.note.localeCompare(b.note))
  }, [practice.notes])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const memberSince = auth?.createdAt
    ? new Date(auth.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const username = useStore.getState().username ??
    (auth?.fullName || (auth?.email ? auth.email.split('@')[0] : 'Player'))

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-surface-950/40 to-transparent" />

      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link to="/home" className="text-2xl font-bold tracking-tight text-brand-400">
          ToneBridge
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/home" className="text-surface-300 transition-colors hover:text-brand-400">
            Home
          </Link>
          <Link to="/practice" className="text-surface-300 transition-colors hover:text-brand-400">
            Practice
          </Link>
          <Link to="/multiplayer" className="text-surface-300 transition-colors hover:text-brand-400">
            Multiplayer
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-surface-700 px-4 py-2 text-sm font-semibold text-surface-300 transition-colors hover:border-surface-600 hover:text-white"
          >
            Sign out
          </button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-8 pb-24">
        {/* Account card */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 flex flex-col items-start gap-6 rounded-3xl border border-surface-700 bg-surface-800/60 p-8 md:flex-row md:items-center"
        >
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-500/50 bg-surface-900">
            {auth?.avatarUrl ? (
              <img
                src={auth.avatarUrl}
                alt="avatar"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <ForteAvatar mood="happy" size={84} />
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">
              Profile
            </p>
            <h1 className="mt-1 text-4xl font-black tracking-tight text-white">{username}</h1>
            {auth?.email && (
              <p className="mt-1 text-sm text-surface-300">{auth.email}</p>
            )}
            {memberSince && (
              <p className="mt-1 text-xs uppercase tracking-wider text-surface-500">
                Member since {memberSince}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:text-right">
            <Stat label="Total XP" value={xp.toLocaleString()} accent />
            <Stat label="Level" value={`${practice.level} / ${MAX_LEVEL}`} />
          </div>
        </motion.section>

        {/* Stats grid */}
        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Streak" value={`${practice.streak}`} suffix="🔥" delay={0.1} />
          <StatCard
            label="Accuracy"
            value={`${totals.accuracy}%`}
            sub={`${totals.correct} / ${totals.reps} reps`}
            delay={0.15}
          />
          <StatCard
            label="Reps"
            value={totals.reps.toLocaleString()}
            sub={`${totals.correct} ✓ · ${totals.incorrect} ✗`}
            delay={0.2}
          />
          <StatCard
            label="Mastered"
            value={`${masteryRows.filter((r) => r.mastery >= 100).length}`}
            sub={`of ${masteryRows.length} learned`}
            delay={0.25}
          />
        </section>

        {/* Level progression */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 rounded-3xl border border-surface-700 bg-surface-800/60 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">
                Current level
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{level.title}</h2>
              <p className="mt-1 text-sm text-surface-300">{level.description}</p>
            </div>
            <Link
              to="/practice"
              className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25"
            >
              Continue →
            </Link>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-900">
            <motion.div
              animate={{ width: `${levelPct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-surface-400">
            <span>{practice.levelXp} / {level.xpToComplete} reps</span>
            <span>{levelPct}% to next bridge</span>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {LEVELS.map((lvl) => {
              const cleared = practice.level > lvl.id
              const active = practice.level === lvl.id
              return (
                <div
                  key={lvl.id}
                  className={`flex h-12 min-w-[60px] flex-col items-center justify-center rounded-xl border-2 px-3 text-xs font-bold transition-colors ${
                    cleared
                      ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                      : active
                      ? 'border-brand-500 text-white'
                      : 'border-surface-700 bg-surface-900/60 text-surface-500'
                  }`}
                  title={lvl.title}
                >
                  <span>L{lvl.id}</span>
                  <span className="text-[9px] font-medium opacity-70">
                    {lvl.notes.length} notes
                  </span>
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* Mastery levels */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 rounded-3xl border border-surface-700 bg-surface-800/60 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">
                Mastery
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Per-note mastery</h2>
              <p className="mt-1 text-sm text-surface-300">
                +5% per correct answer, −3% per miss. Reach 100% for full mastery.
              </p>
            </div>
            <span className="hidden text-xs uppercase tracking-wider text-surface-500 md:block">
              Sorted by mastery
            </span>
          </div>

          {masteryRows.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-surface-700 p-8 text-center text-surface-400">
              No notes practiced yet.&nbsp;
              <Link to="/practice" className="text-brand-400 underline">
                Start your first lesson →
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {masteryRows.map(({ note, stats, mastery }) => (
                <MasteryRow key={note} note={note} stats={stats} mastery={mastery} />
              ))}
            </ul>
          )}
        </motion.section>
      </main>
    </div>
  )
}

interface StatProps {
  label: string
  value: string
  accent?: boolean
}

function Stat({ label, value, accent = false }: StatProps) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-surface-400">{label}</div>
      <div
        className={`font-mono text-2xl font-black ${accent ? 'text-brand-400' : 'text-white'}`}
      >
        {value}
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  sub?: string
  suffix?: string
  delay?: number
}

function StatCard({ label, value, sub, suffix, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-surface-700 bg-surface-800/60 p-4"
    >
      <div className="text-xs uppercase tracking-wider text-surface-400">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-black text-white">{value}</span>
        {suffix && <span className="text-lg">{suffix}</span>}
      </div>
      {sub && <div className="mt-1 text-xs text-surface-400">{sub}</div>}
    </motion.div>
  )
}

interface MasteryRowProps {
  note: NoteName
  stats: NoteStats
  mastery: number
}

function MasteryRow({ note, stats, mastery }: MasteryRowProps) {
  const fully = mastery >= 100
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-surface-700/70 bg-surface-900/40 p-4">
      <div
        className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border-2 text-sm font-bold ${
          fully
            ? 'border-brand-500 bg-brand-500/15 text-brand-300'
            : 'border-surface-700 bg-surface-800 text-white'
        }`}
      >
        <span>{prettyNote(note).slice(0, -1)}</span>
        <span className="text-[9px] opacity-70">octave {prettyNote(note).slice(-1)}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="font-bold text-white">{prettyNote(note)}</span>
          <span
            className={`font-mono text-sm font-bold ${
              fully ? 'text-brand-300' : 'text-surface-200'
            }`}
          >
            {Math.round(mastery)}%
            {fully && <span className="ml-2 text-[10px] uppercase tracking-widest">Mastered</span>}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-900">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${mastery}%` }}
            transition={{ type: 'spring', stiffness: 110, damping: 22 }}
            className={`h-full rounded-full ${
              fully
                ? 'bg-gradient-to-r from-brand-400 to-brand-200'
                : 'bg-gradient-to-r from-brand-500 to-brand-300'
            }`}
          />
        </div>
        <div className="mt-1 flex gap-3 text-[11px] text-surface-400">
          <span>{stats.correct} ✓</span>
          <span>{stats.incorrect} ✗</span>
        </div>
      </div>
    </li>
  )
}
