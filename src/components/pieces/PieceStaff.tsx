import { useEffect, useRef } from 'react'
import type { PieceMeasure } from '../../data/pieces'
import { keyFromFifths, vexKeyOf } from '../../engine/score'

export type Hand = 'both' | 'right' | 'left'

const DURATION_VEX: Record<string, string> = {
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: '8',
  '16th': '16',
  '32nd': '32',
}

interface PieceStaffProps {
  measure: PieceMeasure
  /** 页首小节：绘制谱号 + 调号 + 拍号 */
  showPrefix: boolean
  hand: Hand
  active: boolean
  onSelect: (measureN: number) => void
}

const TREBLE_Y = 26
const BASS_Y = 122
const H_BOTH = 212
const H_SINGLE = 100

/**
 * 曲目单小节谱面：VexFlow 渲染真实五线谱（G/F 谱号、调号、拍号、连音线、和弦）。
 * 可切换单手/双手视图；整小节可点击（播放交给页面控制）。
 */
export default function PieceStaff({ measure, showPrefix, hand, active, onSelect }: PieceStaffProps) {
  const ref = useRef<HTMLDivElement>(null)
  const staffs = hand === 'both' ? [1, 2] : hand === 'right' ? [1] : [2]
  const height = staffs.length === 1 ? H_SINGLE : H_BOTH
  const width = Math.min(380, Math.max(160, measure.notes.length * 7 + 120))

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancelled = false
    const render = async () => {
      const { Formatter, Renderer, Stave, StaveNote, Voice } = await import('vexflow')
      if (cancelled || !el) return
      el.innerHTML = ''
      const renderer = new Renderer(el, Renderer.Backends.SVG)
      renderer.resize(width, height)
      const ctx = renderer.getContext()

      for (const staffNum of staffs) {
        const isTreble = staffNum === 1
        const y = isTreble ? TREBLE_Y : BASS_Y
        const clef = isTreble ? 'treble' : 'bass'
        const stave = new Stave(44, y, width - 66)
        if (showPrefix) {
          stave
            .addClef(clef)
            .addKeySignature(keyFromFifths(measure.fifths).root)
            .addTimeSignature(`${measure.beats}/${measure.beatType}`)
        }
        stave.setContext(ctx).draw()

        const vexNotes = measure.notes
          .filter((n) => n.st === staffNum)
          .map((n) => {
            const dur = DURATION_VEX[n.t] ?? 'q'
            if (!n.p) return new StaveNote({ keys: ['b/4'], duration: `${dur}r`, clef, dots: n.dot })
            return new StaveNote({
              keys: [vexKeyOf({ step: n.p.s, octave: n.p.o, alter: n.p.a })],
              duration: dur,
              clef,
              dots: n.dot,
            })
          })

        if (vexNotes.length > 0) {
          const voice = new Voice({
            numBeats: measure.beats,
            beatValue: measure.beatType,
          })
            .setMode(Voice.Mode.SOFT)
            .addTickables(vexNotes)
          new Formatter().joinVoices([voice]).formatToStave([voice], stave)
          voice.draw(ctx, stave)
        }

        // 小节线（结束线）
        const endX = stave.getX() + stave.getWidth()
        ctx.save()
        ctx.beginPath()
        ctx.setLineWidth(1.2)
        ctx.moveTo(endX, y - 30)
        ctx.lineTo(endX, y + 42)
        ctx.stroke()
        ctx.restore()
      }
    }
    void render()
    return () => {
      cancelled = true
      el.innerHTML = ''
    }
  }, [measure, showPrefix, hand, staffs.length, width, height])

  return (
    <div
      ref={ref}
      className={`piece-measure ${active ? 'piece-measure--active' : ''}`}
      style={{ width, height }}
      onClick={() => onSelect(measure.n)}
      role="button"
      aria-label={`第 ${measure.n} 小节${showPrefix ? '（页首）' : ''}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(measure.n)
        }
      }}
    />
  )
}
