import PageShell from '../../components/ui/PageShell'
import Metronome from '../../components/metronome'
import QuizCard from '../../components/quiz'
import { TIME_SIGNATURES } from '../../data/timeSignatures'
import { EXERCISES } from '../../data/exercises'

export default function Rhythm() {
  const tsExercises = EXERCISES.filter((e) => e.type === 'identifyTimeSignature')
  return (
    <PageShell
      title="节拍与节奏"
      intro="拍号 = 分子（每小节几拍）+ 分母（以几分音符为一拍）。学会它，你就知道一首歌的「心跳」长什么样。"
      sections={[
        {
          key: 'learn',
          phase: '讲',
          title: '什么是拍号',
          body: (
            <>
              <p>
                <code>4/4</code>：每小节 4 拍，以四分音符为一拍，强弱规律「强-弱-次强-弱」。
              </p>
              <p>
                <code>6/8</code>：每小节 6 拍，以八分音符为一拍，复拍子按「两拍一组」律动。
              </p>
              <p>拍号写法：分子在上（拍数），分母在下（以几分音符为一拍）。</p>
            </>
          ),
        },
        {
          key: 'see',
          phase: '看',
          title: '常见拍号表',
          body: (
            <table className="data-table">
              <thead>
                <tr>
                  <th>拍号</th>
                  <th>每小节拍数</th>
                  <th>强弱规律</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {TIME_SIGNATURES.map((ts) => (
                  <tr key={ts.label}>
                    <td>
                      <code>{ts.label}</code>
                    </td>
                    <td>{ts.numerator}</td>
                    <td>{ts.accentPattern}</td>
                    <td>{ts.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        },
        {
          key: 'hear',
          phase: '听',
          title: '节拍器演示',
          body: <Metronome />,
        },
        {
          key: 'drill',
          phase: '练',
          title: '拍号识别练习',
          body: tsExercises.map((e) => <QuizCard key={e.id} exercise={e} />),
        },
      ]}
      footer="已实现：节拍器打拍、强弱拍视觉高亮、速度与拍号调节、练习即时反馈。下一步：节奏跟打与实时对拍。"
    />
  )
}
