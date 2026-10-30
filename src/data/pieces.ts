import type { Step } from '../engine/score/types'

/** 曲目数据（M4）：MusicXML 入库后的乐谱模型（单一数据源） */

export interface PieceNote {
  p: { s: Step; o: number; a: number } | null
  d: number
  t: string
  dot: number
  v: number
  st: number
  c: boolean
  ts: boolean
  tp: boolean
}

export interface PieceMeasure {
  n: number
  fifths: number
  beats: number
  beatType: number
  notes: PieceNote[]
}

export interface PiecePage {
  page: number
  label: string
  fifths: number
  measureStart: number
  measureEnd: number
  note: string
}

export interface Piece {
  id: string
  title: string
  composer: string
  lyricist: string
  arranger: string
  source: string
  bpm: number
  divisions: number
  staves: number
  pages: PiecePage[]
  measures: PieceMeasure[]
}

/** 曲目库元数据（列表页用，不加载全量乐谱） */
export const PIECES_META = [
  {
    id: 'luv-sic-pt3',
    title: 'Luv(sic.)pt3',
    composer: 'Nujabes',
    lyricist: 'Shing02',
    arranger: '化身无（虫虫钢琴）',
    difficulty: '中等偏上',
    pages: 5,
    measures: 80,
    description:
      '全曲 ♭A 大调（4 个降号）：以真实钢琴谱呈现完整 80 小节，密集十六分音符旋律 + 左手和弦伴奏。',
  },
]

const loaders: Record<string, () => Promise<{ default: Piece }>> = {
  // JSON 导入的 step 是 string，经类型断言对齐 Step 联合类型
  'luv-sic-pt3': () =>
    import('./pieces/luv-sic-pt3.json') as unknown as Promise<{ default: Piece }>,
}

/** 动态加载曲目（独立分包，避免拖累首屏） */
export async function loadPiece(id: string): Promise<Piece> {
  const loader = loaders[id]
  if (!loader) throw new Error(`未知曲目：${id}`)
  const mod = await loader()
  return mod.default
}
