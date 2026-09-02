import { describe, expect, it } from 'vitest'
import { validateDisplayName } from './validation.js'

describe('validateDisplayName', () => {
  it('rejects empty and one-character names', () => {
    expect(validateDisplayName('   ')).toBe('Enter your name to continue.')
    expect(validateDisplayName('A')).toContain('at least 2')
  })

  it('accepts a trimmed name from 2 to 40 characters', () => {
    expect(validateDisplayName('  Mohamed  ')).toBe('')
    expect(validateDisplayName('a'.repeat(40))).toBe('')
  })

  it('rejects names longer than 40 characters', () => {
    expect(validateDisplayName('a'.repeat(41))).toContain('40 characters')
  })
})
