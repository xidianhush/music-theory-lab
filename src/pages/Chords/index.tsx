import { useMemo, useRef, useState } from 'react'
import PageShell from '../../components/ui/PageShell'
import Piano from '../../components/piano'
import { SCALES } from '../../data/scales'
import type { ScaleDef } from '../../data/scales'
import { PROGRESSIONS } from '../../data/chordProgressions'
import type { ProgressionDef } from '../../data/chordProgressions'
import { scaleChords, chordMidis, chordName, romanOf } from '../../engine/chords'
import { scaleNoteNames } from '../../engine/scale'
import { audioEngine } from '../../engine/audio'

const MAJOR_SCALES = SCALES.filter((s) => s.quality === 'major')
const MINOR_SCALES = SCALES.filter((s) => s.quality === 'naturalMinor')

export default function Chords() {
  const [scale, setScale] = useState<ScaleDef>(MAJOR_SCALES[0])
  const [prog, setProg] = useState<ProgressionDef>(PROGRESSIONS[0].progressions[0])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timers = useRef<number[]>([])

  const group = useMemo(
    () => PROGRESSIONS.find((g) => g.quality === scale.quality) ?? PROGRESSIONS[0],
    [scale],
  )

  const chords = useMemo(
    () => scaleChords(scale.key, scale.quality),
    [scale],
  )
  const chords7 = useMemo(
    () => scaleChords(scale.key, scale.quality, true),
    [scale],
  )

  const progDegrees = useMemo(() => prog.degrees, [prog])
  const progSeventh = prog.seventh ?? false
  const progChords = useMemo(
    () =>
      progDegrees.map((d) => ({
        degree: d,
        roman: romanOf(d, scale.quality, progSeventh),
        name: chordName(scale.key, scale.quality, d, progSeventh),
        midis: chordMidis(scale.key, scale.quality, d, progSeventh),
        notes: scaleChords(scale.key, scale.quality, progSeventh).find((c) => c.degree === d)?.notes ?? [],
      })),
    [progDegrees, progSeventh, scale],
  )

  const stopAll = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
    audioEngine.stopAll()
    setPlaying(false)
  }

  const selectScale = (s: ScaleDef) => {
    stopAll()
    setScale(s)
    const g = PROGRESSIONS.find((x) => x.quality === s.quality) ?? PROGRESSIONS[0]
    setProg(g.progressions[0])
    setCurrentIdx(0)
  }

  const selectProg = (p: ProgressionDef) => {
    stopAll()
    setProg(p)
    setCurrentIdx(0)
  }

  const playChordAt = (idx: number) => {
    const c = progChords[idx]
    if (!c) return
    stopAll()
    setCurrentIdx(idx)
    c.midis.forEach((m) => audioEngine.playMidi(m, 0.9))
  }

  const playProgression = () => {
    if (progChords.length === 0) return
    stopAll()
    setPlaying(true)
    const intervalMs = 1200
    progChords.forEach((c, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setCurrentIdx(i)
          c.midis.forEach((m) => audioEngine.playMidi(m, 0.9))
        }, i * intervalMs),
      )
    })
    timers.current.push(
      window.setTimeout(() => setPlaying(false), progChords.length * intervalMs + 250),
    )
  }

  const highlighted = progChords[currentIdx]?.midis ?? []

  return (
    <PageShell
      title="和弦进行"
      intro="和弦是音阶的纵向堆叠，进行是它们的叙事线——I–V–vi–IV 里藏着无数金曲，ii–V–I 是爵士的万能钥匙。"
      sections={[
        {
          key: 'learn',
          phase: '讲',
          title: '和弦怎么来',
          body: (
            <>
              <p>
                以调内音阶为骨架，每个音级上叠三度就是调内和弦（三和弦）；再叠七度就是七和弦。
                大调里：<code>I ii iii IV V vi vii°</code>——前三后三，V 是属、vii° 是导。
              </p>
              <p>
                和弦进行就是把这些级数和弦连成句子：<code>I–V–vi–IV</code> 的每个和弦都共享调内音，
                所以怎么听都"顺耳"；<code>ii–V–I</code> 用属和弦的张力把听感拉回主和弦，形成终止感。
              </p>
            </>
          ),
        },
        {
          key: 'family',
          phase: '看',
          title: '调内和弦家族',
          body: (
            <>
              <div className="metro__row">
                <span className="metro__label">大调</span>
                <div className="metro__sig-group">
                  {MAJOR_SCALES.map((s) => (
                    <button
                      key={`${s.key}-${s.quality}`}
                      type="button"
                      className={`btn btn--ghost metro__sig ${s.label === scale.label ? 'metro__sig--active' : ''}`}
                      onClick={() => selectScale(s)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="metro__row" style={{ marginTop: 'var(--space-2)' }}>
                <span className="metro__label">小调</span>
                <div className="metro__sig-group">
                  {MINOR_SCALES.map((s) => (
                    <button
                      key={`${s.key}-${s.quality}`}
                      type="button"
                      className={`btn btn--ghost metro__sig ${s.label === scale.label ? 'metro__sig--active' : ''}`}
                      onClick={() => selectScale(s)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <table className="data-table" style={{ marginTop: 'var(--space-3)' }}>
                <thead>
                  <tr>
                    <th>级数</th>
                    {chords.map((c) => (
                      <th key={c.degree}>{c.roman}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>三和弦</td>
                    {chords.map((c) => (
                      <td key={c.degree}>
                        <code>{c.name}</code> <span className="piece-panel__hint">{c.notes.join(' ')}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>七和弦</td>
                    {chords7.map((c) => (
                      <td key={c.degree}>
                        <code>{c.name}</code> <span className="piece-panel__hint">{c.notes.join(' ')}</span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              <p className="page__body" style={{ marginTop: 'var(--space-2)' }}>
                当前调式音阶：<code>{scaleNoteNames(scale.key, scale.quality).join(' ')}</code>
              </p>
            </>
          ),
        },
        {
          key: 'prog',
          phase: '听',
          title: '常用和弦进行',
          body: (
            <>
              <div className="prog-grid">
                {group.progressions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`prog-card ${prog.id === p.id ? 'prog-card--active' : ''}`}
                    onClick={() => selectProg(p)}
                  >
                    <div className="prog-card__name">{p.name}</div>
                    <div className="prog-card__desc">{p.description}</div>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 'var(--space-3)' }}>
                <div className="metro__row">
                  <span className="metro__label">进行</span>
                  <div className="chord-strip">
                    {progChords.map((c, i) => (
                      <button
                        key={`${c.degree}-${i}`}
                        type="button"
                        className={`chord-chip ${currentIdx === i ? 'chord-chip--active' : ''}`}
                        onClick={() => playChordAt(i)}
                        aria-label={`和弦 ${c.roman}`}
                      >
                        <span className="chord-chip__roman">{c.roman}</span>
                        <span className="chord-chip__name">{c.name}</span>
                        <span className="chord-chip__notes">{c.notes.join(' · ')}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="metro__row" style={{ marginTop: 'var(--space-3)' }}>
                  <button type="button" className="btn btn--primary" onClick={playing ? stopAll : playProgression}>
                    {playing ? '⏹ 停止' : '▶ 播放整个进行'}
                  </button>
                  <span className="metro__hint">点击任一和弦单独听；高亮 = 当前和弦音，播放中的音更亮</span>
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-4)' }}>
                <Piano highlighted={highlighted} active={null} />
              </div>
            </>
          ),
        },
      ]}
      footer="和弦家族由「调式音阶 + 三度堆叠」自动生成；进行模式为通用模板，可在不同调上平移。"
    />
  )
}
