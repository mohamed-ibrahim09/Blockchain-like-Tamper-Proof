"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface TimerReturn {
  isRunning: boolean
  elapsedTime: number
  start: () => void
  stop: () => number
  reset: () => void
}

export function useTimer(): TimerReturn {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const updateElapsedTime = useCallback(() => {
    if (startTimeRef.current !== null) {
      setElapsedTime(performance.now() - startTimeRef.current)
      animationFrameRef.current = requestAnimationFrame(updateElapsedTime)
    }
  }, [])

  const start = useCallback(() => {
    startTimeRef.current = performance.now()
    setIsRunning(true)
    setElapsedTime(0)
    animationFrameRef.current = requestAnimationFrame(updateElapsedTime)
  }, [updateElapsedTime])

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    const finalTime = startTimeRef.current
      ? performance.now() - startTimeRef.current
      : 0
    setElapsedTime(finalTime)
    setIsRunning(false)
    return finalTime
  }, [])

  const reset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    startTimeRef.current = null
    setIsRunning(false)
    setElapsedTime(0)
  }, [])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return { isRunning, elapsedTime, start, stop, reset }
}
