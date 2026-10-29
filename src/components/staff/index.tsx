interface StaffViewProps {
  title?: string
}

/** 五线谱渲染组件（M2 用 VexFlow 实现）；目前为占位 */
export default function StaffView({ title = '五线谱' }: StaffViewProps) {
  return (
    <div className="placeholder">
      <div>{title}</div>
      <div>VexFlow 谱面渲染 · 待实现（M2）</div>
    </div>
  )
}
