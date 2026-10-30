import { createHashRouter } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Notation from './pages/Notation'
import Rhythm from './pages/Rhythm'
import Scales from './pages/Scales'
import Pieces from './pages/Pieces'
import PieceDetail from './pages/PieceDetail'

// HashRouter：纯静态托管（GitHub Pages）下无服务端重写，刷新任意路由不 404
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'notation', element: <Notation /> },
      { path: 'rhythm', element: <Rhythm /> },
      { path: 'scales', element: <Scales /> },
      { path: 'pieces', element: <Pieces /> },
      { path: 'pieces/:id', element: <PieceDetail /> },
    ],
  },
])

export default router
