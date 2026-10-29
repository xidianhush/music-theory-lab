import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface CardProps {
  title: string
  desc?: string
  tag?: string
  to?: string
  children?: ReactNode
}

/** 通用卡片；传入 to 时渲染为可点击的路由链接 */
export default function Card({ title, desc, tag, to, children }: CardProps) {
  const inner = (
    <>
      {tag && <span className="card__tag">{tag}</span>}
      <h3 className="card__title">{title}</h3>
      {desc && <p className="card__desc">{desc}</p>}
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className="card">
        {inner}
      </Link>
    )
  }
  return <div className="card">{inner}</div>
}
