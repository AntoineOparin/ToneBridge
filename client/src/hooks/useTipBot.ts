import { useCallback, useEffect, useRef, useState } from 'react'
import { pickTipFor, pickTipForMiss } from '../lib/tips'
import type { MissPattern, NoteName, Tip } from '../types'

interface UseTipBotResult {
  /** The tip that should currently be displayed, or null when the mascot is silent. */
  tip: Tip | null
  /** Show a contextual tip for a missed answer. */
  reportMiss: (note: NoteName, miss: MissPattern, recentMisses: MissPattern[]) => void
  /** Trigger a fixed-context tip (lesson start, mastered, idle, etc.). */
  showContext: (
    trigger: 'lesson-start' | 'mastered' | 'first-correct' | 'idle',
    context?: { note?: NoteName },
  ) => void
  /** Manually clear the bubble. */
  clear: () => void
}

const TIP_DURATION_MS = 6500
const IDLE_INTERVAL_MS = 45_000

/**
 * The mascot's brain: chooses tips, debounces them, escalates after
 * repeated mistakes, and emits gentle idle banter when the user pauses.
 */
export function useTipBot(): UseTipBotResult {
  const [tip, setTip] = useState<Tip | null>(null)
  const lastIdRef = useRef<string | null>(null)
  const dismissTimerRef = useRef<number | null>(null)
  const idleTimerRef = useRef<number | null>(null)

  const queueDismiss = useCallback(() => {
    if (dismissTimerRef.current !== null) clearTimeout(dismissTimerRef.current)
    dismissTimerRef.current = window.setTimeout(() => {
      setTip(null)
    }, TIP_DURATION_MS)
  }, [])

  const resetIdle = useCallback(() => {
    if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = window.setTimeout(() => {
      const next = pickTipFor('idle', lastIdRef.current)
      lastIdRef.current = next.id
      setTip(next)
      queueDismiss()
    }, IDLE_INTERVAL_MS)
  }, [queueDismiss])

  const reportMiss = useCallback(
    (_note: NoteName, _miss: MissPattern, recentMisses: MissPattern[]) => {
      const next = pickTipForMiss(recentMisses, lastIdRef.current)
      lastIdRef.current = next.id
      setTip(next)
      queueDismiss()
      resetIdle()
    },
    [queueDismiss, resetIdle],
  )

  const showContext = useCallback(
    (
      trigger: 'lesson-start' | 'mastered' | 'first-correct' | 'idle',
      context?: { note?: NoteName },
    ) => {
      const next = pickTipFor(trigger, lastIdRef.current, context)
      lastIdRef.current = next.id
      setTip(next)
      queueDismiss()
      resetIdle()
    },
    [queueDismiss, resetIdle],
  )

  const clear = useCallback(() => {
    if (dismissTimerRef.current !== null) clearTimeout(dismissTimerRef.current)
    setTip(null)
  }, [])

  useEffect(() => {
    resetIdle()
    return () => {
      if (dismissTimerRef.current !== null) clearTimeout(dismissTimerRef.current)
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current)
    }
  }, [resetIdle])

  return { tip, reportMiss, showContext, clear }
}
