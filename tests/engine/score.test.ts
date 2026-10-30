import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseMusicXml, noteToMidi, vexKeyOf, quarterLength, measureSeconds, keyFromFifths, measureOnsets } from '../../src/engine/score'

const readFixture = (name: string) =>
  readFileSync(join(__dirname, '..', 'fixtures', name), 'utf-8')

const MINIMAL = `<?xml version="1.0"?>
<score-partwise version="4.0.3">
  <part-list><score-part id="P1"><part-name>Test Song</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>-3</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>quarter</type>
        <staff>1</staff>
      </note>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>quarter</type>
        <staff>1</staff>
      </note>
      <note>
        <chord/>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>quarter</type>
        <staff>1</staff>
      </note>
      <note>
        <rest/>
        <duration>4</duration>
        <voice>5</voice>
        <type>quarter</type>
        <staff>2</staff>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch><step>B</step><octave>4</octave><alter>-1</alter></pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>quarter</type>
        <dot/>
        <staff>1</staff>
        <tie type="start"/>
        <notations><tied type="start"/></notations>
      </note>
      <note>
        <pitch><step>B</step><octave>4</octave><alter>-1</alter></pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>quarter</type>
        <staff>1</staff>
        <tie type="stop"/>
        <notations><tied type="stop"/></notations>
      </note>
    </measure>
  </part>
</score-partwise>`

describe('score 引擎（MusicXML 解析）', () => {
  it('合成样例：标题/divisions/谱表/小节数', () => {
    const score = parseMusicXml(MINIMAL)
    expect(score.title).toBe('Test Song')
    expect(score.divisions).toBe(4)
    expect(score.staves).toBe(2)
    expect(score.measures).toHaveLength(2)
  })

  it('首小节调号/拍号读入并向后顺延', () => {
    const score = parseMusicXml(MINIMAL)
    expect(score.measures[0].fifths).toBe(-3)
    expect(score.measures[0].beats).toBe(4)
    expect(score.measures[0].beatType).toBe(4)
    expect(score.measures[1].fifths).toBe(-3)
  })

  it('音符：音高/时值/voice/staff/chord/休止符', () => {
    const score = parseMusicXml(MINIMAL)
    const notes = score.measures[0].notes
    expect(notes).toHaveLength(4)
    expect(notes[0].pitch).toEqual({ step: 'C', octave: 4, alter: 0 })
    expect(notes[0].staff).toBe(1)
    expect(notes[0].chord).toBe(false)
    expect(notes[2].chord).toBe(true)
    expect(notes[3].pitch).toBeNull()
    expect(notes[3].voice).toBe(5)
  })

  it('连音线：tie/tied 两种写法都能识别', () => {
    const score = parseMusicXml(MINIMAL)
    const [m2a, m2b] = score.measures[1].notes
    expect(m2a.tieStart).toBe(true)
    expect(m2a.tieStop).toBe(false)
    expect(m2b.tieStop).toBe(true)
  })

  it('附点与变化音', () => {
    const score = parseMusicXml(MINIMAL)
    const note = score.measures[1].notes[0]
    expect(note.dots).toBe(1)
    expect(note.pitch?.alter).toBe(-1)
    expect(quarterLength(note, 4)).toBeCloseTo(1.5)
  })

  it('真实夹具（luv(sic)pt3 第 1 小节）：divisions/调号/低音和弦', () => {
    const score = parseMusicXml(readFixture('luv-m1.xml'))
    const m1 = score.measures[0]
    expect(score.divisions).toBe(4)
    expect(m1.fifths).toBe(-4) // 忠实输入（真实识别值，校对在数据层修）
    expect(m1.beats).toBe(4)
    const notes = m1.notes
    expect(notes[0].pitch).toEqual({ step: 'F', octave: 2, alter: 0 })
    expect(notes[0].duration).toBe(6)
    expect(notes[0].dots).toBe(1)
    expect(notes[0].staff).toBe(2)
    expect(notes[1].chord).toBe(true)
    expect(notes[1].pitch).toEqual({ step: 'C', octave: 3, alter: 0 })
    expect(notes.length).toBeGreaterThan(2)
  })

  it('真实夹具（连音线小节）：tie 被识别', () => {
    const score = parseMusicXml(readFixture('luv-tie.xml'))
    const tieNotes = score.measures[0].notes.filter((n) => n.tieStart || n.tieStop)
    expect(tieNotes.length).toBeGreaterThan(0)
    expect(tieNotes.some((n) => n.tieStart)).toBe(true)
  })
})

