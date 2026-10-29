import { useCallback, useRef } from 'react'
import { audioEngine } from '../engine/audio'

/** M2 将实现完整节拍器（BPM / 拍号 / 强弱拍）；先提供最小 API */
export function useMetronome() {
  const timerRef = useRef<number | null>(null)

  const start = useCallback((bpm: number) => {
    if (timerRef.current !== null) return
    timerRef.current = window.setInterval(() => {
      audioEngine.playMidi(69, 0.06)
    }, 60000 / bpm)
  }, [])

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return { start, stop }
}

/** 播放音符的便捷 hook */
export function useAudioEngine() {
  const playNote = useCallback((midi: number, duration?: number) => {
    audioEngine.playMidi(midi, duration)
  }, [])
  return { playNote }
}
