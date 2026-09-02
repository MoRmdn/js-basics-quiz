import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState.jsx'
import { FeedbackPanel } from '../components/FeedbackPanel.jsx'
import { LoadingScreen } from '../components/LoadingScreen.jsx'
import { ProgressBar } from '../components/ProgressBar.jsx'
import { QuestionCard } from '../components/QuestionCard.jsx'
import {
  completeAttempt,
  getAttempt,
  getAttemptAnswers,
  getQuestions,
  submitAnswer,
} from '../services/quizService.js'

export function QuizPage() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadQuiz = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [attempt, loadedQuestions, loadedAnswers] = await Promise.all([
        getAttempt(attemptId),
        getQuestions(),
        getAttemptAnswers(attemptId),
      ])

      if (!attempt) throw new Error('Quiz attempt not found.')
      if (attempt.status === 'completed') {
        navigate(`/result/${attemptId}`, { replace: true })
        return
      }

      const answeredIds = new Set(loadedAnswers.map((answer) => answer.question_id))
      const nextIndex = loadedQuestions.findIndex((question) => !answeredIds.has(question.id))

      if (nextIndex === -1 && loadedQuestions.length) {
        await completeAttempt(attemptId)
        navigate(`/result/${attemptId}`, { replace: true })
        return
      }

      setQuestions(loadedQuestions)
      setAnswers(loadedAnswers)
      setQuestionIndex(Math.max(nextIndex, 0))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [attemptId, navigate])

  useEffect(() => {
    loadQuiz()
  }, [loadQuiz])

  const currentQuestion = questions[questionIndex]
  const answeredCount = answers.length
  const isLastQuestion = questionIndex === questions.length - 1
  const progressValue = useMemo(
    () => Math.min(answeredCount + (feedback ? 0 : 1), questions.length),
    [answeredCount, feedback, questions.length],
  )

  async function handleCheckAnswer() {
    if (selectedOption === null || !currentQuestion) return

    setSaving(true)
    setError('')
    try {
      const response = await submitAnswer(attemptId, currentQuestion.id, selectedOption)
      setFeedback(response)
      setAnswers((current) => [
        ...current,
        {
          question_id: currentQuestion.id,
          selected_option: selectedOption,
          is_correct: response.is_correct,
        },
      ])
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleNext() {
    if (isLastQuestion) {
      setSaving(true)
      try {
        await completeAttempt(attemptId)
        navigate(`/result/${attemptId}`, { replace: true })
      } catch (completeError) {
        setError(completeError.message)
        setSaving(false)
      }
      return
    }

    setQuestionIndex((current) => current + 1)
    setSelectedOption(null)
    setFeedback(null)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <LoadingScreen label="Preparing your next question…" />
  if (error && !currentQuestion) return <ErrorState message={error} onRetry={loadQuiz} />

  return (
    <div className="quiz-layout">
      <div className="quiz-topbar">
        <button className="text-button" onClick={() => navigate('/dashboard')}>← Save & exit</button>
        <ProgressBar current={progressValue} total={questions.length} />
      </div>

      <QuestionCard
        question={currentQuestion}
        selectedOption={selectedOption}
        feedback={feedback}
        onSelect={setSelectedOption}
      />

      <FeedbackPanel feedback={feedback} />
      {error && <p className="inline-error" role="alert">{error} Your saved answer is safe; retry the action.</p>}

      <div className="quiz-actions">
        {!feedback ? (
          <button className="button primary-button" onClick={handleCheckAnswer} disabled={selectedOption === null || saving}>
            {saving ? 'Saving answer…' : 'Check answer'}
          </button>
        ) : (
          <button className="button primary-button" onClick={handleNext} disabled={saving}>
            {saving ? 'Calculating result…' : isLastQuestion ? 'See my result →' : 'Next question →'}
          </button>
        )}
      </div>
    </div>
  )
}
