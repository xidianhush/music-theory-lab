/**
 * AudioEngine：统一封装 Web Audio API。
 * 浏览器约束：AudioContext 必须由用户手势触发后才能启动，
 * 因此所有发声方法都应由点击 / 键盘事件调用。
 */

type AudioCtor = typeof AudioContext

function getAudioContextClass(): AudioCtor | null {
  if (typeof window === 'undefined') return null
  if (window.AudioContext) return window.AudioContext
  const webkit = (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
  return webkit ?? null
}

export class AudioEngine {
  private ctx: AudioContext | null = null

  private ensureContext(): AudioContext | null {
    const Ctor = getAudioContextClass()
    if (!Ctor) return null
    if (!this.ctx) this.ctx = new Ctor()
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  /** MIDI 编号 → 频率（A4 = 440Hz） */
  static midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12)
  }

  /** 当前 AudioContext 时间（秒）；不可用时返回 null */
  getCurrentTime(): number | null {
    return this.ensureContext()?.currentTime ?? null
  }

  /** 在指定时间（秒）精确播放一个短促节拍音（节拍器调度用） */
  scheduleFrequency(freq: number, when: number, duration = 0.05, volume = 0.1): void {
    const ctx = this.ensureContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(when)
    osc.stop(when + duration + 0.02)
  }

  /** 播放一个频率（duration 秒） */
  playFrequency(freq: number, duration = 0.35, volume = 0.12): void {
    const ctx = this.ensureContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration + 0.05)
  }

  /** 播放一个 MIDI 音符 */
  playMidi(midi: number, duration?: number): void {
    this.playFrequency(AudioEngine.midiToFrequency(midi), duration)
  }
}

/** 全局单例：全站共用同一个 AudioContext */
export const audioEngine = new AudioEngine()
