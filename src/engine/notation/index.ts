/** 音名 → 高音谱表上的线/间位置（五线谱阅读基础） */

export interface StaffPosition {
  /** 线间单位：0 = 下加一线（高音谱 E4）；偶数 = 线，奇数 = 间 */
  position: number
  accidental: '#' | 'b' | null
}

const LETTER_INDEX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }

/**
 * 音名（如 'E4'、'F#5'）→ 高音谱表位置。
 * 规则：E4 在第一条线（位置 0），往上每级字母名 +1；
 * 临时记号（#/b）不影响线位。
 */
export function trebleStaffPosition(name: string): StaffPosition {
  const match = name.match(/^([A-G])([#b]?)(-?\d+)$/)
  if (!match) throw new Error(`无法解析音名: ${name}`)
  const [, letter, accidental, octaveStr] = match
  const octave = Number(octaveStr)
  const position = 7 * (octave - 4) + LETTER_INDEX[letter] - 2
  return { position, accidental: (accidental as '#' | 'b') || null }
}

/**
 * 音名 → VexFlow 键格式（小写字母 + 临时记号 + /八度）：
 * 'C4' → 'c/4'，'F#4' → 'f#/4'，'Bb4' → 'bb/4'
 */
export function toVexKey(name: string): string {
  const match = name.match(/^([A-G])([#b]?)(-?\d+)$/)
  if (!match) throw new Error(`无法解析音名: ${name}`)
  return `${match[1].toLowerCase()}${match[2]}/${match[3]}`
}
