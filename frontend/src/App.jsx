import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import InterviewRoom from './pages/InterviewRoom.jsx'
import CodingRound from './pages/CodingRound.jsx'
import Results from './pages/Results.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/interview/:sessionId" element={<InterviewRoom />} />
      <Route path="/interview/:sessionId/coding" element={<CodingRound />} />
      <Route path="/interview/:sessionId/results" element={<Results />} />
    </Routes>
  )
}
