import { beforeEach, describe, expect, it } from 'vitest'
import {
  completeDemoAttempt,
  getDemoAnswers,
  getOrCreateDemoAttempt,
  listDemoAttempts,
  saveDemoProfile,
  submitDemoAnswer,
} from './demoService.js'

describe('demo quiz lifecycle', () => {
  beforeEach(() => localStorage.clear())

  it('restores one active attempt and saves duplicate submissions idempotently', () => {
    saveDemoProfile('Mohamed')
    const attempt = getOrCreateDemoAttempt()

    expect(getOrCreateDemoAttempt().id).toBe(attempt.id)
    expect(submitDemoAnswer(attempt.id, 1, 0).is_correct).toBe(true)
    expect(submitDemoAnswer(attempt.id, 1, 0).is_correct).toBe(true)
    expect(getDemoAnswers(attempt.id)).toHaveLength(1)
  })

  it('requires all questions, calculates a result, and permits a retake', () => {
    const attempt = getOrCreateDemoAttempt()
    expect(() => completeDemoAttempt(attempt.id)).toThrow('Answer every question')

    submitDemoAnswer(attempt.id, 1, 0)
    submitDemoAnswer(attempt.id, 2, 2)
    submitDemoAnswer(attempt.id, 3, 2)

    const result = completeDemoAttempt(attempt.id)
    expect(result).toMatchObject({ status: 'completed', score: 3, passed: true })

    const retake = getOrCreateDemoAttempt()
    expect(retake.id).not.toBe(attempt.id)
    expect(listDemoAttempts()).toHaveLength(2)
  })
})
