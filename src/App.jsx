import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { ChapterCompletePage } from './pages/ChapterCompletePage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { NamePage } from './pages/NamePage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { QuizPage } from './pages/QuizPage.jsx'
import { ResultPage } from './pages/ResultPage.jsx'
import './App.css'

function protect(page) {
  return <ProtectedRoute>{page}</ProtectedRoute>
}

export default function App() {
  // Routes play the same role as named routes or GoRouter entries in Flutter.
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<NamePage />} />
        <Route path="dashboard" element={protect(<DashboardPage />)} />
        <Route path="quiz/:attemptId" element={protect(<QuizPage />)} />
        <Route path="quiz/:attemptId/chapter/:chapterNumber" element={protect(<QuizPage />)} />
        <Route path="quiz/:attemptId/chapter/:chapterNumber/complete" element={protect(<ChapterCompletePage />)} />
        <Route path="result/:attemptId" element={protect(<ResultPage />)} />
        <Route path="home" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
