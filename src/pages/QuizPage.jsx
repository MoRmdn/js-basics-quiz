import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState.jsx'
import { FeedbackPanel } from '../components/FeedbackPanel.jsx'
import { LoadingScreen } from '../components/LoadingScreen.jsx'
import { ProgressBar } from '../components/ProgressBar.jsx'
import { QuestionCard } from '../components/QuestionCard.jsx'
import {
  getAttempt,
  getAttemptAnswers,
  getQuestions,
  submitAnswer,
} from '../services/quizService.js'
import { buildChapterProgress, getCurrentChapter } from '../utils/chapters.js'

export function QuizPage() {
  const { attemptId, chapterNumber } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [overallTotal, setOverallTotal] = useState(0)
  const [chapter, setChapter] = useState(null)
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

      const chapterProgress = buildChapterProgress(loadedQuestions, loadedAnswers)
      const currentChapter = getCurrentChapter(chapterProgress)
      const requestedChapter = chapterProgress.find(
        (item) => item.number === Number(chapterNumber),
      )

      // Old bookmarks such as /quiz/:attemptId and locked chapter links are
      // redirected to the learner's real next chapter.
      if (!requestedChapter || requestedChapter.locked) {
        navigate(`/quiz/${attemptId}/chapter/${currentChapter.number}`, { replace: true })
        return
      }
      if (requestedChapter.completed) {
        navigate(`/quiz/${attemptId}/chapter/${requestedChapter.number}/complete`, { replace: true })
        return
      }

      const answeredIds = new Set(loadedAnswers.map((answer) => String(answer.question_id)))
      const nextIndex = requestedChapter.questions.findIndex(
        (question) => !answeredIds.has(String(question.id)),
      )

      if (nextIndex === -1 && requestedChapter.questions.length) {
        navigate(`/quiz/${attemptId}/chapter/${requestedChapter.number}/complete`, { replace: true })
        return
      }

      setQuestions(requestedChapter.questions)
      setOverallTotal(loadedQuestions.length)
      setChapter(requestedChapter)
      setAnswers(loadedAnswers)
      setQuestionIndex(Math.max(nextIndex, 0))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [attemptId, chapterNumber, navigate])

  useEffect(() => {
    loadQuiz()
  }, [loadQuiz])

  const currentQuestion = questions[questionIndex]
  const answeredCount = chapter?.answered ?? 0
  const overallAnsweredCount = answers.length
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
      setChapter((current) => ({
        ...current,
        answered: current.answered + 1,
        score: current.score + (response.is_correct ? 1 : 0),
      }))
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleNext() {
    if (isLastQuestion) {
      navigate(`/quiz/${attemptId}/chapter/${chapter.number}/complete`)
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
  if (!chapter || !currentQuestion) return <LoadingScreen label="Opening your chapter…" />

  return (
    <div className="quiz-layout">
      <div className="quiz-topbar">
        <button className="text-button" onClick={() => navigate('/dashboard')}>← Save & exit</button>
        <div className="quiz-progress-stack">
          <ProgressBar
            current={progressValue}
            total={questions.length}
            label={`Chapter ${chapter.number}: ${chapter.shortName}`}
          />
          <span className="overall-progress">Overall journey: {overallAnsweredCount} of {overallTotal} answered</span>
        </div>
      </div>

      <div className="quiz-chapter-heading">
        <span>Chapter {chapter.number}</span>
        <strong>{chapter.name}</strong>
      </div>

      <QuestionCard
        question={currentQuestion}
        questionNumber={questionIndex + 1}
        questionTotal={questions.length}
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
            {isLastQuestion ? `Finish ${chapter.shortName} →` : 'Next question →'}
          </button>
        )}
      </div>
    </div>
  )
}
