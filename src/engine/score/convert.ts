import type { ScoreMeasure, ScoreNote, ScorePitch, Step } from './types'
import type { PieceMeasure, PieceNote } from '../../data/pieces'

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

/* ---------- 调号与发音点 ---------- */

const FLAT_KEYS: Record<number, { root: string; label: string }> = {
  '-1': { root: 'F', label: 'F 大调' },
  '-2': { root: 'Bb', label: '♭B 大调' },
  '-3': { root: 'Eb', label: '♭E 大调' },
  '-4': { root: 'Ab', label: '♭A 大调' },
  '-5': { root: 'Db', label: '♭D 大调' },
  '-6': { root: 'Gb', label: '♭G 大调' },
}

const SHARP_KEYS: Record<number, { root: string; label: string }> = {
  1: { root: 'G', label: 'G 大调' },
  2: { root: 'D', label: 'D 大调' },
  3: { root: 'A', label: 'A 大调' },
  4: { root: 'E', label: 'E 大调' },
  5: { root: 'B', label: 'B 大调' },
  6: { root: 'F#', label: '♯F 大调' },
}

/** 调号（fifths，负数=降号）→ 大调调式标签 */
export function keyFromFifths(fifths: number): { root: string; label: string; sharpsFlats: number } {
  if (fifths === 0) return { root: 'C', label: 'C 大调', sharpsFlats: 0 }
  const hit = (fifths < 0 ? FLAT_KEYS : SHARP_KEYS)[fifths]
  return hit ? { root: hit.root, label: hit.label, sharpsFlats: fifths } : { root: 'C', label: 'C 大调', sharpsFlats: 0 }
}

/** 小节发音点：按时间序的事件（和弦共享一个发音点，连音延续不重新触发） */
export interface MeasureOnset {
  /** 距小节开始的四分音符位置 */
  quarterPos: number
  midis: number[]
}

export function measureOnsets(measure: ScoreMeasure, divisions: number): MeasureOnset[] {
  const onsets: MeasureOnset[] = []
  let pos = 0
  const lastByVoice = new Map<number, number>()
  for (const n of measure.notes) {
    if (n.chord) {
      const cur = onsets[onsets.length - 1]
      const midi = noteToMidi(n)
      if (cur && midi !== null && !cur.midis.includes(midi)) cur.midis.push(midi)
      continue
    }
    const midi = noteToMidi(n)
    if (midi === null) {
      onsets.push({ quarterPos: pos, midis: [] })
    } else if (!(n.tieStop && lastByVoice.get(n.voice) === midi)) {
      onsets.push({ quarterPos: pos, midis: [midi] })
      lastByVoice.set(n.voice, midi)
    }
    pos += n.duration / divisions
  }
  return onsets
}

/* ---------- 曲目数据 → 引擎类型 ---------- */

export function pieceNoteToScoreNote(n: PieceNote): ScoreNote {
  return {
    pitch: n.p ? { step: n.p.s, octave: n.p.o, alter: n.p.a } : null,
    duration: n.d,
    type: n.t,
    dots: n.dot,
    voice: n.v,
    staff: n.st,
    chord: n.c,
    tieStart: n.ts,
    tieStop: n.tp,
  }
}

export function pieceMeasureToScoreMeasure(m: PieceMeasure): ScoreMeasure {
  return {
    number: m.n,
    fifths: m.fifths,
    beats: m.beats,
    beatType: m.beatType,
    notes: m.notes.map(pieceNoteToScoreNote),
  }
}
