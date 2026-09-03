import { describe, expect, it } from 'vitest'
import { buildChapterProgress, getCurrentChapter, getQuestionsForChapter } from './chapters.js'

const questions = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1,
  position: index + 1,
  category: `Topic ${Math.floor(index / 10) + 1}`,
}))

function answersThrough(count, incorrectPositions = []) {
  return questions.slice(0, count).map((question) => ({
    question_id: question.id,
    is_correct: !incorrectPositions.includes(question.position),
  }))
}

describe('chapter progress', () => {
  it('maps the 100 questions into five chapters of twenty', () => {
    const chapters = buildChapterProgress(questions, [])

    expect(chapters).toHaveLength(5)
    expect(getQuestionsForChapter(questions, chapters[0])).toHaveLength(20)
    expect(chapters[4]).toMatchObject({ start: 81, end: 100, total: 20 })
  })

  it('preserves partial progress and locks future chapters', () => {
    const chapters = buildChapterProgress(questions, answersThrough(17))

    expect(chapters[0]).toMatchObject({ answered: 17, status: 'in_progress' })
    expect(chapters[1]).toMatchObject({ answered: 0, status: 'locked' })
    expect(getCurrentChapter(chapters).number).toBe(1)
  })

  it('unlocks the next chapter after twenty answers regardless of score', () => {
    const chapters = buildChapterProgress(questions, answersThrough(20, [1, 2, 3, 4, 5, 6]))

    expect(chapters[0]).toMatchObject({ completed: true, score: 14 })
    expect(chapters[1]).toMatchObject({ locked: false, status: 'ready' })
    expect(chapters[2].locked).toBe(true)
    expect(getCurrentChapter(chapters).number).toBe(2)
  })

  it.each([
    [40, 2, 3],
    [60, 3, 4],
    [80, 4, 5],
  ])('unlocks a new chapter at the %i-answer boundary', (answerCount, completedNumber, currentNumber) => {
    const chapters = buildChapterProgress(questions, answersThrough(answerCount))

    expect(chapters[completedNumber - 1].completed).toBe(true)
    expect(chapters[currentNumber - 1].status).toBe('ready')
    expect(getCurrentChapter(chapters).number).toBe(currentNumber)
  })

  it('calculates every chapter score after all 100 questions', () => {
    const incorrect = [2, 22, 42, 62, 82]
    const chapters = buildChapterProgress(questions, answersThrough(100, incorrect))

    expect(chapters.every((chapter) => chapter.completed)).toBe(true)
    expect(chapters.map((chapter) => chapter.score)).toEqual([19, 19, 19, 19, 19])
  })

  it('uses a single shortened chapter for the offline demo', () => {
    const demoQuestions = questions.slice(0, 3)
    const chapters = buildChapterProgress(demoQuestions, answersThrough(3))

    expect(chapters).toHaveLength(1)
    expect(chapters[0]).toMatchObject({ name: 'JavaScript Preview', completed: true, total: 3 })
  })
})
