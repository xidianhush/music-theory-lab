/** 乐谱模型：MusicXML → 网站内部表示（M4） */

export type Step = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

export interface ScorePitch {
  step: Step
  octave: number
  /** 变化音：0 自然，-1 降，+1 升 */
  alter: number
}

export interface ScoreNote {
  /** null 表示休止符 */
  pitch: ScorePitch | null
  /** MusicXML duration（以 divisions 为单位） */
  duration: number
  /** 时值类型：'whole' | 'half' | 'quarter' | 'eighth' | '16th' … */
  type: string
  dots: number
  voice: number
  /** 1 = 高音谱表（右手），2 = 低音谱表（左手） */
  staff: number
  /** 与前一个音符同时发声（和弦音） */
  chord: boolean
  tieStart: boolean
  tieStop: boolean
}

export interface ScoreMeasure {
  number: number
  fifths: number
  beats: number
  beatType: number
  notes: ScoreNote[]
}

export interface Score {
  title: string
  /** 一拍对应的 duration 单位（MusicXML） */
  divisions: number
  staves: number
  measures: ScoreMeasure[]
}
