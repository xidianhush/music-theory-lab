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

/** 常用调式全集：12 个大调 + 12 个关系自然小调（五度圈） */
export const SCALES: ScaleDef[] = [
  // ---- 大调（升号侧）----
  { key: 'C', quality: 'major', label: 'C 大调', sharpsFlats: 0, description: '无升降号，学调号的第一站' },
  { key: 'G', quality: 'major', label: 'G 大调', sharpsFlats: 1, description: '1 个升号（F♯）' },
  { key: 'D', quality: 'major', label: 'D 大调', sharpsFlats: 2, description: '2 个升号（F♯、C♯）' },
  { key: 'A', quality: 'major', label: 'A 大调', sharpsFlats: 3, description: '3 个升号（F♯、C♯、G♯）' },
  { key: 'E', quality: 'major', label: 'E 大调', sharpsFlats: 4, description: '4 个升号（F♯、C♯、G♯、D♯）' },
  { key: 'B', quality: 'major', label: 'B 大调', sharpsFlats: 5, description: '5 个升号（F♯、C♯、G♯、D♯、A♯）' },
  { key: 'F#', quality: 'major', label: '♯F 大调', sharpsFlats: 6, description: '6 个升号（F♯、C♯、G♯、D♯、A♯、E♯）' },
  // ---- 大调（降号侧）----
  { key: 'F', quality: 'major', label: 'F 大调', sharpsFlats: -1, description: '1 个降号（B♭）' },
  { key: 'Bb', quality: 'major', label: '♭B 大调', sharpsFlats: -2, description: '2 个降号（B♭、E♭）' },
  { key: 'Eb', quality: 'major', label: '♭E 大调', sharpsFlats: -3, description: '3 个降号（B♭、E♭、A♭）' },
  { key: 'Ab', quality: 'major', label: '♭A 大调', sharpsFlats: -4, description: '4 个降号（B♭、E♭、A♭、D♭），Luv(sic.)pt3 全曲调式' },
  { key: 'Db', quality: 'major', label: '♭D 大调', sharpsFlats: -5, description: '5 个降号（B♭、E♭、A♭、D♭、G♭）' },
  { key: 'Gb', quality: 'major', label: '♭G 大调', sharpsFlats: -6, description: '6 个降号（B♭、E♭、A♭、D♭、G♭、C♭）' },
  // ---- 自然小调（关系小调）----
  { key: 'A', quality: 'naturalMinor', label: 'a 自然小调', sharpsFlats: 0, description: 'C 大调的关系小调' },
  { key: 'E', quality: 'naturalMinor', label: 'e 自然小调', sharpsFlats: 1, description: 'G 大调的关系小调' },
  { key: 'B', quality: 'naturalMinor', label: 'b 自然小调', sharpsFlats: 2, description: 'D 大调的关系小调' },
  { key: 'F#', quality: 'naturalMinor', label: '♯f 自然小调', sharpsFlats: 3, description: 'A 大调的关系小调' },
  { key: 'C#', quality: 'naturalMinor', label: '♯c 自然小调', sharpsFlats: 4, description: 'E 大调的关系小调' },
  { key: 'G#', quality: 'naturalMinor', label: '♯g 自然小调', sharpsFlats: 5, description: 'B 大调的关系小调' },
  { key: 'D', quality: 'naturalMinor', label: 'd 自然小调', sharpsFlats: -1, description: 'F 大调的关系小调' },
  { key: 'G', quality: 'naturalMinor', label: 'g 自然小调', sharpsFlats: -2, description: '♭B 大调的关系小调' },
  { key: 'C', quality: 'naturalMinor', label: 'c 自然小调', sharpsFlats: -3, description: '♭E 大调的关系小调' },
  { key: 'F', quality: 'naturalMinor', label: 'f 自然小调', sharpsFlats: -4, description: '♭A 大调的关系小调' },
  { key: 'Bb', quality: 'naturalMinor', label: '♭b 自然小调', sharpsFlats: -5, description: '♭D 大调的关系小调' },
  { key: 'Eb', quality: 'naturalMinor', label: '♭e 自然小调', sharpsFlats: -6, description: '♭G 大调的关系小调' },
]
