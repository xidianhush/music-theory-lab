/** 自然音名（不含临时记号） */
export type PitchClass = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

export interface Note {
  /** 音名，如 C4、F#4、Bb4 */
  name: string
  /** 音级序号 0-11（C=0，半音制） */
  pitchClass: number
  /** MIDI 编号，中央 C 为 60 */
  midi: number
}

/** 自然音名的音级序号（C=0, D=2, E=4, F=5, G=7, A=9, B=11） */
export const PITCH_CLASS_INDEX: Record<PitchClass, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const CHROMATIC_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/** 音级编号 → 升号拼写（仅调试用；调式拼写请用 scale 引擎） */
export function pitchClassName(pitchClass: number): string {
  const pc = ((pitchClass % 12) + 12) % 12
  return CHROMATIC_NAMES[pc]
}

/** 调名（如 'C'、'A'、'Bb'）→ 音级编号 0-11 */
export function pitchClassOfKeyName(key: string): number {
  const match = key.match(/^([A-G])([#b]?)$/)
  if (!match) throw new Error(`无法解析调名: ${key}`)
  const base = PITCH_CLASS_INDEX[match[1] as PitchClass]
  if (match[2] === '#') return (base + 1) % 12
  if (match[2] === 'b') return (base + 11) % 12
  return base
}

const NATURAL_MIDI_OFFSET: Record<PitchClass, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

/** 生成某个八度的自然音（供钢琴 / 音阶演示使用） */
export function naturalNotes(octave = 4): Note[] {
  return (Object.keys(PITCH_CLASS_INDEX) as PitchClass[]).map((letter) => ({
    name: `${letter}${octave}`,
    pitchClass: PITCH_CLASS_INDEX[letter],
    midi: 60 + (octave - 4) * 12 + NATURAL_MIDI_OFFSET[letter],
  }))
}
