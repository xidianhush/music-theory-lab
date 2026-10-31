import { useCallback, useRef, useState } from 'react'
import type { TimeSignature } from '../data/timeSignatures'
import { AudioEngine, audioEngine } from '../engine/audio'
import { beatPattern, beatIntervalMs, tickMidi } from '../engine/rhythm'

/** 提前调度时长（秒）与调度轮询间隔（毫秒） */
const LOOKAHEAD_SEC = 0.12
const SCHEDULE_INTERVAL_MS = 25

/**
 * 节拍器（lookahead 调度模式）：
 * 用 AudioContext 时钟提前 0.12s 安排下一次打拍，避免 setInterval 的累积抖动。
 * BPM / 拍号变化通过 ref 即时生效，无需重启。
 */
export function useMetronome() {
  const timerRef = useRef<number | null>(null)
  const nextTimeRef = useRef(0)
  const beatRef = useRef(0)
  const runningRef = useRef(false)
  const paramsRef = useRef<{
    bpm: number
    ts: TimeSignature
    onBeat?: (index: number, timeSec: number) => void
  } | null>(null)

  const schedulerTick = useCallback(() => {
    if (!runningRef.current) return
    const params = paramsRef.current
    const now = audioEngine.getCurrentTime()
    if (!params || now === null) return
    const interval = beatIntervalMs(params.ts, params.bpm) / 1000
    const pattern = beatPattern(params.ts)
    while (nextTimeRef.current < now + LOOKAHEAD_SEC) {
      const idx = beatRef.current % pattern.length
      const when = Math.max(nextTimeRef.current, now)
      audioEngine.scheduleFrequency(AudioEngine.midiToFrequency(tickMidi(pattern[idx])), when)
      params.onBeat?.(idx, when)
      beatRef.current += 1
      nextTimeRef.current += interval
    }
    timerRef.current = window.setTimeout(schedulerTick, SCHEDULE_INTERVAL_MS)
  }, [])

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    runningRef.current = false
    audioEngine.stopAll() // 取消已排入时间轴的 lookahead 节拍音，停止即静音
  }, [])

  const start = useCallback(
    (bpm: number, ts: TimeSignature, onBeat?: (index: number, timeSec: number) => void) => {
      stop()
      paramsRef.current = { bpm, ts, onBeat }
      const now = audioEngine.getCurrentTime()
      if (now === null) return
      nextTimeRef.current = now
      beatRef.current = 0
      runningRef.current = true
      schedulerTick()
    },
    [stop, schedulerTick],
  )

  return { start, stop }
}

/** 播放音符的便捷 hook */
export function useAudioEngine() {
  const playNote = useCallback((midi: number, duration?: number) => {
    audioEngine.playMidi(midi, duration)
  }, [])
  return { playNote }
}

/** 顺序播放一串 MIDI（音阶 / 旋律演示），回调当前播放下标用于高亮 */
export function useSequencedPlayer() {
  const timerRef = useRef<number | null>(null)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setCurrentIndex(null)
  }, [])

  const play = useCallback(
    (midis: number[], intervalMs = 400) => {
      stop()
      if (midis.length === 0) return
      let index = 0
      const step = () => {
        audioEngine.playMidi(midis[index], (intervalMs / 1000) * 0.85)
        setCurrentIndex(index)
        index += 1
        if (index < midis.length) {
          timerRef.current = window.setTimeout(step, intervalMs)
        }
      }
      step()
    },
    [stop],
  )

  return { play, stop, currentIndex }
}
