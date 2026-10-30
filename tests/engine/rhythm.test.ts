import { describe, expect, it } from 'vitest'
import type { TimeSignature } from '../../src/data/timeSignatures'
import {
  beatsPerMeasure,
  beatDurationSeconds,
  beatUnitQuarters,
  measureDurationSeconds,
  beatPattern,
  beatIntervalMs,
  tickMidi,
  TAP_WINDOW_MS,
  gradeDeviation,
} from '../../src/engine/rhythm'

const ts44: TimeSignature = { numerator: 4, denominator: 4, label: '4/4', accentPattern: '强-弱-次强-弱' }

describe('rhythm 引擎', () => {
  it('每小节拍数 = 拍号分子', () => {
    expect(beatsPerMeasure(ts44)).toBe(4)
  })

  it('bpm=120 时一拍（四分音符）0.5 秒', () => {
    expect(beatDurationSeconds(120)).toBeCloseTo(0.5)
  })

  it('3/8 中分母时值 = 四分音符的 0.5', () => {
    const ts38: TimeSignature = { numerator: 3, denominator: 8, label: '3/8', accentPattern: '强-弱-弱' }
    expect(beatUnitQuarters(ts38)).toBeCloseTo(0.5)
  })

  it('6/8 @120bpm 一小节 1.5 秒', () => {
    const ts68: TimeSignature = {
      numerator: 6,
      denominator: 8,
      label: '6/8',
      accentPattern: '强-弱-弱-次强-弱-弱',
    }
    expect(measureDurationSeconds(ts68, 120)).toBeCloseTo(1.5)
  })

  it('4/4 @100bpm 一小节 2.4 秒', () => {
    expect(measureDurationSeconds(ts44, 100)).toBeCloseTo(2.4)
  })

  it('4/4 强弱规律 → 强 弱 次强 弱', () => {
    expect(beatPattern(ts44)).toEqual(['strong', 'weak', 'medium', 'weak'])
  })

  it('6/8 强弱规律 → 每小节 6 拍，第 4 拍次强', () => {
    const ts68: TimeSignature = {
      numerator: 6,
      denominator: 8,
      label: '6/8',
      accentPattern: '强-弱-弱-次强-弱-弱',
    }
    expect(beatPattern(ts68)).toEqual(['strong', 'weak', 'weak', 'medium', 'weak', 'weak'])
  })

  it('节拍间隔：4/4 @120 = 500ms，6/8 @120 = 250ms', () => {
    expect(beatIntervalMs(ts44, 120)).toBeCloseTo(500)
    const ts68: TimeSignature = {
      numerator: 6,
      denominator: 8,
      label: '6/8',
      accentPattern: '强-弱-弱-次强-弱-弱',
    }
    expect(beatIntervalMs(ts68, 120)).toBeCloseTo(250)
  })

  it('强弱拍提示音：强拍音高 > 次强 > 弱', () => {
    expect(tickMidi('strong')).toBeGreaterThan(tickMidi('medium'))
    expect(tickMidi('medium')).toBeGreaterThan(tickMidi('weak'))
  })
})

describe('rhythm 引擎（节奏跟打）', () => {
  it('判定窗口 150ms', () => {
    expect(TAP_WINDOW_MS).toBe(150)
  })

  it('偏差分档：≤40 优秀，≤90 良好，≤150 及格，>150 脱拍', () => {
    expect(gradeDeviation(0)).toBe('perfect')
    expect(gradeDeviation(40)).toBe('perfect')
    expect(gradeDeviation(41)).toBe('good')
    expect(gradeDeviation(90)).toBe('good')
    expect(gradeDeviation(91)).toBe('ok')
    expect(gradeDeviation(150)).toBe('ok')
    expect(gradeDeviation(151)).toBe('miss')
  })
})
