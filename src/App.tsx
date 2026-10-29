import { NavLink, Outlet } from 'react-router-dom'
import './styles/app.css'

const NAV_ITEMS = [
  { to: '/', label: '首页', end: true },
  { to: '/notation', label: '五线谱' },
  { to: '/rhythm', label: '节拍与节奏' },
  { to: '/scales', label: '调式与音阶' },
]

export default function App() {
  return (
    <div className="app">
      <header className="app__nav">
        <div className="app__brand">♪ 乐理实验室</div>
        <nav className="app__nav-links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link--active' : 'nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app__main">
        <Outlet />
      </main>
      <footer className="app__foot">Music Theory Lab · 讲 → 看 → 听 → 练</footer>
    </div>
  )
}
