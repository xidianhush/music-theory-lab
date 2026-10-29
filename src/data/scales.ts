export type ScaleQuality = 'major' | 'naturalMinor'

export interface ScaleDef {
  /** 主音调名，如 'C'、'A'、'Bb' */
  key: string
  quality: ScaleQuality
  label: string
  /** 调号升降号数量：正 = 升号数，负 = 降号数，0 = 无 */
  sharpsFlats: number
  description?: string
}

export const SCALES: ScaleDef[] = [
  { key: 'C', quality: 'major', label: 'C 大调', sharpsFlats: 0, description: '无升降号，学调号的第一站' },
  { key: 'G', quality: 'major', label: 'G 大调', sharpsFlats: 1, description: '一个升号（F#）' },
  { key: 'D', quality: 'major', label: 'D 大调', sharpsFlats: 2, description: '两个升号（F#、C#）' },
  { key: 'A', quality: 'major', label: 'A 大调', sharpsFlats: 3, description: '三个升号（F#、C#、G#）' },
  { key: 'F', quality: 'major', label: 'F 大调', sharpsFlats: -1, description: '一个降号（Bb）' },
  { key: 'Bb', quality: 'major', label: '♭B 大调', sharpsFlats: -2, description: '两个降号（Bb、Eb）' },
  { key: 'A', quality: 'naturalMinor', label: 'a 自然小调', sharpsFlats: 0, description: 'C 大调的关系小调' },
  { key: 'E', quality: 'naturalMinor', label: 'e 自然小调', sharpsFlats: 1, description: 'G 大调的关系小调' },
]
