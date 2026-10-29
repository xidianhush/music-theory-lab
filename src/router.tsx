import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Notation from './pages/Notation'
import Rhythm from './pages/Rhythm'
import Scales from './pages/Scales'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'notation', element: <Notation /> },
      { path: 'rhythm', element: <Rhythm /> },
      { path: 'scales', element: <Scales /> },
    ],
  },
])

export default router
