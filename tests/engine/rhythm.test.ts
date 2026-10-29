import { describe, expect, it } from 'vitest'
import type { TimeSignature } from '../../src/data/timeSignatures'
import {
  beatsPerMeasure,
  beatDurationSeconds,
  beatUnitQuarters,
  measureDurationSeconds,
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
})
