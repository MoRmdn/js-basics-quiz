import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState.jsx'
import { LoadingScreen } from '../components/LoadingScreen.jsx'
import {
  getAttempt,
  getAttemptAnswers,
  getOrCreateActiveAttempt,
  getQuestions,
} from '../services/quizService.js'
import { buildChapterProgress } from '../utils/chapters.js'
import { percentageFor } from '../utils/score.js'

export function ResultPage() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  const loadResult = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [result, questions, answers] = await Promise.all([
        getAttempt(attemptId),
        getQuestions(),
        getAttemptAnswers(attemptId),
      ])
      if (!result || result.status !== 'completed') throw new Error('This result is not ready yet.')
      setAttempt(result)
      setChapters(buildChapterProgress(questions, answers))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [attemptId])

  useEffect(() => {
    loadResult()
  }, [loadResult])

  async function handleRetake() {
    setStarting(true)
    try {
      const newAttempt = await getOrCreateActiveAttempt()
      navigate(`/quiz/${newAttempt.id}/chapter/1`)
    } catch (startError) {
      setError(startError.message)
      setStarting(false)
    }
  }

  if (loading) return <LoadingScreen label="Calculating your result…" />
  if (error && !attempt) return <ErrorState message={error} onRetry={loadResult} />

  const percentage = percentageFor(attempt.score, attempt.total_questions)
  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference - (percentage / 100) * circumference

  return (
    <section className="result-layout">
      <div className={`result-celebration ${attempt.passed ? 'result-pass' : 'result-fail'}`}>
        <span className="eyebrow">Quiz complete</span>
        <h1>{attempt.passed ? 'You passed — excellent work!' : 'A strong start. Keep practicing!'}</h1>
        <p>{attempt.passed ? 'Your JavaScript foundation is taking shape. Retake the quiz anytime to reinforce it.' : 'Review the explanations, then try again. Progress comes from understanding each mistake.'}</p>

        <div className="score-ring" aria-label={`Score ${percentage} percent`}>
          <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
            <circle className="ring-track" cx="60" cy="60" r="54" />
            <circle className="ring-value" cx="60" cy="60" r="54" style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }} />
          </svg>
          <div><strong>{percentage}%</strong><span>{attempt.score}/{attempt.total_questions} correct</span></div>
        </div>

        <span className={`pass-badge ${attempt.passed ? 'badge-pass' : 'badge-fail'}`}>
          {attempt.passed ? 'Passed' : 'Below the 70% target'}
        </span>
      </div>

      <section className="result-chapters" aria-labelledby="chapter-results-heading">
        <div className="result-section-heading">
          <span className="eyebrow">Your learning path</span>
          <h2 id="chapter-results-heading">Chapter results</h2>
        </div>
        <div className="chapter-result-grid">
          {chapters.map((chapter) => (
            <button
              className="chapter-result-card"
              key={chapter.number}
              onClick={() => navigate(`/quiz/${attemptId}/chapter/${chapter.number}/complete`)}
            >
              <span>Chapter {chapter.number}</span>
              <strong>{chapter.name}</strong>
              <small>{chapter.score}/{chapter.total} correct · {percentageFor(chapter.score, chapter.total)}%</small>
              <span className="chapter-result-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </section>

      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="result-actions">
        <button className="button primary-button" onClick={handleRetake} disabled={starting}>{starting ? 'Starting…' : 'Retake all chapters'}</button>
        <button className="button secondary-button" onClick={() => navigate('/dashboard')}>View attempt history</button>
      </div>
    </section>
  )
}
