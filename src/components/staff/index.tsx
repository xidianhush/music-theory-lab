import { useEffect, useRef, useState } from 'react'
import { audioEngine } from '../../engine/audio'
import { toVexKey } from '../../engine/notation'

export interface StaffNoteInput {
  name: string
  midi: number
  duration?: 'w' | 'h' | 'q' | '8' | '16'
}

interface StaffViewProps {
  title?: string
  notes: StaffNoteInput[]
  timeSignature?: { numerator: number; denominator: number }
  /** 是否在音符下方标注音名（学习用） */
  showLabels?: boolean
  onNoteClick?: (note: StaffNoteInput) => void
  height?: number
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/**
 * 五线谱视图：VexFlow 渲染真实谱面。
 * 音符区域叠加透明点击热区（基于绘制后的包围盒定位），
 * 点击即发声（audioEngine），并高亮当前音符；可显示音名标注。
 */
export default function StaffView({
  title,
  notes,
  timeSignature = { numerator: 4, denominator: 4 },
  showLabels = true,
  onNoteClick,
  height = 190,
}: StaffViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const handleNoteClick = (index: number) => {
    const note = notes[index]
    if (!note) return
    audioEngine.playMidi(note.midi, 0.4)
    setActiveIndex(index)
    onNoteClick?.(note)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    let observer: ResizeObserver | null = null

    // 动态加载 VexFlow（约 1MB），只在使用谱面时下载，避免拖累首屏
    const render = async () => {
      const { Formatter, Renderer, Stave, StaveNote, Voice } = await import('vexflow')
      if (cancelled || !container) return
      const width = container.clientWidth || 640
      const renderer = new Renderer(container, Renderer.Backends.SVG)
      renderer.resize(width, height)
      const ctx = renderer.getContext()

      const stave = new Stave(40, 24, width - 80)
      stave
        .addClef('treble')
        .addTimeSignature(`${timeSignature.numerator}/${timeSignature.denominator}`)
      stave.setContext(ctx).draw()

      if (notes.length > 0) {
        const vexNotes = notes.map(
          (n) =>
            new StaveNote({
              keys: [toVexKey(n.name)],
              duration: n.duration ?? 'q',
              clef: 'treble',
            }),
        )
        const voice = new Voice({
          numBeats: timeSignature.numerator,
          beatValue: timeSignature.denominator,
        })
          .setMode(Voice.Mode.SOFT)
          .addTickables(vexNotes)
        new Formatter().joinVoices([voice]).formatToStave([voice], stave)
        voice.draw(ctx, stave)

        setBoxes(
          vexNotes.map((vn) => {
            const bb = vn.getBoundingBox()
            return bb
              ? { x: bb.getX(), y: bb.getY(), w: bb.getW(), h: bb.getH() }
              : { x: 0, y: 0, w: 0, h: 0 }
          }),
        )
      } else {
        setBoxes([])
      }
    }

    void render()
    observer = new ResizeObserver(() => {
      container.innerHTML = ''
      void render()
    })
    observer.observe(container)

    return () => {
      cancelled = true
      observer?.disconnect()
      container.innerHTML = ''
    }
  }, [notes, timeSignature.numerator, timeSignature.denominator, height])

  return (
    <div className="staffview" ref={containerRef} style={{ minHeight: height, position: 'relative' }}>
      {title && <div className="staffview__title">{title}</div>}
      {boxes.map((box, i) =>
        box.w > 0 && box.h > 0 ? (
          <button
            key={`hit-${i}`}
            type="button"
            className={`staffview__hit ${activeIndex === i ? 'staffview__hit--active' : ''}`}
            style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
            onClick={() => handleNoteClick(i)}
            aria-label={`播放 ${notes[i]?.name ?? i}`}
          />
        ) : null,
      )}
      {showLabels &&
        boxes.map((box, i) =>
          box.w > 0 ? (
            <span
              key={`label-${i}`}
              className="staffview__label"
              style={{ left: box.x + box.w / 2, top: box.y + box.h + 4 }}
            >
              {notes[i]?.name}
            </span>
          ) : null,
        )}
    </div>
  )
}
