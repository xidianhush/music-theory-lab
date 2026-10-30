import { useMemo, useState } from 'react'
import { SCALES } from '../../data/scales'
import type { ScaleDef } from '../../data/scales'
import { scaleMidi, scaleNoteNames } from '../../engine/scale'
import { useSequencedPlayer } from '../../hooks'
import Piano from '../piano'

/** 从调式标签池随机取 1 个正确答案 + 3 个干扰项并洗牌 */
function pickOptionLabels(correctLabel: string): string[] {
  const wrong = SCALES.map((s) => s.label).filter((l) => l !== correctLabel)
  const picks = [correctLabel]
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

function randomScale(): ScaleDef {
  return SCALES[Math.floor(Math.random() * SCALES.length)]
}

/** 听音辨调：播放音阶 → 选出调式；答完后在键盘上展示音阶形状 */
export default function ScaleEarDrill() {
  const [target, setTarget] = useState<ScaleDef>(randomScale)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const { play, stop, currentIndex } = useSequencedPlayer()

  const options = useMemo(() => pickOptionLabels(target.label), [target.label])
  const midis = useMemo(() => scaleMidi(target.key, target.quality, 4), [target])
  const correct = submitted && selected !== null && options[selected] === target.label

  const listen = () => play(midis, 450)
  const next = () => {
    stop()
    setTarget(randomScale())
    setSelected(null)
    setSubmitted(false)
  }

  return (
    <div className="quiz-card">
      <div className="quiz-card__prompt">播放下面的音阶，选出它是什么调式（可反复听）</div>
      <div className="quiz-card__options">
        <button type="button" className="btn btn--primary" onClick={listen}>
          播放音阶
        </button>
        <button type="button" className="btn btn--ghost" onClick={stop}>
          停止
        </button>
      </div>
      <div className="quiz-card__options">
        {options.map((label, i) => {
          let cls = 'btn btn--ghost'
          if (submitted) {
            if (label === target.label) cls += ' quiz-card__option--correct'
            else if (i === selected) cls += ' quiz-card__option--wrong'
            else cls += ' quiz-card__option--dim'
          } else if (i === selected) {
            cls += ' quiz-card__option--selected'
          }
          return (
            <button
              key={label}
              type="button"
              className={cls}
              disabled={submitted}
              onClick={() => setSelected(i)}
            >
              {label}
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
          <span>{correct ? '答对了！' : '答错了。'}</span> 这是 {target.label}（{target.description}），
          音阶构成：{scaleNoteNames(target.key, target.quality).join(' ')}
          <button type="button" className="btn btn--ghost quiz-card__retry" onClick={next}>
            换一题
          </button>
        </div>
      )}
      {submitted && (
        <>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Piano highlighted={midis} active={currentIndex !== null ? midis[currentIndex] : null} />
          </div>
          <div className="quiz-card__hint" style={{ marginTop: 'var(--space-3)' }}>
            上面是这条音阶在键盘上的形状，可再点「播放音阶」边听边看。
          </div>
        </>
      )}
    </div>
  )
}
