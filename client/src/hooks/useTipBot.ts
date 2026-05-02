import { useCallback, useEffect, useRef, useState } from 'react'
import { pickMascotTip, pickTipFor, pickTipForMiss } from '../lib/tips'
import type { MascotTipContext, MissPattern, NoteName, Tip } from '../types'

interface UseTipBotResult {
  tip: Tip | null
  reportMiss: (note: NoteName, miss: MissPattern, recentMisses: MissPattern[]) => void
  showContext: (
    trigger: 'lesson-start' | 'level-up' | 'first-correct' | 'idle',
    context?: { note?: NoteName },
  ) => void
  /** Tap Forte on Practice — coaching tips only (hover is local UI, not this). */
  mascotClick: (ctx: MascotTipContext) => void
  clear: () => void
}

const TIP_DURATION_MS = 6500
const IDLE_INTERVAL_MS = 45_000

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
      trigger: 'lesson-start' | 'level-up' | 'first-correct' | 'idle',
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

  const mascotClick = useCallback(
    (ctx: MascotTipContext) => {
      const next = pickMascotTip('click', lastIdRef.current, ctx)
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

  return { tip, reportMiss, showContext, mascotClick, clear }
}
