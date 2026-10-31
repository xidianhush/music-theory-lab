import { describe, expect, it } from 'vitest'
import {
  MAJOR_STEPS,
  NATURAL_MINOR_STEPS,
  scaleNoteNames,
  scalePitchClasses,
  scaleMidi,
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

  it('♭A 大调：四个降号 Bb Eb Ab Db', () => {
    expect(scaleNoteNames('Ab', 'major')).toEqual(['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'])
  })

  it('♭D 大调：五个降号，拼写为 Db Eb 而非 C# D#', () => {
    expect(scaleNoteNames('Db', 'major')).toEqual(['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'])
  })

  it('♯F 大调：六个升号，含 E#', () => {
    expect(scaleNoteNames('F#', 'major')).toEqual(['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'])
  })

  it('f 自然小调 = ♭A 大调的关系小调（四个降号）', () => {
    expect(scaleNoteNames('F', 'naturalMinor')).toEqual(['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'])
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

describe('scale 引擎（MIDI 序列）', () => {
  it('C 大调从 C4 起：[60,62,64,65,67,69,71,72]', () => {
    expect(scaleMidi('C', 'major', 4)).toEqual([60, 62, 64, 65, 67, 69, 71, 72])
  })

  it('A 大调从 A4 起：[69,71,73,74,76,78,80,81]', () => {
    expect(scaleMidi('A', 'major', 4)).toEqual([69, 71, 73, 74, 76, 78, 80, 81])
  })

  it('♭B 大调从 Bb4 起：[70,72,74,75,77,79,81,82]', () => {
    expect(scaleMidi('Bb', 'major', 4)).toEqual([70, 72, 74, 75, 77, 79, 81, 82])
  })

  it('e 自然小调从 E4 起', () => {
    expect(scaleMidi('E', 'naturalMinor', 4)).toEqual([64, 66, 67, 69, 71, 72, 74, 76])
  })

  it('共 8 个音且首尾相差一个八度', () => {
    const midis = scaleMidi('A', 'major', 4)
    expect(midis).toHaveLength(8)
    expect(midis[7] - midis[0]).toBe(12)
  })
})
