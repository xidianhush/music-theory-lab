import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageShell from '../../components/ui/PageShell'
import Piano from '../../components/piano'
import PieceStaff from '../../components/pieces/PieceStaff'
import type { Hand } from '../../components/pieces/PieceStaff'
import { PIECES_META, loadPiece } from '../../data/pieces'
import type { Piece } from '../../data/pieces'
import { AudioEngine, audioEngine } from '../../engine/audio'
import { keyFromFifths, measureSeconds, measureOnsets, pieceMeasureToScoreMeasure } from '../../engine/score'
import { scaleMidi } from '../../engine/scale'
import { analyzePieceHarmony } from '../../engine/harmony'

export default function PieceDetail() {
  const { id } = useParams()
  const meta = PIECES_META.find((p) => p.id === id)
  const [piece, setPiece] = useState<Piece | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hand, setHand] = useState<Hand>('both')
  const [bpm, setBpm] = useState(95)
  const [sel, setSel] = useState<number | null>(null)
  const [playingN, setPlayingN] = useState<number | null>(null)
  const [playingAll, setPlayingAll] = useState(false)
  const [loop, setLoop] = useState(true)
  const [activeMidi, setActiveMidi] = useState<number | null>(null)
  const [activeProg, setActiveProg] = useState<number | null>(null)

  const harmony = useMemo(() => (piece ? analyzePieceHarmony(piece) : null), [piece])

  const timers = useRef<number[]>([])
  const loopRef = useRef(loop)
  loopRef.current = loop
  const playingRef = useRef<number | null>(null)

  useEffect(() => {
    if (!id) return
    let ok = true
    loadPiece(id)
      .then((p) => ok && setPiece(p))
      .catch((e) => ok && setError(String(e)))
    return () => {
      ok = false
    }
  }, [id])

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
  }

  useEffect(() => () => clearTimers(), [])

  const stop = () => {
    clearTimers()
    audioEngine.stopAll() // 取消 WebAudio 时间轴上已排定的音符（否则停止后声音继续）
    playingRef.current = null
    setPlayingN(null)
    setPlayingAll(false)
    setActiveMidi(null)
  }

  /** 连续播放整曲（或从选中小节起）：各小节按相对延迟无缝衔接 */
  const playAll = () => {
    if (!piece) return
    stop()
    const secPerQuarter = 60 / bpm
    const startN = sel ?? 1
    let accum = 0
    let totalSec = 0
    setPlayingAll(true)
    playingRef.current = -1
    for (const m of piece.measures) {
      if (m.n < startN) continue
      const sm = pieceMeasureToScoreMeasure(m)
      const onsets = measureOnsets(sm, piece.divisions)
      const ms = measureSeconds(sm, bpm)
      onsets.forEach((o, i) => {
        // 相对延迟：与下方 setTimeout 高亮同一时间原点（调用时刻），声画同步
        const delay = accum + o.quarterPos * secPerQuarter
        const nextPos = onsets[i + 1]?.quarterPos ?? ms / secPerQuarter
        const dur = Math.max(0.09, (nextPos - o.quarterPos) * secPerQuarter * 0.92)
        for (const midi of o.midis) {
          audioEngine.scheduleToneDelay(AudioEngine.midiToFrequency(midi), delay, dur, 0.13)
          timers.current.push(
            window.setTimeout(() => setActiveMidi(midi), Math.max(0, delay * 1000 - 30)),
          )
        }
      })
      // 小节开始时刻切换谱面高亮
      timers.current.push(
        window.setTimeout(() => setPlayingN(m.n), Math.max(0, accum * 1000 - 40)),
      )
      accum += ms
      totalSec = accum
    }
    timers.current.push(
      window.setTimeout(() => {
        stop()
      }, totalSec * 1000 + 150),
    )
  }

  const playMeasure = (n: number) => {
    if (!piece) return
    stop()
    const measure = piece.measures.find((m) => m.n === n)
    if (!measure) return
    const sm = pieceMeasureToScoreMeasure(measure)
    const onsets = measureOnsets(sm, piece.divisions)
    const secPerQuarter = 60 / bpm
    playingRef.current = n
    setPlayingN(n)
    const total = measureSeconds(sm, bpm)
    onsets.forEach((o, i) => {
      const delay = o.quarterPos * secPerQuarter
      const nextPos = onsets[i + 1]?.quarterPos ?? total / secPerQuarter
      const dur = Math.max(0.09, (nextPos - o.quarterPos) * secPerQuarter * 0.92)
      for (const midi of o.midis) {
        audioEngine.scheduleToneDelay(AudioEngine.midiToFrequency(midi), delay, dur, 0.13)
        timers.current.push(window.setTimeout(() => setActiveMidi(midi), Math.max(0, delay * 1000 - 30)))
      }
    })
    const totalMs = total * 1000
    if (loopRef.current) {
      timers.current.push(window.setTimeout(() => playMeasure(n), totalMs + 150))
    } else {
      timers.current.push(window.setTimeout(() => stop(), totalMs + 80))
    }
  }

  const selectMeasure = (n: number) => {
    if (playingRef.current === n) {
      stop()
      setSel(null)
      return
    }
    setSel(n)
    playMeasure(n)
  }

  const changeHand = (h: Hand) => {
    stop()
    setHand(h)
  }

  const changeBpm = (v: number) => {
    stop()
    setBpm(v)
  }

  const selPage = useMemo(() => {
    if (!piece || sel === null) return null
    return piece.pages.find((p) => sel >= p.measureStart && sel <= p.measureEnd) ?? null
  }, [piece, sel])

  const selMeasure = useMemo(() => {
    if (!piece || sel === null) return null
    return piece.measures.find((m) => m.n === sel) ?? null
  }, [piece, sel])

  const pianoStart = 48
  const pianoEnd = 84
  const highlighted = useMemo(() => {
    if (!piece || !selPage) return []
    const key = keyFromFifths(selPage.fifths)
    return scaleMidi(key.root, 'major', 4).filter((m) => m >= pianoStart && m <= pianoEnd)
  }, [piece, selPage])

  if (error) {
    return (
      <PageShell
        title="曲目加载失败"
        intro=""
        sections={[{ key: 'e', phase: '!', title: '错误', body: <p className="page__body">{error}</p> }]}
      />
    )
  }

  if (!piece) {
    return (
      <PageShell
        title="曲目加载中"
        intro=""
        sections={[{ key: 'l', phase: '…', title: '读取乐谱', body: <p className="page__body">正在加载 MusicXML 入库的曲目数据…</p> }]}
      />
    )
  }

  return (
    <PageShell
      title={meta ? `${meta.title} · 真实曲目跟弹` : '真实曲目跟弹'}
      intro={`${meta?.composer ?? piece.composer}《${piece.title}》  ${meta?.lyricist ?? ''} · ${piece.bpm} BPM · 4/4 · ${piece.pages.length} 页 / ${piece.measures.length} 小节`}
      sections={[
        {
          key: 'story',
          phase: '调',
          title: '整曲调性：♭A 大调',
          body: (
            <>
              <p className="page__body">
                全曲五页调号一致，都是 <b>♭A 大调（4 个降号：B♭ · E♭ · A♭ · D♭）</b>——没有转调。跟着每一页谱首的调号确认一下：
              </p>
              <div className="piece-journey">
                {piece.pages.map((p, i) => (
                  <div className="piece-journey__item" key={p.page}>
                    <div className="piece-journey__badge">{p.label}</div>
                    <div className="piece-journey__meta">
                      第 {p.page} 页 · 小节 {p.measureStart}–{p.measureEnd}
                    </div>
                    <div className="piece-journey__note">{p.note}</div>
                    {i < piece.pages.length - 1 && <div className="piece-journey__arrow">→</div>}
                  </div>
                ))}
              </div>
              <p className="page__body" style={{ marginTop: 'var(--space-3)' }}>
                五页共用同一套调号（{piece.pages.map((p) => keyFromFifths(p.fifths).root).join(' → ')}），
                说明这首曲子在调性上是统一的。谱面只在小节内用临时记号处理离调音，主调从头到尾是 ♭A。
              </p>
            </>
          ),
        },
        {
          key: 'harmony',
          phase: '析',
          title: '自动识别：调式与和弦进行',
          body: (
            <>
              <p className="page__body">
                用规则引擎按小节自动识别：先由调号定调式，再取每小节拍点 0 的音集（已按调号校正临时记号），
                与「调内 7 级 × 常见三/七和弦」模板匹配得分。识别结论仅供参考——真实演奏常含转位、经过音与非和声音。
              </p>
              <div className="metro__row" style={{ marginTop: 'var(--space-2)' }}>
                <span className="metro__label">识别调式</span>
                <code className="metro__hint" style={{ fontSize: 'var(--text-md)' }}>
                  {harmony?.key.label ?? '…'}
                </code>
                <span className="piece-panel__hint">
                  {harmony
                    ? `识别出和弦的小节 ${harmony.measures.filter((m) => m.chord).length}/${harmony.measures.length}`
                    : '加载中'}
                </span>
              </div>

              {harmony && (
                <>
                  <div className="prog-strip" style={{ marginTop: 'var(--space-3)' }}>
                    {harmony.progression.map((seg, i) => (
                      <button
                        key={`${seg.measures[0]}-${i}`}
                        type="button"
                        className={`chord-chip ${activeProg === i ? 'chord-chip--active' : ''}`}
                        onClick={() => {
                          setActiveProg(i)
                          seg.pcs.forEach((pc) => audioEngine.playMidi(60 + pc, 0.9))
                        }}
                        aria-label={`小节 ${seg.measures.join('-')} ${seg.roman}`}
                      >
                        <span className="chord-chip__roman">{seg.roman}</span>
                        <span className="chord-chip__name">{seg.name}</span>
                        <span className="chord-chip__notes">
                          {seg.measures.length === 1 ? `小节 ${seg.measures[0]}` : `小节 ${seg.measures[0]}–${seg.measures[seg.measures.length - 1]}`}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="piece-panel__hint" style={{ marginTop: 'var(--space-2)' }}>
                    点击任一段可试听该和弦；未识别的小节（{harmony.measures.filter((m) => !m.chord).map((m) => m.measure).join('、') || '无'}）多为发音点音过少或休止。
                  </p>
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <Piano
                      highlighted={
                        activeProg !== null && harmony.progression[activeProg]
                          ? harmony.progression[activeProg].pcs.map((pc) => 60 + pc)
                          : harmony.progression[0]?.pcs.map((pc) => 60 + pc) ?? []
                      }
                      active={null}
                    />
                  </div>
                </>
              )}
            </>
          ),
        },
        {
          key: 'play',
          phase: '弹',
          title: '点小节跟弹（点击任意小节播放）',
          body: (
            <>
              <div className="metro__row">
                <span className="metro__label">声部</span>
                <div className="metro__sig-group">
                  {(
                    [
                      ['both', '双手'],
                      ['right', '右手'],
                      ['left', '左手'],
                    ] as [Hand, string][]
                  ).map(([h, label]) => (
                    <button
                      key={h}
                      type="button"
                      className={`btn btn--ghost metro__sig ${hand === h ? 'metro__sig--active' : ''}`}
                      onClick={() => changeHand(h)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="metro__row" style={{ marginTop: 'var(--space-3)' }}>
                <span className="metro__label">速度</span>
                <input
                  type="range"
                  min={50}
                  max={190}
                  step={5}
                  value={bpm}
                  onChange={(e) => changeBpm(Number(e.target.value))}
                  className="piece-range"
                  aria-label="播放速度 BPM"
                />
                <code className="metro__hint" style={{ minWidth: '3.2em' }}>
                  {bpm} BPM
                </code>
              </div>
              <div className="metro__row" style={{ marginTop: 'var(--space-3)' }}>
                <button type="button" className="btn btn--primary" onClick={playingAll ? stop : playAll}>
                  {playingAll ? '⏹ 停止整曲' : '▶ 连续播放整曲'}
                </button>
                <button type="button" className="btn btn--ghost" onClick={stop}>
                  停止
                </button>
                <label className="metro__hint" style={{ display: 'inline-flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
                  循环当前小节
                </label>
                <span className="metro__hint">点小节单播并高亮；连续播放从选中小节（默认第 1 小节）一路播到结尾。</span>
              </div>

              {piece.pages.map((p) => (
                <div className="piece-page" key={p.page}>
                  <div className="piece-page__head">
                    <span className="piece-page__tag">第 {p.page} 页</span>
                    <span className="piece-page__key">{p.label}</span>
                    <span className="piece-page__note">{p.note}</span>
                  </div>
                  <div className="piece-page__measures">
                    {piece.measures
                      .filter((m) => m.n >= p.measureStart && m.n <= p.measureEnd)
                      .map((m) => (
                        <PieceStaff
                          key={m.n}
                          measure={m}
                          showPrefix={m.n === p.measureStart}
                          hand={hand}
                          active={playingN === m.n}
                          onSelect={selectMeasure}
                        />
                      ))}
                  </div>
                </div>
              ))}

              {selPage && selMeasure && (
                <div className="piece-panel">
                  <h3>小节 {sel} 分析</h3>
                  <div className="piece-panel__rows">
                    <div>
                      <span className="metro__label">所在调式</span>
                      <code>{selPage.label}</code>
                      <span className="piece-panel__hint">
                        降号数 {selPage.fifths < 0 ? -selPage.fifths : `+${selPage.fifths}`}
                      </span>
                    </div>
                    <div>
                      <span className="metro__label">拍号</span>
                      <code>
                        {selMeasure.beats}/{selMeasure.beatType}
                      </code>
                      <span className="piece-panel__hint">
                        {selMeasure.notes.filter((n) => !n.c).length} 个发音点 / {selMeasure.notes.length} 个音符
                      </span>
                    </div>
                    <div>
                      <span className="metro__label">键盘提示</span>
                      <span className="piece-panel__hint">
                        高亮 = {selPage.label} 音阶各音，播放时当前音更亮
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <Piano
                      highlighted={highlighted}
                      active={activeMidi}
                      start={pianoStart}
                      end={pianoEnd}
                    />
                  </div>
                </div>
              )}
            </>
          ),
        },
      ]}
      footer={
        <span>
          真实谱例：<Link to="/pieces">曲目库</Link> · 跟弹时注意连音线（同一音延续不重复发声）、
          和弦（一个发音点多个音）与调号切换（页首会重绘谱号与调号）。
        </span>
      }
    />
  )
}
