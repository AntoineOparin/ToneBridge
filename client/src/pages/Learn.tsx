import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import LearnHero3D from '../components/learn/LearnHero3D'
import { useAudio } from '../hooks/useAudio'
import { ARTICLES, LEARN_REFERENCE_OCTAVE, PITCH_TIPS } from '../lib/learnContent'
import { NOTE_FREQUENCIES, PITCH_CLASSES } from '../lib/constants'
import { midiToNoteName, prettyNote } from '../lib/noteUtils'
import type { NoteName } from '../types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
}

/** Compact playable map from A3 through B5 (three octaves chromatic). */
const PLAY_RANGE = {
  startMidi: 57,
  endMidi: 83,
} as const

export default function Learn() {
  const audio = useAudio()
  const [playingId, setPlayingId] = useState<string | null>(null)

  const play = useCallback(
    async (note: NoteName, id: string) => {
      setPlayingId(id)
      await audio.playNote(note, 1.2)
      window.setTimeout(() => setPlayingId(null), 450)
    },
    [audio],
  )

  const chromaticNotes = useMemo(() => {
    return PITCH_CLASSES.map((pc) => {
      const name = `${pc}${LEARN_REFERENCE_OCTAVE}` as NoteName
      return {
        pc,
        name,
        hz: NOTE_FREQUENCIES[name],
        tips: PITCH_TIPS[pc],
      }
    })
  }, [])

  const extendedNotes = useMemo(() => {
    const out: NoteName[] = []
    for (let m = PLAY_RANGE.startMidi; m <= PLAY_RANGE.endMidi; m++) {
      out.push(midiToNoteName(m))
    }
    return out
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-950 to-transparent" />

      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link to="/home" className="text-2xl font-bold tracking-tight text-brand-400">
          ToneBridge
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-4 md:gap-6">
          <Link to="/home" className="text-surface-300 transition-colors hover:text-brand-400">
            Home
          </Link>
          <Link to="/practice" className="text-surface-300 transition-colors hover:text-brand-400">
            Practice
          </Link>
          <Link to="/profile" className="text-surface-300 transition-colors hover:text-brand-400">
            Profile
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-8 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-400">Learn</p>
          <h1 className="mt-2 text-5xl font-black tracking-tight md:text-6xl">
            Pitch theory & <span className="text-brand-400">technique</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-surface-300">
            Cents, frequency, intervals — then hear every pitch class at middle-register reference.
            Tap play on any card to train your ear with ToneBridge sound.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.12 }}
        >
          <LearnHero3D />
        </motion.div>
      </section>

      {/* Articles */}
      <section className="relative z-10 mx-auto max-w-6xl px-8 py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          className="mb-8 text-center text-3xl font-black tracking-tight md:text-4xl"
        >
          Core concepts
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid gap-6 md:grid-cols-2"
        >
          {ARTICLES.map((article) => (
            <motion.article
              key={article.id}
              variants={itemVariants}
              className="rounded-3xl border border-surface-700 bg-surface-800/60 p-6 backdrop-blur transition-colors hover:border-surface-600"
            >
              <h3 className="text-xl font-bold text-white">{article.title}</h3>
              <p className="mt-1 text-sm font-medium text-brand-400">{article.subtitle}</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-surface-300">
                {article.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* Chromatic pitch classes — reference octave */}
      <section className="relative z-10 mx-auto max-w-6xl px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            The twelve pitch classes
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-surface-300">
            Reference octave <span className="font-mono text-brand-400">{LEARN_REFERENCE_OCTAVE}</span>
            — tips for recognizing each note on recordings and reproducing it with your voice.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {chromaticNotes.map(({ pc, name, hz, tips }) => (
            <PitchClassCard
              key={pc}
              name={name}
              hz={hz}
              tips={tips}
              playing={playingId === name}
              onPlay={() => play(name, name)}
            />
          ))}
        </motion.div>
      </section>

      {/* Extended playable map */}
      <section className="relative z-10 mx-auto max-w-6xl px-8 py-16 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Hear the spectrum
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-surface-300">
            Three octaves of chromatic notes (A3–B5). Compare register — same letter, different body
            resonance.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-surface-700 bg-surface-800/40 p-4 md:p-6"
        >
          <div className="flex flex-wrap justify-center gap-2 md:gap-2.5">
            {extendedNotes.map((name) => (
              <motion.button
                key={name}
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => play(name, `ext-${name}`)}
                className={`relative flex min-h-[44px] min-w-[52px] flex-col items-center justify-center rounded-xl border px-2 py-2 text-xs font-bold transition-colors md:min-w-[56px] ${
                  playingId === `ext-${name}`
                    ? 'border-brand-400 bg-brand-500/25 text-brand-200 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                    : 'border-surface-600 bg-surface-900/70 text-surface-200 hover:border-brand-500/60 hover:bg-surface-800'
                }`}
              >
                <span className="text-[13px]">{prettyNote(name).replace(/\d+$/, '')}</span>
                <span className="font-mono text-[9px] opacity-70">{prettyNote(name).slice(-1)}</span>
              </motion.button>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-surface-500">
            Tap any tile — audio starts after first interaction (browser autoplay rules).
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap justify-center gap-4"
        >
          <Link
            to="/practice"
            className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-3 font-bold text-white shadow-lg shadow-brand-500/25 transition-shadow hover:shadow-brand-500/40"
          >
            Train in Practice →
          </Link>
          <Link
            to="/home"
            className="rounded-2xl border border-surface-600 px-8 py-3 font-semibold text-surface-200 transition-colors hover:border-surface-500 hover:bg-surface-800"
          >
            Back to home
          </Link>
        </motion.div>
      </section>
    </div>
  )
}

interface PitchClassCardProps {
  name: NoteName
  hz: number
  tips: { recognize: string; sing: string }
  playing: boolean
  onPlay: () => void
}

function PitchClassCard({ name, hz, tips, playing, onPlay }: PitchClassCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={`flex flex-col rounded-2xl border bg-surface-900/50 p-4 backdrop-blur transition-colors ${
        playing ? 'border-brand-400 shadow-[0_0_24px_rgba(245,158,11,0.2)]' : 'border-surface-700 hover:border-surface-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-2xl font-black text-white">{prettyNote(name)}</span>
          <p className="font-mono text-xs text-surface-400">{hz.toFixed(2)} Hz</p>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={onPlay}
          className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            playing
              ? 'bg-brand-500 text-white'
              : 'bg-surface-700 text-brand-300 hover:bg-brand-600 hover:text-white'
          }`}
        >
          {playing ? '●' : 'Play'}
        </motion.button>
      </div>
      <div className="mt-3 space-y-2 text-xs leading-relaxed">
        <p>
          <span className="font-semibold text-accent-400">Hear it:</span>{' '}
          <span className="text-surface-300">{tips.recognize}</span>
        </p>
        <p>
          <span className="font-semibold text-brand-400">Sing it:</span>{' '}
          <span className="text-surface-300">{tips.sing}</span>
        </p>
      </div>
    </motion.div>
  )
}
