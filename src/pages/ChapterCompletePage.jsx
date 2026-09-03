import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState.jsx'
import { LoadingScreen } from '../components/LoadingScreen.jsx'
import {
  completeAttempt,
  getAttempt,
  getAttemptAnswers,
  getQuestions,
} from '../services/quizService.js'
import { buildChapterProgress } from '../utils/chapters.js'
import { percentageFor } from '../utils/score.js'

export function ChapterCompletePage() {
  const { attemptId, chapterNumber } = useParams()
  const navigate = useNavigate()
  const [chapter, setChapter] = useState(null)
  const [nextChapter, setNextChapter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadChapterResult = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [attempt, questions, answers] = await Promise.all([
        getAttempt(attemptId),
        getQuestions(),
        getAttemptAnswers(attemptId),
      ])
      if (!attempt) throw new Error('Quiz attempt not found.')

      const chapters = buildChapterProgress(questions, answers)
      const requestedNumber = Number(chapterNumber)
      const completedChapter = chapters.find((item) => item.number === requestedNumber)

      if (!completedChapter) throw new Error('Chapter not found.')
      if (!completedChapter.completed) {
        navigate(`/quiz/${attemptId}/chapter/${completedChapter.number}`, { replace: true })
        return
      }

      const followingChapter = chapters.find((item) => item.number === requestedNumber + 1) ?? null

      // Chapter 5 finishes the same 100-question attempt on the server, so the
      // original secure score calculation and 70% pass rule still apply.
      if (!followingChapter && attempt.status !== 'completed') {
        await completeAttempt(attemptId)
      }

      setChapter(completedChapter)
      setNextChapter(followingChapter)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [attemptId, chapterNumber, navigate])

  useEffect(() => {
    loadChapterResult()
  }, [loadChapterResult])

  if (loading) return <LoadingScreen label="Preparing your chapter celebration…" />
  if (error && !chapter) return <ErrorState message={error} onRetry={loadChapterResult} />

  const percentage = percentageFor(chapter.score, chapter.total)
  const nextDestination = nextChapter
    ? nextChapter.completed
      ? `/quiz/${attemptId}/chapter/${nextChapter.number}/complete`
      : `/quiz/${attemptId}/chapter/${nextChapter.number}`
    : `/result/${attemptId}`

  return (
    <section className="chapter-complete-layout">
      <div className="chapter-celebration">
        <div className="celebration-medallion" aria-hidden="true">
          <span>✓</span>
        </div>
        <span className="eyebrow">Chapter {chapter.number} complete</span>
        <h1>Congratulations! You finished {chapter.name}.</h1>
        <p className="celebration-intro">
          Every answer is saved. Take a moment to celebrate what you learned before moving forward.
        </p>

        <div className="chapter-score-card">
          <div>
            <span>Your chapter score</span>
            <strong>{chapter.score}/{chapter.total}</strong>
          </div>
          <div className="chapter-score-percent">{percentage}%</div>
        </div>

        <div className="completed-topics" aria-label="Completed topics">
          <span>Topics completed</span>
          <div>{chapter.topics.map((topic) => <strong key={topic}>✓ {topic}</strong>)}</div>
        </div>

        {nextChapter ? (
          <div className="next-chapter-preview">
            <span>Up next</span>
            <strong>Chapter {nextChapter.number}: {nextChapter.name}</strong>
            <small>{nextChapter.topics.join(' · ')}</small>
          </div>
        ) : (
          <div className="next-chapter-preview final-preview">
            <span>All chapters complete</span>
            <strong>Your final JavaScript result is ready</strong>
            <small>See your five chapter scores and overall pass result.</small>
          </div>
        )}
      </div>

      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="result-actions">
        <button
          className="button primary-button"
          onClick={() => navigate(nextDestination)}
        >
          {nextChapter
            ? `${nextChapter.completed ? 'View' : 'Continue to'} ${nextChapter.name} →`
            : 'View final result →'}
        </button>
        <button className="button secondary-button" onClick={() => navigate('/dashboard')}>
          Back to chapters
        </button>
      </div>
    </section>
  )
}
