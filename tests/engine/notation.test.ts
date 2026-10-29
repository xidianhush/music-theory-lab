import { describe, expect, it } from 'vitest'
import { trebleStaffPosition } from '../../src/engine/notation'

describe('notation 引擎（高音谱表位置）', () => {
  it('E4 在第一条线（位置 0）', () => {
    expect(trebleStaffPosition('E4')).toEqual({ position: 0, accidental: null })
  })

  it('G4 在第二条线（位置 2）', () => {
    expect(trebleStaffPosition('G4')).toEqual({ position: 2, accidental: null })
  })

  it('C5 在第三间（位置 5）', () => {
    expect(trebleStaffPosition('C5')).toEqual({ position: 5, accidental: null })
  })

  it('F#4 与 F4 同线位，但带升号', () => {
    expect(trebleStaffPosition('F#4')).toEqual({ position: 1, accidental: '#' })
  })

  it('无法解析的音名抛错', () => {
    expect(() => trebleStaffPosition('H4')).toThrow()
  })
})
