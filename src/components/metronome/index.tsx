import { useCallback, useEffect, useRef, useState } from 'react'
import { TIME_SIGNATURES } from '../../data/timeSignatures'
import type { TimeSignature } from '../../data/timeSignatures'
import { beatPattern } from '../../engine/rhythm'
import { useMetronome } from '../../hooks'

const BPM_MIN = 40
const BPM_MAX = 200
const BPM_STEP = 5

/** 节拍器：BPM / 拍号调节，强弱拍视觉高亮 + 不同音高的打拍声 */
export default function Metronome() {
  const [bpm, setBpm] = useState(90)
  const [timeSig, setTimeSig] = useState<TimeSignature>(TIME_SIGNATURES[0])
  const [running, setRunning] = useState(false)
  const [currentBeat, setCurrentBeat] = useState<number | null>(null)
  const runningRef = useRef(false)
  const { start, stop } = useMetronome()

  const onBeat = useCallback((index: number) => {
    setCurrentBeat(index)
  }, [])

  const toggle = useCallback(() => {
    if (runningRef.current) {
      stop()
      runningRef.current = false
      setRunning(false)
      setCurrentBeat(null)
    } else {
      start(bpm, timeSig, onBeat)
      runningRef.current = true
      setRunning(true)
    }
  }, [bpm, timeSig, onBeat, start, stop])

  // 运行中切换 BPM / 拍号：以新参数重启，保证立即生效
  useEffect(() => {
    if (!runningRef.current) return
    stop()
    start(bpm, timeSig, onBeat)
  }, [bpm, timeSig, onBeat, start, stop])

  // 卸载时停止
  useEffect(() => () => stop(), [stop])

  const pattern = beatPattern(timeSig)

  return (
    <div className="metro">
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
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setBpm((b) => Math.max(BPM_MIN, b - BPM_STEP))}
        >
          -5
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setBpm((b) => Math.min(BPM_MAX, b + BPM_STEP))}
        >
          +5
        </button>
      </div>

      <div className="metro__row">
        <button type="button" className="btn btn--primary" onClick={toggle}>
          {running ? '停止' : '播放'}
        </button>
        <span className="metro__hint">
          每小节 {timeSig.numerator} 拍 · {timeSig.accentPattern}
        </span>
      </div>

      <div className="metro__beats" aria-label="强弱拍指示">
        {pattern.map((strength, i) => (
          <span
            key={`${i}-${strength}`}
            className={`metro__beat metro__beat--${strength} ${currentBeat === i ? 'metro__beat--active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
