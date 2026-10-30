import { Link } from 'react-router-dom'
import PageShell from '../../components/ui/PageShell'
import { PIECES_META } from '../../data/pieces'

/** 曲目库：导入的真实钢琴谱入口（M4） */
export default function Pieces() {
  return (
    <PageShell
      title="曲目库"
      intro="把真实钢琴谱导入网站，在真实音乐里学乐理、跟着谱子练琴。当前收录 1 首（MusicXML 引擎解析入库）。"
      sections={[
        {
          key: 'lib',
          phase: '库',
          title: '真实曲目',
          body: (
            <div className="piece-grid">
              {PIECES_META.map((m) => (
                <Link key={m.id} to={`/pieces/${m.id}`} className="piece-card">
                  <div className="piece-card__head">
                    <span className="piece-card__title">{m.title}</span>
                    <span className="piece-card__tag">{m.difficulty}</span>
                  </div>
                  <div className="piece-card__meta">
                    {m.composer} · {m.lyricist ? `${m.lyricist} · ` : ''}
                    {m.pages} 页 / {m.measures} 小节
                  </div>
                  <p className="piece-card__desc">{m.description}</p>
                  <div className="piece-card__cta">进入跟弹 →</div>
                </Link>
              ))}
            </div>
          ),
        },
      ]}
      footer="如何入库：PDF → Audiveris（OMR 识别）→ MusicXML → 人工校对调号 → 引擎解析入库。详见 docs/architecture.md。"
    />
  )
}
