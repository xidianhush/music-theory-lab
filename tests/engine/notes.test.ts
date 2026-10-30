import { describe, expect, it } from 'vitest'
import { cMajorScaleOneOctave, noteByName, naturalNotes } from '../../src/data/notes'

describe('notes 数据（音名解析）', () => {
  it('C4 = MIDI 60（中央 C）', () => {
    expect(noteByName('C4')).toEqual({ name: 'C4', pitchClass: 0, midi: 60 })
  })

  it('F#4 = MIDI 66', () => {
    expect(noteByName('F#4')).toEqual({ name: 'F#4', pitchClass: 6, midi: 66 })
  })

  it('Bb4 = MIDI 70', () => {
    expect(noteByName('Bb4')).toEqual({ name: 'Bb4', pitchClass: 10, midi: 70 })
  })

  it('C5 = MIDI 72', () => {
    expect(noteByName('C5')).toEqual({ name: 'C5', pitchClass: 0, midi: 72 })
  })

  it('无法解析的音名抛错', () => {
    expect(() => noteByName('H4')).toThrow()
  })
})

describe('notes 数据（C 大调音阶）', () => {
  it('自然音 7 个：C4..B4', () => {
    expect(naturalNotes(4).map((n) => n.name)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'])
  })

  it('C 大调一个八度 = 8 个音，末音 C5', () => {
    const scale = cMajorScaleOneOctave(4)
    expect(scale).toHaveLength(8)
    expect(scale[7]).toEqual({ name: 'C5', pitchClass: 0, midi: 72 })
  })

  it('音名连续排列：音级 [0,2,4,5,7,9,11,0]', () => {
    expect(cMajorScaleOneOctave(4).map((n) => n.pitchClass)).toEqual([0, 2, 4, 5, 7, 9, 11, 0])
  })
})
