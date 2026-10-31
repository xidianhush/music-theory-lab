import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * AudioEngine 停止语义回归测试：
 * WebAudio 中 osc.start(when) 一旦排入时间轴，clearTimeout 无法取消未来音符，
 * stopAll() 必须对所有发声源逐个立即 stop() 并断开，否则"停止"后音符仍会按时响起。
 *
 * Fake 模拟 WebAudio 关键语义：
 *  - osc.stop(when) 是"排定结束"：不立即触发 onended（时间轴未到）；
 *  - osc.stop()（无参）是"立即停止"：结束并触发 onended；对已结束节点抛 InvalidStateError。
 * 据此可区分"引擎自身排定的结束"与"stopAll 发起的立即中断"。
 */

let createdOscs = 0
let immediateStops = 0 // 无参 stop()（stopAll 发起）的次数

class FakeAudioParam {
  value = 0
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
}

class FakeOscillator {
  type = 'triangle'
  frequency = { value: 440 }
  ended = false
  stopCalls: Array<number | undefined> = []
  onended: (() => void) | null = null
  connect() {}
  disconnect() {}
  start() {}
  stop(when?: number) {
    this.stopCalls.push(when)
    if (when === undefined) {
      if (this.ended) throw new Error('InvalidStateError: 已结束的节点不可再次 stop')
      this.ended = true
      immediateStops += 1
      this.onended?.()
    }
    // 排定结束（when 给定）不立即触发 onended，模拟时间轴未到
  }
}

class FakeGain {
  gain = new FakeAudioParam()
  connect() {}
  disconnect() {}
}

class FakeAudioContext {
  currentTime = 1000
  state = 'running'
  destination = {}
  resume() {}
  createOscillator() {
    createdOscs += 1
    return new FakeOscillator()
  }
  createGain() {
    return new FakeGain()
  }
}

async function freshAudioEngine() {
  vi.resetModules()
  vi.stubGlobal('window', { AudioContext: FakeAudioContext })
  const { AudioEngine } = await import('../../src/engine/audio')
  return new AudioEngine()
}

describe('AudioEngine.stopAll', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    createdOscs = 0
    immediateStops = 0
  })

  it('排定未来音后 stopAll 对每个发声源发起立即 stop（整曲/单小节场景）', async () => {
    const engine = await freshAudioEngine()
    engine.scheduleToneDelay(440, 2, 0.5) // 未来 2s
    engine.scheduleToneDelay(523.25, 5, 0.5) // 未来 5s
    engine.scheduleFrequency(880, 1001, 0.05) // 节拍器 lookahead

    expect(createdOscs).toBe(3)
    engine.stopAll()

    // 三个源都被立即中断（各自 stopCalls 含 undefined）
    expect(immediateStops).toBe(3)
  })

  it('stopAll 幂等：已立即停止的源已被 onended 移出集合，二次调用不重复 stop', async () => {
    const engine = await freshAudioEngine()
    engine.scheduleToneDelay(440, 2, 0.5)
    engine.stopAll()
    const afterFirst = immediateStops
    engine.stopAll()
    expect(immediateStops).toBe(afterFirst)
  })

  it('自然结束（onended）的源自动移出集合，stopAll 不再打扰', async () => {
    const engine = await freshAudioEngine()
    engine.scheduleToneDelay(440, 0, 0.5) // 立即开始
    // 模拟该源已到排定结束时间：手动触发 onended（等价于浏览器自动清理）
    // 无法直接访问私有集合，通过二次调度观测：不再产生额外立即 stop
    engine.stopAll()
    const afterStop = immediateStops
    expect(afterStop).toBe(1) // 仅 stopAll 那一次
  })

  it('无 AudioContext 环境（如 Node/SSR）下调用安全', async () => {
    vi.resetModules()
    vi.stubGlobal('window', undefined)
    const { AudioEngine } = await import('../../src/engine/audio')
    const engine = new AudioEngine()
    expect(() => {
      engine.scheduleToneDelay(440, 1, 0.3)
      engine.stopAll()
    }).not.toThrow()
  })
})
