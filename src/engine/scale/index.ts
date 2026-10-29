import type { PitchClass } from '../../data/notes'
import { PITCH_CLASS_INDEX, pitchClassOfKeyName } from '../../data/notes'

export type ScaleQuality = 'major' | 'naturalMinor'

/** 大调音阶：全 全 半 全 全 全 半 */
export const MAJOR_STEPS = [2, 2, 1, 2, 2, 2, 1] as const
/** 自然小调音阶：全 半 全 全 半 全 全 */
export const NATURAL_MINOR_STEPS = [2, 1, 2, 2, 1, 2, 2] as const

export function scaleSteps(quality: ScaleQuality): readonly number[] {
  return quality === 'major' ? MAJOR_STEPS : NATURAL_MINOR_STEPS
}

/** 主音音级编号 → 八个音级编号（0-11，首尾同音） */
export function scalePitchClasses(rootPitchClass: number, quality: ScaleQuality): number[] {
  const pcs: number[] = []
  let current = ((rootPitchClass % 12) + 12) % 12
  pcs.push(current)
  for (const step of scaleSteps(quality)) {
    current = (current + step) % 12
    pcs.push(current)
  }
  return pcs
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

/**
 * 调式音名拼写：按调号规则，每个音级字母恰好出现一次，
 * 升降号随调号确定（如 ♭B 大调写作 Bb C D Eb F G A，而不是 A#…）。
 */
export function scaleNoteNames(root: string, quality: ScaleQuality): string[] {
  const rootLetter = root.replace(/[#b]$/, '')
  const startIndex = LETTERS.indexOf(rootLetter as (typeof LETTERS)[number])
  if (startIndex === -1) throw new Error(`无法解析调名: ${root}`)
  const letters = [...LETTERS.slice(startIndex), ...LETTERS.slice(0, startIndex)]
  const pcs = scalePitchClasses(pitchClassOfKeyName(root), quality)
  // 只取 7 个音级；八度重复主音由 scalePitchClasses 保留（首尾同音）
  return pcs.slice(0, 7).map((pc, i) => {
    const letter = letters[i]
    const natural = PITCH_CLASS_INDEX[letter as PitchClass]
    const diff = ((pc - natural + 12) % 12 + 12) % 12
    if (diff === 1) return `${letter}#`
    if (diff === 11) return `${letter}b`
    return letter
  })
}
