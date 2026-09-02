import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuestionCard } from './QuestionCard.jsx'

const question = {
  id: 1,
  position: 1,
  category: 'Variables',
  prompt: 'Which keyword can be reassigned?',
  code_snippet: null,
  options: ['let', 'const', 'final', 'static'],
}

describe('QuestionCard', () => {
  it('reports the selected answer', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<QuestionCard question={question} selectedOption={null} feedback={null} onSelect={onSelect} />)

    await user.click(screen.getByRole('radio', { name: /let/ }))
    expect(onSelect).toHaveBeenCalledWith(0)
  })

  it('locks options and reveals feedback styling after submission', () => {
    const { container } = render(
      <QuestionCard
        question={question}
        selectedOption={1}
        feedback={{ is_correct: false, correct_option: 0 }}
        onSelect={() => {}}
      />,
    )

    expect(screen.getByRole('group')).toBeDisabled()
    expect(container.querySelector('.correct')).toHaveTextContent('let')
    expect(container.querySelector('.incorrect')).toHaveTextContent('const')
  })
})
