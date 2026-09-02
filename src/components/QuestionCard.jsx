const letters = ['A', 'B', 'C', 'D']

export function QuestionCard({ question, selectedOption, feedback, onSelect }) {
  return (
    <article className="question-card">
      <div className="question-meta">
        <span className="category-pill">{question.category}</span>
        <span>Question {question.position}</span>
      </div>

      <h1>{question.prompt}</h1>
      {question.code_snippet && <pre className="code-block"><code>{question.code_snippet}</code></pre>}

      <fieldset className="option-list" disabled={Boolean(feedback)}>
        <legend className="sr-only">Choose one answer</legend>
        {question.options.map((option, index) => {
          const isSelected = selectedOption === index
          const isCorrect = feedback?.correct_option === index
          const isWrongSelection = Boolean(feedback) && isSelected && !feedback.is_correct
          const classNames = [
            'option-button',
            isSelected ? 'selected' : '',
            isCorrect ? 'correct' : '',
            isWrongSelection ? 'incorrect' : '',
          ].filter(Boolean).join(' ')

          return (
            <label className={classNames} key={option}>
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={isSelected}
                onChange={() => onSelect(index)}
              />
              <span className="option-letter" aria-hidden="true">{letters[index]}</span>
              <span>{option}</span>
              {isCorrect && <span className="answer-mark" aria-label="Correct answer">✓</span>}
              {isWrongSelection && <span className="answer-mark" aria-label="Your answer was incorrect">×</span>}
            </label>
          )
        })}
      </fieldset>
    </article>
  )
}
