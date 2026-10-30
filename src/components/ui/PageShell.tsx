import type { ReactNode } from 'react'

export type Phase = '讲' | '看' | '听' | '练' | '调' | '弹' | '库' | '…' | '!'

export interface Section {
  key: string
  title: string
  phase?: Phase
  body: ReactNode
}

interface PageShellProps {
  title: string
  intro: string
  sections: Section[]
  footer?: ReactNode
}

/**
 * 页面外壳：每个学习模块页面 = 「讲 → 看 → 听 → 练」闭环。
 * 新增模块页面直接复用本组件，保持交互范式一致。
 */
export default function PageShell({ title, intro, sections, footer }: PageShellProps) {
  return (
    <div className="page">
      <header className="page__head">
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      {sections.map((section) => (
        <section key={section.key} className="page__section">
          <h2>
            {section.phase && <span className="phase-tag">{section.phase}</span>}
            {section.title}
          </h2>
          <div className="page__body">{section.body}</div>
        </section>
      ))}
      {footer && <footer className="page__foot">{footer}</footer>}
    </div>
  )
}
