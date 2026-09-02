import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState.jsx'
import { LoadingScreen } from '../components/LoadingScreen.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useQuizWebMcp } from '../hooks/useQuizWebMcp.js'
import { getOrCreateActiveAttempt, listAttempts } from '../services/quizService.js'
import { percentageFor } from '../utils/score.js'

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function DashboardPage() {
  const { profile, isDemo } = useAuth()
  const navigate = useNavigate()
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  useQuizWebMcp()

  const loadAttempts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setAttempts(await listAttempts())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAttempts()
  }, [loadAttempts])

  async function handleStart() {
    setStarting(true)
    setError('')
    try {
      const attempt = await getOrCreateActiveAttempt()
      navigate(`/quiz/${attempt.id}`)
    } catch (startError) {
      setError(startError.message)
      setStarting(false)
    }
  }

  if (loading) return <LoadingScreen label="Loading your quiz history…" />
  if (error && attempts.length === 0) return <ErrorState message={error} onRetry={loadAttempts} />

  const activeAttempt = attempts.find((attempt) => attempt.status === 'in_progress')
  const completedAttempts = attempts.filter((attempt) => attempt.status === 'completed')
  const bestScore = completedAttempts.length
    ? Math.max(...completedAttempts.map((attempt) => percentageFor(attempt.score, attempt.total_questions)))
    : null

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Welcome back, {profile.display_name}</span>
          <h1>{activeAttempt ? 'Your next question is waiting.' : 'Ready for a JavaScript challenge?'}</h1>
          <p>{isDemo ? 'Try the local three-question preview, then connect Supabase for the complete path.' : 'Work through all 100 questions. Your answer is saved after every step.'}</p>
        </div>
        <button className="button primary-button hero-button" onClick={handleStart} disabled={starting}>
          {starting ? 'Opening quiz…' : activeAttempt ? 'Resume quiz →' : 'Start a new attempt →'}
        </button>
      </section>

      <section className="stat-grid" aria-label="Learning statistics">
        <div className="stat-card"><span>Attempts completed</span><strong>{completedAttempts.length}</strong></div>
        <div className="stat-card"><span>Best score</span><strong>{bestScore === null ? '—' : `${bestScore}%`}</strong></div>
        <div className="stat-card"><span>Target score</span><strong>70%</strong></div>
      </section>

      <section className="history-section">
        <div className="section-heading">
          <div><span className="eyebrow">Your progress</span><h2>Attempt history</h2></div>
          {completedAttempts.length > 0 && <button className="button secondary-button" onClick={handleStart}>Retake quiz</button>}
        </div>

        {completedAttempts.length === 0 ? (
          <div className="empty-state"><span aria-hidden="true">◎</span><h3>No completed attempts yet</h3><p>Your scores and pass results will appear here.</p></div>
        ) : (
          <div className="history-list">
            {completedAttempts.map((attempt, index) => (
              <button className="history-item" key={attempt.id} onClick={() => navigate(`/result/${attempt.id}`)}>
                <span className={`result-dot ${attempt.passed ? 'dot-pass' : 'dot-fail'}`} aria-hidden="true" />
                <span className="history-main"><strong>Attempt {completedAttempts.length - index}</strong><small>{formatDate(attempt.completed_at)}</small></span>
                <span className="history-result"><strong>{percentageFor(attempt.score, attempt.total_questions)}%</strong><small>{attempt.passed ? 'Passed' : 'Keep learning'}</small></span>
                <span aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
