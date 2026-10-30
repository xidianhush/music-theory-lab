import { XMLParser } from 'fast-xml-parser'
import type { Score, ScoreMeasure, ScoreNote, ScorePitch, Step } from './types'

/**
 * 乐谱引擎（M4）：MusicXML → 乐谱模型。
 * 纯函数，无副作用；解析与换算全部可单测。
 */

export {
  noteToMidi,
  vexKeyOf,
  quarterLength,
  measureSeconds,
  keyFromFifths,
  measureOnsets,
  pieceNoteToScoreNote,
  pieceMeasureToScoreMeasure,
} from './convert'
export type { MeasureOnset } from './convert'
export type { Score, ScoreMeasure, ScoreNote, ScorePitch, Step } from './types'

const STEP_SET: Record<string, Step> = {
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
  A: 'A',
  B: 'B',
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return []
  return Array.isArray(v) ? v : [v]
}

/** fast-xml-parser：纯文本节点给 string/number，带属性节点给 { '#text': …, '@_k': … } */
function textOf(node: unknown): string {
  if (node === undefined || node === null) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  const t = (node as Record<string, unknown>)['#text']
  return t === undefined ? '' : String(t)
}

function attrType(node: unknown, key = '@_type'): string {
  if (node === undefined || node === null) return ''
  if (typeof node === 'string') return node
  return String((node as Record<string, unknown>)[key] ?? '')
}

function parseNote(n: Record<string, unknown>): ScoreNote {
  const pitchNode = n.pitch as Record<string, unknown> | undefined
  const pitch: ScorePitch | null = pitchNode
    ? {
        step: STEP_SET[textOf(pitchNode.step)] ?? 'C',
        octave: Number(pitchNode.octave ?? 4),
        alter: Number(pitchNode.alter ?? 0),
      }
    : null

  // 连音线：<tie type="start"/> 与 <notations><tied type="start"/> 两种写法都收
  const tieTypes: string[] = []
  for (const t of asArray(n.tie as unknown)) tieTypes.push(attrType(t))
  for (const notation of asArray(n.notations as unknown)) {
    for (const t of asArray((notation as Record<string, unknown>).tied as unknown)) {
      tieTypes.push(attrType(t))
    }
  }

  return {
    pitch,
    duration: Number(n.duration ?? 0),
    type: textOf(n.type),
    dots: asArray(n.dot as unknown).length,
    voice: Number(n.voice ?? 1),
    staff: Number(n.staff ?? 1),
    chord: n.chord !== undefined,
    tieStart: tieTypes.includes('start'),
    tieStop: tieTypes.includes('stop'),
  }
}

function parseMeasure(
  m: Record<string, unknown>,
  prev: { fifths: number; beats: number; beatType: number },
): ScoreMeasure {
  const attrs = m.attributes as Record<string, unknown> | undefined
  const key = asArray(attrs?.key as unknown)[0] as Record<string, unknown> | undefined
  const time = asArray(attrs?.time as unknown)[0] as Record<string, unknown> | undefined

  return {
    number: Number(m.number ?? 1),
    fifths: key && key.fifths !== undefined ? Number(textOf(key.fifths)) : prev.fifths,
    beats: time && time.beats !== undefined ? Number(textOf(time.beats)) : prev.beats,
    beatType: time && time['beat-type'] !== undefined ? Number(textOf(time['beat-type'])) : prev.beatType,
    notes: asArray(m.note as unknown).map((n) => parseNote(n as Record<string, unknown>)),
  }
}

/**
 * 解析 MusicXML（score-partwise）为乐谱模型。
 * 调号/拍号按「首小节 attributes + 后续变更」顺延；解析结果忠实于输入，
 * 识别误差（如调号）由入库校对环节在数据层修正。
 */
export function parseMusicXml(xml: string): Score {
  const parser = new XMLParser({ ignoreAttributes: false })
  const root = parser.parse(xml) as Record<string, unknown>
  const partwise = (root['score-partwise'] ?? root) as Record<string, unknown>
  const partList = (partwise['part-list'] ?? {}) as Record<string, unknown>
  const partNode = asArray(partwise.part as unknown)[0] as Record<string, unknown> | undefined
  const partNameNode = asArray(partList['score-part'] as unknown)[0] as Record<string, unknown> | undefined

  if (!partNode) throw new Error('MusicXML 缺少 <part>')

  const firstMeasure = asArray(partNode.measure as unknown)[0] as Record<string, unknown> | undefined
  const firstAttrs = (firstMeasure?.attributes ?? {}) as Record<string, unknown>
  const divisions = firstAttrs.divisions !== undefined ? Number(textOf(firstAttrs.divisions)) : 4
  const staves = Number(textOf(firstAttrs.staves)) || 2

  let state = { fifths: 0, beats: 4, beatType: 4 }
  const measures: ScoreMeasure[] = []
  for (const raw of asArray(partNode.measure as unknown)) {
    const measure = parseMeasure(raw as Record<string, unknown>, state)
    state = { fifths: measure.fifths, beats: measure.beats, beatType: measure.beatType }
    measures.push(measure)
  }

  return {
    title: textOf((partNameNode as Record<string, unknown> | undefined)?.['part-name'] ?? '未命名曲目'),
    divisions,
    staves,
    measures,
  }
}
