interface PianoProps {
  onNote?: (midi: number) => void
}

/** 虚拟钢琴键盘（M2 实现，点击发声）；目前为占位 */
export default function Piano(_props: PianoProps) {
  return <div className="placeholder">虚拟钢琴键盘 · 待实现（M2）</div>
}
