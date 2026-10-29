export interface TimeSignature {
  /** 分子：每小节拍数 */
  numerator: number
  /** 分母：以几分音符为一拍 */
  denominator: number
  label: string
  /** 强弱规律，如「强-弱-次强-弱」 */
  accentPattern: string
  description?: string
}

export const TIME_SIGNATURES: TimeSignature[] = [
  {
    numerator: 4,
    denominator: 4,
    label: '4/4 · 四四拍',
    accentPattern: '强-弱-次强-弱',
    description: '最常见的拍号，流行、摇滚与古典主流都使用',
  },
  {
    numerator: 3,
    denominator: 4,
    label: '3/4 · 四三拍',
    accentPattern: '强-弱-弱',
    description: '圆舞曲的标志性拍号（嘣-嚓-嚓）',
  },
  {
    numerator: 2,
    denominator: 4,
    label: '2/4 · 四二拍',
    accentPattern: '强-弱',
    description: '进行曲、儿歌常用',
  },
  {
    numerator: 3,
    denominator: 8,
    label: '3/8 · 八三拍',
    accentPattern: '强-弱-弱',
    description: '快速的三拍子，常见于舞曲',
  },
  {
    numerator: 6,
    denominator: 8,
    label: '6/8 · 八六拍',
    accentPattern: '强-弱-弱-次强-弱-弱',
    description: '复拍子：每小节六拍，实际按「两拍一组」律动',
  },
]
