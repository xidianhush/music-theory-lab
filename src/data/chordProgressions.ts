import type { ScaleQuality } from '../engine/scale'

/** 内置常用和弦进行（按调式类型分组；degrees 为级数 1-7，seventh=true 时按七和弦理解） */
export interface ProgressionDef {
  id: string
  name: string
  description: string
  degrees: number[]
  /** 是否按七和弦呈现（爵士/终止式常用） */
  seventh?: boolean
}

export interface ProgressionGroup {
  quality: ScaleQuality
  label: string
  progressions: ProgressionDef[]
}

export const PROGRESSIONS: ProgressionGroup[] = [
  {
    quality: 'major',
    label: '大调常用和弦进行',
    progressions: [
      { id: 'pop', name: 'I–V–vi–IV', description: '流行万能进行：明亮、稳定，无数金曲骨架', degrees: [1, 5, 6, 4] },
      { id: 'doowop', name: 'I–vi–IV–V', description: '50s 经典：Doo-wop 标配，温暖复古', degrees: [1, 6, 4, 5] },
      { id: 'jazz251', name: 'ii–V–I', description: '爵士最核心终止式：所有即兴的起点', degrees: [2, 5, 1], seventh: true },
      { id: 'classic', name: 'I–IV–V–I', description: '古典与民谣基础：完满终止', degrees: [1, 4, 5, 1] },
      { id: 'canon', name: 'I–V–vi–iii–IV–I–IV–V', description: '卡农进行：巴洛克源头，和弦如阶梯般下行', degrees: [1, 5, 6, 3, 4, 1, 4, 5] },
      { id: 'sad', name: 'vi–IV–I–V', description: '伤感流行：起手即小调色彩', degrees: [6, 4, 1, 5] },
      { id: 'jazzprog', name: 'I–vi–ii–V', description: '爵士色彩：rhythm changes 片段', degrees: [1, 6, 2, 5], seventh: true },
    ],
  },
  {
    quality: 'naturalMinor',
    label: '自然小调常用和弦进行',
    progressions: [
      { id: 'minbase', name: 'i–iv–v', description: '小调基础：忧郁而确定', degrees: [1, 4, 5] },
      { id: 'minpop', name: 'i–VI–III–VII', description: '小调流行：和声大调色彩亮点', degrees: [1, 6, 3, 7] },
      { id: 'mindown', name: 'i–VII–VI–V', description: '下行四音：力量感与叙事感', degrees: [1, 7, 6, 5] },
      { id: 'miniv', name: 'i–iv–VI–v', description: '小调抒情：iv 与 VI 交替', degrees: [1, 4, 6, 5] },
      { id: 'minjazz', name: 'ii°–V–i', description: '小调爵士终止：导音张力拉满', degrees: [2, 5, 1], seventh: true },
      { id: 'minIII', name: 'i–III–iv–v', description: '借用关系大调：色彩对比', degrees: [1, 3, 4, 5] },
    ],
  },
]
