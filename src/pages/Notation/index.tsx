import PageShell from '../../components/ui/PageShell'
import StaffView from '../../components/staff'
import Piano from '../../components/piano'
import { naturalNotes } from '../../data/notes'

export default function Notation() {
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
          title: '谱面与音名对照',
          body: (
            <>
              <StaffView title="高音谱表（示意）" />
              <table className="data-table">
                <thead>
                  <tr>
                    <th>音名</th>
                    <th>音级</th>
                    <th>MIDI</th>
                  </tr>
                </thead>
                <tbody>
                  {naturalNotes(4).map((n) => (
                    <tr key={n.name}>
                      <td>
                        <code>{n.name}</code>
                      </td>
                      <td>{n.pitchClass}</td>
                      <td>{n.midi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ),
        },
        {
          key: 'hear',
          phase: '听',
          title: '点键听音',
          body: <Piano />,
        },
        {
          key: 'drill',
          phase: '练',
          title: '读谱小练习',
          body: <div className="placeholder">听音辨位 / 看谱唱名练习 · 待实现（M2）</div>,
        },
      ]}
      footer="下一步（M2）：接入 VexFlow 渲染真实谱面，键盘点击发声。"
    />
  )
}
