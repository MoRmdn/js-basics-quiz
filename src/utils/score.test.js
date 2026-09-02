import { describe, expect, it } from 'vitest'
import { didPass, percentageFor } from './score.js'

describe('quiz scoring', () => {
  it('passes at 70 percent and fails at 69 percent', () => {
    expect(didPass(69, 100)).toBe(false)
    expect(didPass(70, 100)).toBe(true)
  })

  it('handles an empty quiz safely', () => {
    expect(percentageFor(0, 0)).toBe(0)
    expect(didPass(0, 0)).toBe(false)
  })
})
