import { useState } from 'react'
import type { Exercise } from '../../data/exercises'

/** 练习卡片：选择 → 提交 → 即时对错反馈 + 讲解；可再练一次 */
export default function QuizCard({ exercise }: { exercise: Exercise }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const correct = submitted && selected === exercise.answerIndex

  return (
    <div className="quiz-card">
      <div className="quiz-card__prompt">{exercise.prompt}</div>
      <div className="quiz-card__options">
        {exercise.options.map((option, i) => {
          let cls = 'btn btn--ghost'
          if (submitted) {
            if (i === exercise.answerIndex) cls += ' quiz-card__option--correct'
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
          <span>{correct ? '答对了！' : '答错了。'}</span> {exercise.explanation}
          <button
            type="button"
            className="btn btn--ghost quiz-card__retry"
            onClick={() => {
              setSelected(null)
              setSubmitted(false)
            }}
          >
            再练一次
          </button>
        </div>
      )}
    </div>
  )
}
