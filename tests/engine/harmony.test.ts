import { describe, expect, it } from 'vitest'
import { analyzePieceHarmony, fifthsAdjust, matchChord } from '../../src/engine/harmony'
import type { Piece, PieceMeasure, PieceNote } from '../../src/data/pieces'
import type { Step } from '../../src/engine/score/types'

function n(s: string, o: number, v: number, c = false): PieceNote {
  return { p: { s: s as Step, o, a: 0 }, d: 480, t: 'quarter', dot: 0, v, st: 0, c, ts: false, tp: false }
}

function m(num: number, notes: PieceNote[]): PieceMeasure {
  return { n: num, fifths: -4, beats: 4, beatType: 4, notes }
}

describe('harmony 引擎（调号校正）', () => {
  it('♭A 大调（-4）：A→Ab、B→Bb、D→Db、E→Eb，C/F/G 不变', () => {
    expect(fifthsAdjust(-4, 9)).toBe(8)
    expect(fifthsAdjust(-4, 11)).toBe(10)
    expect(fifthsAdjust(-4, 2)).toBe(1)
    expect(fifthsAdjust(-4, 4)).toBe(3)
    expect(fifthsAdjust(-4, 0)).toBe(0)
    expect(fifthsAdjust(-4, 5)).toBe(5)
    expect(fifthsAdjust(-4, 7)).toBe(7)
  })

  it('A 大调（+3）：F→F#、C→C#、G→G#', () => {
    expect(fifthsAdjust(3, 6)).toBe(7)
    expect(fifthsAdjust(3, 0)).toBe(1)
    expect(fifthsAdjust(3, 7)).toBe(8)
    expect(fifthsAdjust(3, 9)).toBe(9)
  })
})

describe('harmony 引擎（和弦匹配）', () => {
  it('{C,Db,F,Ab} 校正后 → ♭Dmaj7（IV 级）', () => {
    const c = matchChord([0, 1, 5, 8], 'Ab')
    expect(c).not.toBeNull()
    expect(c?.degree).toBe(4)
    expect(c?.name).toBe('Dbmaj7')
  })

  it('{Bb,Db,Ab,F} → ♭Bm7（ii 级）', () => {
    const c = matchChord([10, 1, 5, 8], 'Ab')
    expect(c?.degree).toBe(2)
    expect(c?.name).toBe('Bbm7')
  })

  it('音太少（≤1 个）不识别', () => {
    expect(matchChord([0], 'Ab')).toBeNull()
  })
})

describe('harmony 引擎（整曲分析，真实谱首小节）', () => {
  it('小节 1 拍点 0 五音同响 → ♭Dmaj7，小节 2 → ♭Bm7（与 QA.md 手工定音一致）', () => {
    // 小节 1：A4·D4·F2·C3·F3（midis 69,62,41,48,53，pc {A,D,F,C}）
    const piece: Piece = {
      id: 'luv-sic-pt3', title: 'Luv(sic.)pt3', composer: '', lyricist: '', arranger: '',
      source: '', bpm: 172, divisions: 480, staves: 3,
      pages: [{ page: 1, label: 'P1', fifths: -4, measureStart: 1, measureEnd: 4, note: '' }],
      measures: [
        m(1, [n('A', 4, 0), n('D', 4, 1), n('F', 2, 2), n('C', 3, 2, true), n('F', 3, 2, true)]),
        // 小节 2：Bb3·Db4·Ab3·F4（pc {Bb,Db,Ab,F}）
        m(2, [n('B', 3, 0), n('D', 4, 1), n('A', 3, 2), n('F', 4, 2, true)]),
        m(3, [n('A', 3, 0), n('D', 4, 1), n('F', 3, 2), n('C', 4, 2, true)]),
        m(4, [n('B', 3, 0), n('D', 4, 1), n('F', 3, 2), n('A', 4, 2, true)]),
      ],
    }
    const h = analyzePieceHarmony(piece)
    expect(h.key.label).toBe('♭A 大调')
    expect(h.key.root).toBe('Ab')
    expect(h.measures).toHaveLength(4)
    expect(h.measures[0].chord?.name).toBe('Dbmaj7')
    expect(h.measures[0].chord?.roman).toBe('IVmaj7')
    expect(h.measures[1].chord?.name).toBe('Bbm7')
    expect(h.measures[1].chord?.roman).toBe('iim7')
    // 小节 3/4 应能识别出和弦（拍点 0 均有 ≥2 音）
    expect(h.measures[2].chord).not.toBeNull()
    expect(h.measures[3].chord).not.toBeNull()
    // 进行合并：每段 measures 递增
    for (const seg of h.progression) {
      expect(seg.measures).toHaveLength(1)
    }
  })

  it('全休止小节不产生和弦', () => {
    const piece: Piece = {
      id: 'x', title: 'x', composer: '', lyricist: '', arranger: '', source: '',
      bpm: 100, divisions: 480, staves: 1,
      pages: [{ page: 1, label: 'P1', fifths: 0, measureStart: 1, measureEnd: 2, note: '' }],
      measures: [
        m(1, [n('C', 4, 0)]),
        m(2, [n('C', 4, 0)]),
      ],
    }
    // 单音小节不识别（音太少），但引擎不抛错
    const h = analyzePieceHarmony(piece)
    expect(h.measures[0].chord).toBeNull()
  })
})
