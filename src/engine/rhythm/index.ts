import type { TimeSignature } from '../../data/timeSignatures'

/**
 * 节拍引擎：拍号、时值与时长换算。
 * 全部为纯函数，无副作用，可直接单测。
 */

/** 每小节拍数 = 拍号分子 */
export function beatsPerMeasure(ts: TimeSignature): number {
  return ts.numerator
}

/** 一拍（四分音符）时长（秒）。bpm = 每分钟四分音符数 */
export function beatDurationSeconds(bpm: number): number {
  return 60 / bpm
}

/** 若干拍对应的秒数 */
export function beatsToSeconds(beats: number, bpm: number): number {
  return beats * beatDurationSeconds(bpm)
}

/** 分母时值换算为四分音符长度：4/4 → 1；3/8 → 0.5 */
export function beatUnitQuarters(ts: TimeSignature): number {
  return 4 / ts.denominator
}

/** 一小节总时长（秒） */
export function measureDurationSeconds(ts: TimeSignature, bpm: number): number {
  return beatsPerMeasure(ts) * beatDurationSeconds(bpm) * beatUnitQuarters(ts)
}

/* ---------- 强弱拍 ---------- */

export type BeatStrength = 'strong' | 'medium' | 'weak'

const STRENGTH_MAP: Record<string, BeatStrength> = {
  强: 'strong',
  次强: 'medium',
  弱: 'weak',
}

/** 拍号强弱规律（如「强-弱-次强-弱」）→ 每拍强度数组，长度 = 每小节拍数 */
export function beatPattern(ts: TimeSignature): BeatStrength[] {
  return ts.accentPattern.split('-').map((s) => STRENGTH_MAP[s.trim()] ?? 'weak')
}

/** 节拍器每拍间隔（毫秒）。bpm = 每分钟四分音符数 */
export function beatIntervalMs(ts: TimeSignature, bpm: number): number {
  return beatDurationSeconds(bpm) * beatUnitQuarters(ts) * 1000
}

/** 强弱拍提示音 MIDI：强拍高、弱拍低（节拍器专用） */
export function tickMidi(strength: BeatStrength): number {
  switch (strength) {
    case 'strong':
      return 72 // C5
    case 'medium':
      return 67 // G4
    case 'weak':
      return 64 // E4
  }
}
