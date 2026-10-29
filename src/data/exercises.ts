export type ExerciseType = 'identifyTimeSignature' | 'identifyScale'

export interface Exercise {
  id: string
  type: ExerciseType
  prompt: string
  options: string[]
  answerIndex: number
  explanation: string
}

/** M0 先放少量示例题；M2 起扩展题库并支持听音题 */
export const EXERCISES: Exercise[] = [
  {
    id: 'ts-01',
    type: 'identifyTimeSignature',
    prompt: '「强-弱-次强-弱」、每小节四拍的律动，最可能是哪个拍号？',
    options: ['2/4', '3/4', '4/4', '6/8'],
    answerIndex: 2,
    explanation: '4/4 拍的强弱规律正是「强-弱-次强-弱」。',
  },
  {
    id: 'ts-02',
    type: 'identifyTimeSignature',
    prompt: '圆舞曲「嘣-嚓-嚓」三拍一组的律动，最可能是哪个拍号？',
    options: ['4/4', '3/4', '2/4', '6/8'],
    answerIndex: 1,
    explanation: '3/4 拍每小节三拍：强-弱-弱。',
  },
  {
    id: 'scale-01',
    type: 'identifyScale',
    prompt: '无升降号、从 C 开始的「全全半全全全半」，是哪个调？',
    options: ['C 大调', 'A 大调', '♭B 大调', 'G 大调'],
    answerIndex: 0,
    explanation: 'C 大调：白键自然音，无升降号。',
  },
  {
    id: 'scale-02',
    type: 'identifyScale',
    prompt: '三个升号（F#、C#、G#）、主音为 A 的大调是？',
    options: ['C 大调', 'A 大调', '♭B 大调', 'D 大调'],
    answerIndex: 1,
    explanation: 'A 大调 = 三个升号：F#、C#、G#。',
  },
]
