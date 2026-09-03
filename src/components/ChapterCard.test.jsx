import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChapterCard } from './ChapterCard.jsx'

const baseChapter = {
  number: 2,
  name: 'Logic & Functions',
  topics: ['Control Flow', 'Functions & Scope'],
  answered: 7,
  total: 20,
  score: 5,
  completed: false,
  locked: false,
  status: 'in_progress',
}

describe('ChapterCard', () => {
  it('shows progress and opens an available chapter', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<ChapterCard chapter={baseChapter} onOpen={onOpen} busy={false} />)

    expect(screen.getByText('7/20')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /continue chapter/i }))
    expect(onOpen).toHaveBeenCalledWith(baseChapter)
  })

  it('disables a locked chapter', () => {
    render(
      <ChapterCard
        chapter={{ ...baseChapter, answered: 0, locked: true, status: 'locked' }}
        onOpen={() => {}}
        busy={false}
      />,
    )

    expect(screen.getByRole('button', { name: /complete the previous chapter/i })).toBeDisabled()
  })
})
