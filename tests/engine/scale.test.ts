import { describe, expect, it } from 'vitest'
import {
  MAJOR_STEPS,
  NATURAL_MINOR_STEPS,
  scaleNoteNames,
  scalePitchClasses,
} from '../../src/engine/scale'

describe('scale 引擎', () => {
  it('大调音阶 = 全全半全全全半', () => {
    expect([...MAJOR_STEPS]).toEqual([2, 2, 1, 2, 2, 2, 1])
  })

  it('自然小调音阶 = 全半全全半全全', () => {
    expect([...NATURAL_MINOR_STEPS]).toEqual([2, 1, 2, 2, 1, 2, 2])
  })

  it('C 大调：无升降号', () => {
    expect(scaleNoteNames('C', 'major')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  })

  it('A 大调：三个升号 F# C# G#', () => {
    expect(scaleNoteNames('A', 'major')).toEqual(['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'])
  })

  it('♭B 大调：两个降号，拼写为 Bb Eb 而非 A# D#', () => {
    expect(scaleNoteNames('Bb', 'major')).toEqual(['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'])
  })

  it('a 自然小调 = C 大调的关系小调（无升降号）', () => {
    expect(scaleNoteNames('A', 'naturalMinor')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
  })

  it('音级编号首尾同音、共 8 个', () => {
    const pcs = scalePitchClasses(9, 'major')
    expect(pcs).toHaveLength(8)
    expect(pcs[0]).toBe(pcs[7])
  })

  it('无法解析的调名抛错', () => {
    expect(() => scaleNoteNames('H', 'major')).toThrow()
  })
})
