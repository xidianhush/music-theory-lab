import { useEffect, useRef } from 'react'
import type { PieceMeasure } from '../../data/pieces'
import { keyFromFifths, vexKeyOf } from '../../engine/score'

export type Hand = 'both' | 'right' | 'left'

/** 深色主题下的谱面墨色：音符/符号用主文字色，谱线稍暗一档 */
const INK = '#e8eefc'
const LINE = '#b7c5e6'

/** 附点必须编码进 duration（'qd'），VexFlow 才按时值 tick 排布；构造器 dots 只画点不改 tick */
const DURATION_VEX: Record<string, string> = {
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: '8',
  '16th': '16',
  '32nd': '32',
}

function vexDuration(type: string, dots: number, isRest: boolean): string {
  const base = DURATION_VEX[type] ?? 'q'
  return `${base}${isRest ? 'r' : ''}${'d'.repeat(dots)}`
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
  // 块宽 = 音符排版宽 + 右侧留白；showPrefix 需额外容纳谱号/调号/拍号
  // （4 降号调号约 170px + 拍号 60px + 谱号 40px，若不足会把音符挤出块外）
  const prefixExtra = showPrefix ? 270 : 0
  const width = Math.min(640, Math.max(160, measure.notes.length * 7 + 120 + prefixExtra))

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancelled = false
    const render = async () => {
      const { Dot, Formatter, Renderer, Stave, StaveNote, StaveTie, Voice } = await import('vexflow')
      if (cancelled || !el) return
      el.innerHTML = ''
      const renderer = new Renderer(el, Renderer.Backends.SVG)
      renderer.resize(width, height)
      const ctx = renderer.getContext()

      // 先为每行谱表建 stave + 音符 + voice（不急着画）
      const blocks: {
        y: number
        stave: InstanceType<typeof Stave>
        voice: InstanceType<typeof Voice>
        meta: { vn: InstanceType<typeof StaveNote>; ts: boolean; tp: boolean }[]
      }[] = []
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

        // 按发音点合并：和弦音（c=true）并入前一个音符的 keys，共享符干与时值
        const vexNotes: InstanceType<typeof StaveNote>[] = []
        // 每个新音符（起点）的元信息：附点数、连音开始/结束标记，用于兜底画附点与连音线
        const meta: { vn: InstanceType<typeof StaveNote>; ts: boolean; tp: boolean }[] = []
        let curKeys: string[] = []
        let curDur = 'q'
        let curRest = false
        let curTs = false
        let curTp = false
        let curDots = 0
        const flush = () => {
          if (curKeys.length === 0) return
          const vn = new StaveNote({
            keys: curRest ? ['b/4'] : curKeys,
            duration: curDur,
            clef,
          })
          vn.setStyle({ fillStyle: INK, strokeStyle: INK })
          // 附点：duration 'xd' 已带点；若 VexFlow 未自动挂 Dot 修饰则手动补上（保证视觉点）
          if (curDots > 0 && vn.getModifiersByType('Dot').length === 0) {
            for (let k = 0; k < vn.getKeys().length; k++) vn.addModifier(new Dot(), k)
          }
          vexNotes.push(vn)
          meta.push({ vn, ts: curTs, tp: curTp })
          curKeys = []
          curTs = false
          curTp = false
          curDots = 0
        }
        for (const n of measure.notes.filter((x) => x.st === staffNum)) {
          const dur = vexDuration(n.t, n.dot, !n.p)
          if (!n.c) {
            flush()
            curKeys = n.p ? [vexKeyOf({ step: n.p.s, octave: n.p.o, alter: n.p.a })] : []
            curDur = dur
            curRest = !n.p
            curTs = !!n.ts
            curTp = !!n.tp
            curDots = n.dot || 0
          } else if (n.p) {
            curKeys.push(vexKeyOf({ step: n.p.s, octave: n.p.o, alter: n.p.a }))
          }
        }
        flush()

        const voice = new Voice({
          numBeats: measure.beats,
          beatValue: measure.beatType,
        })
          .setMode(Voice.Mode.SOFT)
          .addTickables(vexNotes)
        blocks.push({ y, stave, voice, meta })
      }

      // 谱号/调号/拍号字形用主文字色（draw 前设 ctx 默认色）
      ctx.setFillStyle(INK).setStrokeStyle(INK)
      for (const b of blocks) {
        b.stave.setStyle({ strokeStyle: LINE }).setContext(ctx).draw()
      }

      // 双手共享一个 Formatter：按同一时间网格排布，同拍点音符垂直对齐（与纸质谱一致）。
      // 注意不能走 formatToStave：它会把所有 voice 强制挂到同一个 stave，同 tick 的
      // 左右手音符会被 VexFlow 当作同一和弦做避让位移（约 30px），反而对不齐。
      // 参照 VexFlow System.format 的做法：每个音符保留自己的 stave、
      // 统一 noteStartX、formatter.format() 按 tick 对齐。
      if (blocks.length > 0) {
        const startX = Math.max(...blocks.map((b) => b.stave.getNoteStartX()))
        for (const b of blocks) {
          b.stave.setNoteStartX(startX)
          b.voice.setStave(b.stave)
          b.voice.getTickables().forEach((t) => t.setStave(b.stave))
        }
        const formatter = new Formatter().joinVoices(blocks.map((b) => b.voice))
        const justifyWidth =
          blocks[0].stave.getWidth() - (startX - blocks[0].stave.getX()) - Stave.defaultPadding
        formatter.format(
          blocks.map((b) => b.voice),
          justifyWidth,
          { alignRests: false },
        )
        for (const b of blocks) b.voice.draw(ctx, b.stave)

        // 连音线（同小节内 ts→tp 配对，按谱表/声部顺序就近连接）
        for (const b of blocks) {
          for (let i = 0; i < b.meta.length; i++) {
            const m = b.meta[i]
            if (!m.ts) continue
            const end = b.meta.slice(i + 1).find((x) => x.tp)
            if (!end) continue
            const keyCount = m.vn.getKeys().length
            const idxs = Array.from({ length: keyCount }, (_, k) => k)
            new StaveTie({
              firstNote: m.vn,
              lastNote: end.vn,
              firstIndexes: idxs,
              lastIndexes: idxs,
            })
              .setContext(ctx)
              .draw()
          }
        }

        // 小节线（结束线）
        for (const b of blocks) {
          const endX = b.stave.getX() + b.stave.getWidth()
          ctx.save()
          ctx.beginPath()
          ctx.setLineWidth(1.2)
          ctx.moveTo(endX, b.y - 30)
          ctx.lineTo(endX, b.y + 42)
          ctx.stroke()
          ctx.restore()
        }
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
    >
      <span className="piece-measure__no">第 {measure.n} 小节</span>
    </div>
  )
}
