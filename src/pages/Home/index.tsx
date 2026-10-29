import Card from '../../components/ui/Card'

const MODULES = [
  {
    to: '/notation',
    tag: '核心模块',
    title: '五线谱基础',
    desc: '谱号、音名与音高、音符时值——学会「看懂」乐谱。',
  },
  {
    to: '/rhythm',
    tag: '核心模块',
    title: '节拍与节奏',
    desc: '拍号（4/4、3/8、6/8…）、节拍器与强弱规律。',
  },
  {
    to: '/scales',
    tag: '核心模块',
    title: '调式与音阶',
    desc: '大调 / 小调、调号与五度圈：C 大调、A 大调、♭B 大调…',
  },
]

export default function Home() {
  return (
    <div className="page">
      <header className="page__head">
        <h1>乐理实验室</h1>
        <p>
          交互式乐理学习：每个知识点都走「讲 → 看 → 听 → 练」的闭环，
          让概念、五线谱和声音三者实时绑定。
        </p>
      </header>
      <section className="page__section">
        <h2>开始学习</h2>
        <div className="card-grid">
          {MODULES.map((m) => (
            <Card key={m.to} {...m} />
          ))}
        </div>
      </section>
      <section className="page__section">
        <h2>项目路线图</h2>
        <div className="page__body">
          <p>
            M0 工程骨架（当前）→ M1 引擎与数据 → M2 第一个闭环（节拍模块）→ M3
            复制范式到音阶与五线谱。
          </p>
          <p>进阶内容（音程、和弦、视唱练耳）规划在二期，模块化结构下可直接追加。</p>
        </div>
      </section>
    </div>
  )
}
