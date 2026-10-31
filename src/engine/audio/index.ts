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

  /** 已创建且未结束的发声源（oscillator），stopAll 时统一静音 */
  private activeOscs = new Set<OscillatorNode>()
  private oscGains = new Map<OscillatorNode, GainNode>()

  /** 登记发声源：播放结束（onended）自动移除；stopAll 可随时中断 */
  private trackSource(osc: OscillatorNode, gain: GainNode): void {
    this.activeOscs.add(osc)
    this.oscGains.set(osc, gain)
    osc.onended = () => {
      this.activeOscs.delete(osc)
      this.oscGains.delete(osc)
      try { osc.disconnect() } catch { /* 已断开则忽略 */ }
      try { gain.disconnect() } catch { /* 已断开则忽略 */ }
    }
  }

  /**
   * 立即静音所有已排定/进行中的声音（含未来时间点的音符调度）。
   * WebAudio 的 osc.start(when) 一旦排入时间轴，clearTimeout 无法取消，
   * 必须对 source 逐个 stop() 并断开，否则"停止"后音符仍会按时响起。
   */
  stopAll(): void {
    for (const osc of [...this.activeOscs]) {
      try { osc.stop() } catch { /* 已结束/已停止则忽略 */ }
      try { osc.disconnect() } catch { /* 已断开则忽略 */ }
      const gain = this.oscGains.get(osc)
      try { gain?.disconnect() } catch { /* 已断开则忽略 */ }
    }
    this.activeOscs.clear()
    this.oscGains.clear()
  }

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
    this.trackSource(osc, gain)
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
    this.trackSource(osc, gain)
    osc.start(now)
    osc.stop(now + duration + 0.05)
  }

  /** 播放一个 MIDI 音符 */
  playMidi(midi: number, duration?: number): void {
    this.playFrequency(AudioEngine.midiToFrequency(midi), duration)
  }

  /** 在指定时间播放一段持续音（曲目播放用；triangle 比节拍器的 square 更接近乐器音色） */
  scheduleTone(freq: number, when: number, duration = 0.3, volume = 0.14): void {
    const ctx = this.ensureContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    this.trackSource(osc, gain)
    osc.start(when)
    osc.stop(when + duration + 0.05)
  }

  /**
   * 按相对延迟播放（曲目跟弹/连续播放用）。
   * 在调用时刻采样 ctx.currentTime 作为基准，与 UI setTimeout 高亮使用同一时间原点，
   * 避免 AudioContext 从 suspended 恢复时 currentTime 冻结导致的声音整体提前/高亮滞后。
   */
  scheduleToneDelay(freq: number, delay: number, duration = 0.3, volume = 0.14): void {
    const ctx = this.ensureContext()
    if (!ctx) return
    const when = ctx.currentTime + delay
    this.scheduleTone(freq, when, duration, volume)
  }
}

/** 全局单例：全站共用同一个 AudioContext */
export const audioEngine = new AudioEngine()
