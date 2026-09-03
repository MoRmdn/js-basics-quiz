import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChapterCard } from '../components/ChapterCard.jsx'
import { ErrorState } from '../components/ErrorState.jsx'
import { LoadingScreen } from '../components/LoadingScreen.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useQuizWebMcp } from '../hooks/useQuizWebMcp.js'
import {
  getAttemptAnswers,
  getOrCreateActiveAttempt,
  getQuestions,
  listAttempts,
} from '../services/quizService.js'
import { buildChapterProgress, getCurrentChapter } from '../utils/chapters.js'
import { percentageFor } from '../utils/score.js'

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function DashboardPage() {
  const { profile, isDemo } = useAuth()
  const navigate = useNavigate()
  const [attempts, setAttempts] = useState([])
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  useQuizWebMcp()

  const loadAttempts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [loadedAttempts, loadedQuestions] = await Promise.all([
        listAttempts(),
        getQuestions(),
      ])
      const active = loadedAttempts.find((attempt) => attempt.status === 'in_progress')
      const displayedAttempt = active ?? loadedAttempts[0]
      const loadedAnswers = displayedAttempt
        ? await getAttemptAnswers(displayedAttempt.id)
        : []

      setAttempts(loadedAttempts)
      setQuestions(loadedQuestions)
      setAnswers(loadedAnswers)
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
      const targetChapter = activeAttempt ? getCurrentChapter(chapters).number : 1
      navigate(`/quiz/${attempt.id}/chapter/${targetChapter}`)
    } catch (startError) {
      setError(startError.message)
      setStarting(false)
    }
  }

  async function handleOpenChapter(chapter) {
    if (chapter.locked) return

    if (chapter.completed && displayedAttempt) {
      navigate(`/quiz/${displayedAttempt.id}/chapter/${chapter.number}/complete`)
      return
    }

    setStarting(true)
    setError('')
    try {
      const attempt = activeAttempt ?? await getOrCreateActiveAttempt()
      navigate(`/quiz/${attempt.id}/chapter/${chapter.number}`)
    } catch (startError) {
      setError(startError.message)
      setStarting(false)
    }
  }

  if (loading) return <LoadingScreen label="Loading your quiz history…" />
  if (error && attempts.length === 0) return <ErrorState message={error} onRetry={loadAttempts} />

  const activeAttempt = attempts.find((attempt) => attempt.status === 'in_progress')
  const completedAttempts = attempts.filter((attempt) => attempt.status === 'completed')
  const displayedAttempt = activeAttempt ?? attempts[0] ?? null
  const chapters = buildChapterProgress(questions, answers)
  const currentChapter = getCurrentChapter(chapters)
  const bestScore = completedAttempts.length
    ? Math.max(...completedAttempts.map((attempt) => percentageFor(attempt.score, attempt.total_questions)))
    : null

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Welcome back, {profile.display_name}</span>
          <h1>{activeAttempt ? `${currentChapter.name} is waiting.` : completedAttempts.length ? 'Your JavaScript journey is complete.' : 'Learn JavaScript, one chapter at a time.'}</h1>
          <p>{isDemo ? 'Try the shortened local preview chapter, then connect Supabase for all five chapters.' : 'Five focused chapters, 20 questions each. Every answer is saved after each step.'}</p>
        </div>
        <button className="button primary-button hero-button" onClick={handleStart} disabled={starting}>
          {starting
            ? 'Opening chapter…'
            : activeAttempt
              ? `Resume ${currentChapter.shortName} →`
              : completedAttempts.length
                ? 'Retake all chapters →'
                : `Start ${currentChapter.shortName} →`}
        </button>
      </section>

      <section className="stat-grid" aria-label="Learning statistics">
        <div className="stat-card"><span>Attempts completed</span><strong>{completedAttempts.length}</strong></div>
        <div className="stat-card"><span>Best score</span><strong>{bestScore === null ? '—' : `${bestScore}%`}</strong></div>
        <div className="stat-card"><span>Chapters completed</span><strong>{chapters.filter((chapter) => chapter.completed).length}/{chapters.length}</strong></div>
      </section>

      <section className="chapters-section" aria-labelledby="chapters-heading">
        <div className="section-heading chapter-section-heading">
          <div>
            <span className="eyebrow">Learning path</span>
            <h2 id="chapters-heading">{isDemo ? 'Your preview chapter' : 'Your five chapters'}</h2>
            <p>{isDemo ? 'This short chapter demonstrates the full learning flow.' : 'Complete each chapter to unlock the next one. Your score does not block your progress.'}</p>
          </div>
          {!isDemo && <span className="target-pill">Overall target: 70%</span>}
        </div>

        <div className="chapter-grid">
          {chapters.map((chapter) => (
            <ChapterCard
              key={chapter.number}
              chapter={chapter}
              onOpen={handleOpenChapter}
              busy={starting}
            />
          ))}
        </div>
      </section>

      <section className="history-section">
        <div className="section-heading">
          <div><span className="eyebrow">Your progress</span><h2>Attempt history</h2></div>
          {completedAttempts.length > 0 && !activeAttempt && <button className="button secondary-button" onClick={handleStart}>Retake all chapters</button>}
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
