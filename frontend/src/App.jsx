import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import InterviewRoom from './pages/InterviewRoom.jsx'
import CodingRound from './pages/CodingRound.jsx'
import Results from './pages/Results.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { useTheme } from './hooks/useTheme.js'

export default function App() {
  const { theme, toggle } = useTheme()

  return (
    <>
      <ThemeToggle theme={theme} onToggle={toggle} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/interview/:sessionId" element={<InterviewRoom />} />
        <Route path="/interview/:sessionId/coding" element={<CodingRound />} />
        <Route path="/interview/:sessionId/results" element={<Results />} />
      </Routes>
    </>
  )
}