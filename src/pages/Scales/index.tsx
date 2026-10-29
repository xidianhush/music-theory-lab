import PageShell from '../../components/ui/PageShell'
import Piano from '../../components/piano'
import QuizCard from '../../components/quiz'
import { SCALES } from '../../data/scales'
import { scaleNoteNames, MAJOR_STEPS, NATURAL_MINOR_STEPS } from '../../engine/scale'
import { EXERCISES } from '../../data/exercises'

export default function Scales() {
  const scaleExercises = EXERCISES.filter((e) => e.type === 'identifyScale')
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
          title: '音阶试听',
          body: <Piano />,
        },
        {
          key: 'drill',
          phase: '练',
          title: '调式识别练习',
          body: scaleExercises.map((e) => <QuizCard key={e.id} exercise={e} />),
        },
      ]}
      footer="下一步（M2）：音阶在键盘 / 谱面高亮播放，听音辨调。"
    />
  )
}
