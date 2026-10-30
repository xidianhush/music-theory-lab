import { useMemo, useState } from 'react'
import StaffView from '../staff'
import { noteByName } from '../../data/notes'

const POOL = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']

/** 从音名池随机取 1 个正确答案 + 3 个干扰项并洗牌 */
function pickOptions(correct: string): string[] {
  const wrong = POOL.filter((n) => n !== correct)
  const picks = [correct]
  while (picks.length < 4) {
    const i = Math.floor(Math.random() * wrong.length)
    picks.push(wrong.splice(i, 1)[0])
  }
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[picks[i], picks[j]] = [picks[j], picks[i]]
  }
  return picks
}

/** 读谱练习：谱面显示一个音，选出它的音名（看谱 → 唱名映射） */
export default function NoteReadingDrill() {
  const [target, setTarget] = useState(() => POOL[Math.floor(Math.random() * POOL.length)])
  const options = useMemo(() => pickOptions(target), [target])
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const correct = submitted && selected === options.findIndex((o) => o === target)

  const next = () => {
    setTarget(POOL[Math.floor(Math.random() * POOL.length)])
    setSelected(null)
    setSubmitted(false)
  }

  const note = noteByName(target)

  return (
    <div className="quiz-card">
      <div className="quiz-card__prompt">看谱回答：谱面上是哪个音？（可先点音符听一听）</div>
      <StaffView notes={[{ name: target, midi: note.midi, duration: 'q' }]} showLabels={false} height={170} />
      <div className="quiz-card__options">
        {options.map((option, i) => {
          let cls = 'btn btn--ghost'
          if (submitted) {
            if (option === target) cls += ' quiz-card__option--correct'
            else if (i === selected) cls += ' quiz-card__option--wrong'
            else cls += ' quiz-card__option--dim'
          } else if (i === selected) {
            cls += ' quiz-card__option--selected'
          }
          return (
            <button
              key={option}
              type="button"
              className={cls}
              disabled={submitted}
              onClick={() => setSelected(i)}
            >
              {option}
            </button>
          )
        })}
      </div>
      {!submitted ? (
        <button
          type="button"
          className="btn btn--primary"
          disabled={selected === null}
          onClick={() => setSubmitted(true)}
        >
          确认答案
        </button>
      ) : (
        <div
          className={`quiz-card__feedback ${correct ? 'quiz-card__feedback--ok' : 'quiz-card__feedback--bad'}`}
        >
          <span>{correct ? '答对了！' : '答错了。'}</span> 这个音是 <b>{target}</b>，
          在高音谱表上位于{' '}
          {target.endsWith('4') && target.startsWith('C') ? '下加一线（中央 C）' : '谱表内部'}。
          <button type="button" className="btn btn--ghost quiz-card__retry" onClick={next}>
            换一题
          </button>
        </div>
      )}
    </div>
  )
}
