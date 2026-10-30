import type { ScoreMeasure, ScoreNote, ScorePitch, Step } from './types'

/** 乐谱换算：音符 → MIDI / VexFlow 键 / 时值（M4） */

const PITCH_CLASS: Record<Step, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** 音高 → MIDI 编号（C4 = 60）；休止符返回 null */
export function noteToMidi(note: ScoreNote): number | null {
  if (!note.pitch) return null
  return 12 * (note.pitch.octave + 1) + PITCH_CLASS[note.pitch.step] + note.pitch.alter
}

const ACCIDENTAL_VEX: Record<number, string> = {
  0: '',
  1: '#',
  2: '##',
  '-1': 'b',
  '-2': 'bb',
}

/** 音高 → VexFlow 键（C4 → 'c/4'，F#4 → 'f#/4'，Bb4 → 'bb/4'） */
export function vexKeyOf(pitch: ScorePitch): string {
  const acc = ACCIDENTAL_VEX[pitch.alter] ?? ''
  return `${pitch.step.toLowerCase()}${acc}/${pitch.octave}`
}

/**
 * 音符在四分音符单位的时值。
 * 注意：MusicXML 的 <duration> 已包含附点延长量（附点四分音符 = 6/4 = 1.5），
 * 因此 dots 只是记谱呈现，不再参与换算。
 */
export function quarterLength(note: ScoreNote, divisions: number): number {
  return note.duration / divisions
}

/** 一小节时长（秒）。bpm = 每分钟四分音符数 */
export function measureSeconds(measure: ScoreMeasure, bpm: number): number {
  const quartersPerBeat = 4 / measure.beatType
  return (measure.beats * quartersPerBeat * 60) / bpm
}
