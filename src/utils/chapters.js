import { CHAPTERS } from '../data/chapters.js'

function demoChapter(questions) {
  const topics = [...new Set(questions.map((question) => question.category))]

  return {
    number: 1,
    name: 'JavaScript Preview',
    shortName: 'Preview',
    start: 1,
    end: questions.length,
    topics,
  }
}

export function getChapters(questions) {
  if (questions.length < 20) return [demoChapter(questions)]
  return CHAPTERS
}

export function getQuestionsForChapter(questions, chapter) {
  return questions.filter(
    (question) => question.position >= chapter.start && question.position <= chapter.end,
  )
}

export function buildChapterProgress(questions, answers) {
  const answerByQuestionId = new Map(
    answers.map((answer) => [String(answer.question_id), answer]),
  )
  let previousChapterComplete = true

  // Like mapping a Dart list into view models: raw questions and answers become
  // UI-ready chapter objects without changing the original arrays.
  return getChapters(questions).map((chapter) => {
    const chapterQuestions = getQuestionsForChapter(questions, chapter)
    const chapterAnswers = chapterQuestions
      .map((question) => answerByQuestionId.get(String(question.id)))
      .filter(Boolean)
    const total = chapterQuestions.length
    const answered = chapterAnswers.length
    const score = chapterAnswers.filter((answer) => answer.is_correct).length
    const completed = total > 0 && answered === total
    const locked = !previousChapterComplete
    const status = completed
      ? 'completed'
      : locked
        ? 'locked'
        : answered > 0
          ? 'in_progress'
          : 'ready'

    previousChapterComplete = previousChapterComplete && completed

    return {
      ...chapter,
      questions: chapterQuestions,
      answered,
      total,
      score,
      completed,
      locked,
      status,
    }
  })
}

export function getCurrentChapter(chapters) {
  return chapters.find((chapter) => !chapter.completed && !chapter.locked)
    ?? chapters.at(-1)
}