describe('score 引擎（换算）', () => {
  it('noteToMidi：C4=60，B♭4=70', () => {
    expect(noteToMidi({ pitch: { step: 'C', octave: 4, alter: 0 }, duration: 4, type: 'quarter', dots: 0, voice: 1, staff: 1, chord: false, tieStart: false, tieStop: false })).toBe(60)
    expect(noteToMidi({ pitch: { step: 'B', octave: 4, alter: -1 }, duration: 4, type: 'quarter', dots: 0, voice: 1, staff: 1, chord: false, tieStart: false, tieStop: false })).toBe(70)
  })

  it('noteToMidi：休止符返回 null', () => {
    expect(noteToMidi({ pitch: null, duration: 4, type: 'quarter', dots: 0, voice: 1, staff: 1, chord: false, tieStart: false, tieStop: false })).toBeNull()
  })

  it('vexKeyOf：C4 → c/4，F#4 → f#/4，Bb4 → bb/4', () => {
    expect(vexKeyOf({ step: 'C', octave: 4, alter: 0 })).toBe('c/4')
    expect(vexKeyOf({ step: 'F', octave: 4, alter: 1 })).toBe('f#/4')
    expect(vexKeyOf({ step: 'B', octave: 4, alter: -1 })).toBe('bb/4')
  })

  it('measureSeconds：4/4 @120 = 2s，3/8 @120 = 0.75s', () => {
    expect(measureSeconds({ number: 1, fifths: 0, beats: 4, beatType: 4, notes: [] }, 120)).toBeCloseTo(2)
    expect(measureSeconds({ number: 1, fifths: 0, beats: 3, beatType: 8, notes: [] }, 120)).toBeCloseTo(0.75)
  })
})

describe('score 引擎（调号与发音点）', () => {
  it('keyFromFifths：0 → C，-3 → ♭E，-4 → ♭A，3 → A', () => {
    expect(keyFromFifths(0).label).toBe('C 大调')
    expect(keyFromFifths(-3)).toMatchObject({ root: 'Eb', label: '♭E 大调', sharpsFlats: -3 })
    expect(keyFromFifths(-4)).toMatchObject({ root: 'Ab', label: '♭A 大调' })
    expect(keyFromFifths(3)).toMatchObject({ root: 'A', label: 'A 大调' })
  })

  it('measureOnsets：和弦共享发音点，连音延续不重复触发', () => {
    const n = (p: { s: string; o: number; a?: number } | null, extra: Partial<Record<string, unknown>> = {}) => ({
      pitch: p ? { step: p.s as never, octave: p.o, alter: p.a ?? 0 } : null,
      duration: (extra.d as number) ?? 4,
      type: (extra.t as string) ?? 'quarter',
      dots: (extra.dot as number) ?? 0,
      voice: (extra.v as number) ?? 1,
      staff: (extra.st as number) ?? 1,
      chord: (extra.c as boolean) ?? false,
      tieStart: (extra.ts as boolean) ?? false,
      tieStop: (extra.tp as boolean) ?? false,
    })
    const measure = {
      number: 1,
      fifths: -3,
      beats: 4,
      beatType: 4,
      notes: [
        n({ s: 'C', o: 4 }),                      // 0.0 C4
        n({ s: 'E', o: 4 }, { c: true }),         // 0.0 E4（和弦）
        n({ s: 'G', o: 4 }, { c: true }),         // 0.0 G4（和弦）
        n({ s: 'D', o: 4 }, { d: 4 }),            // 1.0 D4
        n({ s: 'D', o: 4 }, { d: 4, tp: true }),  // 2.0 连音延续 D4 → 不触发
      ],
    }
    const onsets = measureOnsets(measure, 4)
    expect(onsets).toEqual([
      { quarterPos: 0, midis: [60, 64, 67] },
      { quarterPos: 1, midis: [62] },
      // 连音延续音（tp）不产生新发音点，时值自然延伸
    ])
  })
})
