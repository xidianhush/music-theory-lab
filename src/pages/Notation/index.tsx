import { useState } from 'react'
import PageShell from '../../components/ui/PageShell'
import StaffView from '../../components/staff'
import NoteReadingDrill from '../../components/quiz/NoteReadingDrill'
import { cMajorScaleOneOctave, noteByName } from '../../data/notes'

const STAFF_POOL = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']

export default function Notation() {
  const scale = cMajorScaleOneOctave(4)
  const [hearTarget, setHearTarget] = useState(
    () => STAFF_POOL[Math.floor(Math.random() * STAFF_POOL.length)],
  )
  const hearNote = noteByName(hearTarget)

  return (
    <PageShell
      title="五线谱基础"
      intro="看懂乐谱的第一步：谱号决定音高的参照系，音名对应键盘上的位置，时值决定音符的长短。"
      sections={[
        {
          key: 'learn',
          phase: '讲',
          title: '谱号 · 音名 · 时值',
          body: (
            <>
              <p>高音谱表从下往上：E4、F4、G4、A4、B4、C5…（每级字母名升一格）。</p>
              <p>音名 C D E F G A B 循环排列；时值：全音符 = 4 拍，二分 = 2 拍，四分 = 1 拍，八分 = ½ 拍。</p>
            </>
          ),
        },
        {
          key: 'see',
          phase: '看',
          title: 'C 大调音阶在谱面上长什么样',
          body: (
            <>
              <StaffView
                title="高音谱表 · 4/4 · C 大调音阶（八分音符）"
                notes={scale.map((n) => ({ name: n.name, midi: n.midi, duration: '8' }))}
              />
              <p style={{ marginTop: 'var(--space-4)' }}>
                点击任意音符可以听音，音名标在音符下方。八分音符八个 = 一小节（4 拍）。
              </p>
            </>
          ),
        },
        {
          key: 'hear',
          phase: '听',
          title: '点谱听音',
          body: (
            <>
              <StaffView
                title={`随机单音（当前：${hearTarget}）`}
                notes={[{ name: hearTarget, midi: hearNote.midi, duration: 'q' }]}
                showLabels={false}
                height={170}
              />
              <div style={{ marginTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() =>
                    setHearTarget(STAFF_POOL[Math.floor(Math.random() * STAFF_POOL.length)])
                  }
                >
                  换一个音
                </button>
                <span style={{ color: 'var(--text-faint)', fontSize: 'var(--text-sm)', marginLeft: 'var(--space-3)' }}>
                  点击谱面上的音符发声，先听再认位置
                </span>
              </div>
            </>
          ),
        },
        {
          key: 'drill',
          phase: '练',
          title: '看谱选音名',
          body: <NoteReadingDrill />,
        },
      ]}
      footer="已实现：VexFlow 真实谱面渲染、点谱发声、音名标注、读谱练习。下一步：节奏跟打 / 音阶键盘高亮。"
    />
  )
}
