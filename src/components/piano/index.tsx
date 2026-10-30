import { useMemo } from 'react'
import { audioEngine } from '../../engine/audio'

const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11]

interface PianoProps {
  /** 需要常亮高亮的 MIDI（如音阶各音） */
  highlighted?: number[]
  /** 当前播放中的音（更强高亮） */
  active?: number | null
  onNoteClick?: (midi: number) => void
  /** 键盘范围（MIDI 编号），默认 C4–B5 */
  start?: number
  end?: number
}

/** 虚拟钢琴键盘：点击发声；支持高亮指定音（音阶演示 / 听音辨调） */
export default function Piano({
  highlighted = [],
  active = null,
  onNoteClick,
  start = 60,
  end = 83,
}: PianoProps) {
  const highlightSet = useMemo(() => new Set(highlighted), [highlighted])

  const keys = useMemo(() => {
    const white: number[] = []
    const black: { midi: number; after: number }[] = []
    let whiteCount = 0
    for (let midi = start; midi <= end; midi++) {
      if (WHITE_PCS.includes(midi % 12)) {
        white.push(midi)
        whiteCount++
      } else {
        // 黑键位于它前面那个白键的右边界
        black.push({ midi, after: whiteCount })
      }
    }
    return { white, black }
  }, [start, end])

  const whiteWidthPct = 100 / keys.white.length

  const handleClick = (midi: number) => {
    audioEngine.playMidi(midi, 0.35)
    onNoteClick?.(midi)
  }

  return (
    <div className="piano" role="group" aria-label="钢琴键盘（C4–B5）">
      <div className="piano__whites">
        {keys.white.map((midi) => (
          <button
            key={midi}
            type="button"
            className={`piano__white ${
              active === midi ? 'piano__key--active' : highlightSet.has(midi) ? 'piano__key--hl' : ''
            }`}
            onClick={() => handleClick(midi)}
            aria-label={`播放 MIDI ${midi}`}
          />
        ))}
      </div>
      <div className="piano__blacks">
        {keys.black.map(({ midi, after }) => (
          <button
            key={midi}
            type="button"
            className={`piano__black ${
              active === midi ? 'piano__key--active' : highlightSet.has(midi) ? 'piano__key--hl' : ''
            }`}
            style={{ left: `${after * whiteWidthPct}%`, width: `calc(0.6 * ${whiteWidthPct}%)` }}
            onClick={() => handleClick(midi)}
            aria-label={`播放 MIDI ${midi}`}
          />
        ))}
      </div>
    </div>
  )
}
