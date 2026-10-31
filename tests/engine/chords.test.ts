import { describe, expect, it } from 'vitest'
import {
  CHORD_INTERVALS,
  chordMidis,
  chordName,
  chordNoteNames,
  qualitySuffix,
  romanOf,
  scaleChords,
} from '../../src/engine/chords'

describe('和弦引擎（模板）', () => {
  it('常见和弦音程模板', () => {
    expect(CHORD_INTERVALS.maj).toEqual([0, 4, 7])
    expect(CHORD_INTERVALS.min).toEqual([0, 3, 7])
    expect(CHORD_INTERVALS.maj7).toEqual([0, 4, 7, 11])
    expect(CHORD_INTERVALS.dom7).toEqual([0, 4, 7, 10])
    expect(CHORD_INTERVALS.halfdim7).toEqual([0, 3, 6, 10])
  })

  it('质量后缀', () => {
    expect(qualitySuffix('maj7')).toBe('maj7')
    expect(qualitySuffix('dom7')).toBe('7')
    expect(qualitySuffix('min7')).toBe('m7')
    expect(qualitySuffix('halfdim7')).toBe('ø7')
    expect(qualitySuffix('min')).toBe('m')
    expect(qualitySuffix('dim')).toBe('°')
  })
})

describe('和弦引擎（C 大调）', () => {
  it('I = C E G，MIDI [60,64,67]', () => {
    expect(chordNoteNames('C', 'major', 1)).toEqual(['C', 'E', 'G'])
    expect(chordMidis('C', 'major', 1)).toEqual([60, 64, 67])
  })

  it('V7 = G7 = G B D F', () => {
    expect(chordName('C', 'major', 5, true)).toBe('G7')
    expect(chordNoteNames('C', 'major', 5, true)).toEqual(['G', 'B', 'D', 'F'])
    expect(chordMidis('C', 'major', 5, true)).toEqual([67, 71, 74, 77])
  })

  it('ii = Dm（小三和弦）', () => {
    expect(chordName('C', 'major', 2)).toBe('Dm')
    expect(chordNoteNames('C', 'major', 2)).toEqual(['D', 'F', 'A'])
  })

  it('vii° = B°（减三和弦，小写罗马数字）', () => {
    expect(romanOf(7, 'major')).toBe('vii°')
    expect(chordName('C', 'major', 7)).toBe('B°')
  })

  it('完整和弦表罗马数字：I ii iii IV V vi vii°', () => {
    const romans = scaleChords('C', 'major').map((c) => c.roman)
    expect(romans).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
  })

  it('七和弦表：Imaj7 iim7 iiim7 IVmaj7 V7 vim7 viiø7', () => {
    const romans = scaleChords('C', 'major', true).map((c) => c.roman)
    expect(romans).toEqual(['Imaj7', 'iim7', 'iiim7', 'IVmaj7', 'V7', 'vim7', 'viiø7'])
  })
})

describe('和弦引擎（♭A 大调）', () => {
  it('I = Ab C Eb，MIDI [68,72,75]', () => {
    expect(chordName('Ab', 'major', 1)).toBe('Ab')
    expect(chordNoteNames('Ab', 'major', 1)).toEqual(['Ab', 'C', 'Eb'])
    expect(chordMidis('Ab', 'major', 1)).toEqual([68, 72, 75])
  })

  it('IV = Db F Ab（拼写 Db 而非 C#）', () => {
    expect(chordNoteNames('Ab', 'major', 4)).toEqual(['Db', 'F', 'Ab'])
  })

  it('IVmaj7 = Dbmaj7', () => {
    expect(chordName('Ab', 'major', 4, true)).toBe('Dbmaj7')
    expect(chordNoteNames('Ab', 'major', 4, true)).toEqual(['Db', 'F', 'Ab', 'C'])
  })

  it('V7 = Eb7 = Eb G Bb Db', () => {
    expect(chordName('Ab', 'major', 5, true)).toBe('Eb7')
    expect(chordNoteNames('Ab', 'major', 5, true)).toEqual(['Eb', 'G', 'Bb', 'Db'])
  })

  it('vi = Fm（♭A 大调 vi 级小三和弦）', () => {
    expect(chordName('Ab', 'major', 6)).toBe('Fm')
  })
})

describe('和弦引擎（自然小调）', () => {
  it('a 小调 i = Am = A C E', () => {
    expect(chordNoteNames('A', 'naturalMinor', 1)).toEqual(['A', 'C', 'E'])
    expect(romanOf(1, 'naturalMinor')).toBe('i')
  })

  it('a 小调罗马数字：i ii° III iv v VI VII（大三和弦大写）', () => {
    const romans = scaleChords('A', 'naturalMinor').map((c) => c.roman)
    expect(romans).toEqual(['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'])
  })

  it('f 自然小调（♭A 大调关系小调）i = Fm = F Ab C', () => {
    expect(chordNoteNames('F', 'naturalMinor', 1)).toEqual(['F', 'Ab', 'C'])
  })
})
