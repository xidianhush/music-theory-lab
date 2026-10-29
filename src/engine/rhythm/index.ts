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
