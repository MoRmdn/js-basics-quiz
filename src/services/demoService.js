import { demoQuestions } from '../data/demoQuestions.js'
import { didPass } from '../utils/score.js'

const PROFILE_KEY = 'js-quest-demo-profile'
const ATTEMPTS_KEY = 'js-quest-demo-attempts'

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getDemoProfile() {
  return readJson(PROFILE_KEY, null)
}

export function saveDemoProfile(displayName) {
  const existing = getDemoProfile()
  const profile = existing ?? {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }

  const updated = { ...profile, display_name: displayName }
  writeJson(PROFILE_KEY, updated)
  return updated
}

export function getDemoQuestions() {
  return demoQuestions.map((question) => ({
    id: question.id,
    position: question.position,
    category: question.category,
    prompt: question.prompt,
    code_snippet: question.code_snippet,
    options: question.options,
  }))
}

export function listDemoAttempts() {
  return readJson(ATTEMPTS_KEY, []).sort((a, b) =>
    b.started_at.localeCompare(a.started_at),
  )
}

export function getDemoAttempt(attemptId) {
  return listDemoAttempts().find((attempt) => attempt.id === attemptId) ?? null
}

export function getOrCreateDemoAttempt() {
  const attempts = listDemoAttempts()
  const activeAttempt = attempts.find((attempt) => attempt.status === 'in_progress')

  if (activeAttempt) return activeAttempt

  const attempt = {
    id: crypto.randomUUID(),
    status: 'in_progress',
    score: null,
    passed: null,
    total_questions: demoQuestions.length,
    started_at: new Date().toISOString(),
    completed_at: null,
    answers: [],
  }

  writeJson(ATTEMPTS_KEY, [attempt, ...attempts])
  return attempt
}

export function getDemoAnswers(attemptId) {
  return getDemoAttempt(attemptId)?.answers ?? []
}

export function submitDemoAnswer(attemptId, questionId, selectedOption) {
  const attempts = listDemoAttempts()
  const attempt = attempts.find((item) => item.id === attemptId)
  const question = demoQuestions.find((item) => item.id === questionId)

  if (!attempt || !question || attempt.status !== 'in_progress') {
    throw new Error('This quiz attempt is no longer available.')
  }

  const existing = attempt.answers.find((answer) => answer.question_id === questionId)
  if (existing) {
    return {
      is_correct: existing.is_correct,
      correct_option: question.correctOption,
      explanation: question.explanation,
      answered_count: attempt.answers.length,
      total_questions: demoQuestions.length,
    }
  }

  const isCorrect = selectedOption === question.correctOption
  attempt.answers.push({
    question_id: questionId,
    selected_option: selectedOption,
    is_correct: isCorrect,
    answered_at: new Date().toISOString(),
  })
  writeJson(ATTEMPTS_KEY, attempts)

  return {
    is_correct: isCorrect,
    correct_option: question.correctOption,
    explanation: question.explanation,
    answered_count: attempt.answers.length,
    total_questions: demoQuestions.length,
  }
}

export function completeDemoAttempt(attemptId) {
  const attempts = listDemoAttempts()
  const attempt = attempts.find((item) => item.id === attemptId)

  if (!attempt) throw new Error('Quiz attempt not found.')
  if (attempt.status === 'completed') return attempt
  if (attempt.answers.length !== demoQuestions.length) {
    throw new Error('Answer every question before completing the quiz.')
  }

  attempt.score = attempt.answers.filter((answer) => answer.is_correct).length
  attempt.passed = didPass(attempt.score, demoQuestions.length)
  attempt.status = 'completed'
  attempt.completed_at = new Date().toISOString()
  writeJson(ATTEMPTS_KEY, attempts)
  return attempt
}
