import { useMemo, useState } from 'react'
import PageShell from '../../components/ui/PageShell'
import Piano from '../../components/piano'
import ScaleEarDrill from '../../components/quiz/ScaleEarDrill'
import { SCALES } from '../../data/scales'
import type { ScaleDef } from '../../data/scales'
import { scaleNoteNames, scaleMidi, MAJOR_STEPS, NATURAL_MINOR_STEPS } from '../../engine/scale'
import { useSequencedPlayer } from '../../hooks'

export default function Scales() {
  const [scale, setScale] = useState<ScaleDef>(SCALES[0])
  const { play, stop, currentIndex } = useSequencedPlayer()
  const midis = useMemo(() => scaleMidi(scale.key, scale.quality, 4), [scale])
  const activeMidi =
    currentIndex !== null && currentIndex < midis.length ? midis[currentIndex] : null

  const selectScale = (s: ScaleDef) => {
    stop()
    setScale(s)
  }

  return (
    <PageShell
      title="调式与音阶"
      intro="大调明亮、小调忧郁——区别来自音阶里半音的位置。全全半全全全半 = 大调；全半全全半全全 = 自然小调。"
      sections={[
        {
          key: 'learn',
          phase: '讲',
          title: '大调与小调',
          body: (
            <>
              <p>
                大调音阶：<code>{MAJOR_STEPS.join(' ')}</code>（全全半全全全半）。
              </p>
              <p>
                自然小调音阶：<code>{NATURAL_MINOR_STEPS.join(' ')}</code>（全半全全半全全）。
              </p>
              <p>主音决定调名：从 C 开始走大调音阶 → C 大调；从 A 开始走自然小调 → a 小调。</p>
            </>
          ),
        },
        {
          key: 'see',
          phase: '看',
          title: '常用调式与音阶构成',
          body: (
            <table className="data-table">
              <thead>
                <tr>
                  <th>调式</th>
                  <th>升降号</th>
                  <th>音阶构成</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {SCALES.map((s) => (
                  <tr key={`${s.key}-${s.quality}`}>
                    <td>
                      <code>{s.label}</code>
                    </td>
                    <td>{s.sharpsFlats > 0 ? `+${s.sharpsFlats}` : s.sharpsFlats === 0 ? '0' : s.sharpsFlats}</td>
                    <td>
                      <code>{scaleNoteNames(s.key, s.quality).join(' ')}</code>
                    </td>
                    <td>{s.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        },
        {
          key: 'hear',
          phase: '听',
          title: '键盘上的音阶',
          body: (
            <>
              <div className="metro__row">
                <span className="metro__label">调式</span>
                <div className="metro__sig-group">
                  {SCALES.map((s) => (
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
              <div className="metro__row" style={{ marginTop: 'var(--space-3)' }}>
                <button type="button" className="btn btn--primary" onClick={() => play(midis, 450)}>
                  播放音阶
                </button>
                <button type="button" className="btn btn--ghost" onClick={stop}>
                  停止
                </button>
                <span className="metro__hint">蓝色 = 音阶各音，播放中的音更亮；点击键盘任意键也可发声</span>
              </div>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Piano highlighted={midis} active={activeMidi} />
              </div>
            </>
          ),
        },
        {
          key: 'drill',
          phase: '练',
          title: '听音辨调',
          body: <ScaleEarDrill />,
        },
      ]}
      footer="已实现：键盘点键发声、音阶播放高亮、听音辨调练习（答完展示键盘音阶形状）。"
    />
  )
}
