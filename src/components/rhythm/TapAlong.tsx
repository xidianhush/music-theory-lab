import { useCallback, useEffect, useRef, useState } from 'react'
import { TIME_SIGNATURES } from '../../data/timeSignatures'
import type { TimeSignature } from '../../data/timeSignatures'
import { TAP_WINDOW_MS, gradeDeviation } from '../../engine/rhythm'
import { audioEngine } from '../../engine/audio'
import { useMetronome } from '../../hooks'

interface TapEntry {
  /** 偏差毫秒；null = 脱拍（没对上任何拍点） */
  devMs: number | null
}

const BPM_MIN = 40
const BPM_MAX = 200
const MAX_HISTORY = 20

/**
 * 节奏跟打：跟着节拍器击拍（按钮 / 空格），
 * 用 AudioContext 时钟测量每次击拍与拍点的偏差并实时反馈。
 */
export default function TapAlong() {
  const [bpm, setBpm] = useState(90)
  const [timeSig, setTimeSig] = useState<TimeSignature>(TIME_SIGNATURES[0])
  const [running, setRunning] = useState(false)
  const [taps, setTaps] = useState<TapEntry[]>([])
  const [stats, setStats] = useState({ attempts: 0, hits: 0, sumAbs: 0, best: Infinity as number })

  const runningRef = useRef(false)
  const bpmRef = useRef(bpm)
  const timeSigRef = useRef(timeSig)
  const beatsRef = useRef<number[]>([])
  const { start, stop } = useMetronome()

  bpmRef.current = bpm
  timeSigRef.current = timeSig

  /** 记录每个拍点的 AudioContext 时间（节拍器调度回调） */
  const onBeat = useCallback((_index: number, timeSec: number) => {
    beatsRef.current.push(timeSec)
    if (beatsRef.current.length > 16) beatsRef.current.shift()
  }, [])

  const handleTap = useCallback(() => {
    if (!runningRef.current) return
    const now = audioEngine.getCurrentTime()
    if (now === null) return
    let bestIdx = -1
    let best = Infinity
    for (let i = 0; i < beatsRef.current.length; i++) {
      const d = Math.abs(beatsRef.current[i] - now)
      if (d < best) {
        best = d
        bestIdx = i
      }
    }
    if (bestIdx >= 0 && best <= TAP_WINDOW_MS / 1000) {
      // 对上拍：devMs 正 = 偏晚，负 = 偏早
      const devMs = Math.round((now - beatsRef.current[bestIdx]) * 1000)
      beatsRef.current.splice(bestIdx, 1)
      const abs = Math.abs(devMs)
      setStats((prev) => ({
        attempts: prev.attempts + 1,
        hits: prev.hits + 1,
        sumAbs: prev.sumAbs + abs,
        best: Math.min(prev.best, abs),
      }))
      setTaps((prev) => [...prev.slice(-(MAX_HISTORY - 1)), { devMs }])
    } else {
      setStats((prev) => ({ ...prev, attempts: prev.attempts + 1 }))
      setTaps((prev) => [...prev.slice(-(MAX_HISTORY - 1)), { devMs: null }])
    }
  }, [])

  const toggle = useCallback(() => {
    if (runningRef.current) {
      stop()
      runningRef.current = false
      setRunning(false)
      beatsRef.current = []
    } else {
      beatsRef.current = []
      start(bpmRef.current, timeSigRef.current, onBeat)
      runningRef.current = true
      setRunning(true)
    }
  }, [onBeat, start, stop])

  // 运行中切换 BPM / 拍号 → 重启（清空排拍记录）
  useEffect(() => {
    if (!runningRef.current) return
    beatsRef.current = []
    stop()
    start(bpmRef.current, timeSigRef.current, onBeat)
  }, [bpm, timeSig, onBeat, start, stop])

  useEffect(() => () => stop(), [stop])

  // 空格键跟打
  useEffect(() => {
    if (!running) return
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        handleTap()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [running, handleTap])

  const reset = () => {
    setTaps([])
    setStats({ attempts: 0, hits: 0, sumAbs: 0, best: Infinity })
  }

  const last = taps[taps.length - 1]
  const hitRate = stats.attempts > 0 ? Math.round((stats.hits / stats.attempts) * 100) : 0
  const avgAbs = stats.hits > 0 ? Math.round(stats.sumAbs / stats.hits) : 0

  const readout =
    last === undefined
      ? null
      : last.devMs === null
        ? { label: '脱拍 · 稳住节奏', grade: 'miss' as const }
        : {
            label: `${last.devMs > 0 ? '+' : ''}${last.devMs}ms ${last.devMs > 0 ? '偏晚' : '偏早'}`,
            grade: gradeDeviation(Math.abs(last.devMs)),
          }

  return (
    <div className="tapalong">
      <div className="metro__row">
        <span className="metro__label">拍号</span>
        <div className="metro__sig-group">
          {TIME_SIGNATURES.map((ts) => (
            <button
              key={ts.label}
              type="button"
              className={`btn btn--ghost metro__sig ${ts.label === timeSig.label ? 'metro__sig--active' : ''}`}
              onClick={() => setTimeSig(ts)}
            >
              {ts.numerator}/{ts.denominator}
            </button>
          ))}
        </div>
      </div>

      <div className="metro__row">
        <span className="metro__label">速度</span>
        <input
          type="range"
          min={BPM_MIN}
          max={BPM_MAX}
          step={1}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="metro__slider"
          aria-label="BPM"
        />
        <span className="metro__bpm">{bpm}</span>
      </div>

      <div className="metro__row">
        <button type="button" className="btn btn--primary" onClick={toggle}>
          {running ? '停止' : '开始跟打'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={reset}>
          清零
        </button>
        <span className="metro__hint">跟着节拍器点「跟打」按钮（或按空格键），重点是时机，不是力度</span>
      </div>

      <button type="button" className="tapalong__pad" onPointerDown={handleTap} disabled={!running}>
        跟打
      </button>

      {running && (
        <div className="tapalong__readout" data-grade={readout?.grade}>
          {readout?.label ?? '等第一拍…'}
        </div>
      )}

      <div className="tapalong__dots" aria-label="最近击拍偏差">
        {taps.map((t, i) => (
          <span
            key={i}
            className={`tapalong__dot ${
              t.devMs === null
                ? 'tapalong__dot--miss'
                : `tapalong__dot--${gradeDeviation(Math.abs(t.devMs))}`
            }`}
          />
        ))}
      </div>

      <div className="tapalong__stats">
        尝试 {stats.attempts} · 命中 {stats.hits}（{hitRate}%）· 平均偏差 {avgAbs}ms · 最好{' '}
        {stats.best === Infinity ? '-' : `${stats.best}ms`}
      </div>
    </div>
  )
}
