import { HashRouter, Routes, Route } from 'react-router-dom'
import Tournois from './pages/Tournois'
import TournoiDetail from './pages/TournoiDetail'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Tournois />} />
        <Route path="/tournoi/:id" element={<TournoiDetail />} />
      </Routes>
    </HashRouter>
  )
}

export default App