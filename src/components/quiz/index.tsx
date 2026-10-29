import type { Exercise } from '../../data/exercises'

/** 练习卡片（M2 实现答题与即时反馈）；目前只渲染题干与选项 */
export default function QuizCard({ exercise }: { exercise: Exercise }) {
  return (
    <div className="quiz-card">
      <div className="quiz-card__prompt">{exercise.prompt}</div>
      <div className="quiz-card__options">
        {exercise.options.map((option) => (
          <button key={option} type="button" className="btn btn--ghost">
            {option}
          </button>
        ))}
      </div>
      <div className="quiz-card__hint">答题与即时对错反馈 · 待实现（M2）</div>
    </div>
  )
}
