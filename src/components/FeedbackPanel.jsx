export function FeedbackPanel({ feedback }) {
  if (!feedback) return null

  return (
    <div className={`feedback-panel ${feedback.is_correct ? 'feedback-correct' : 'feedback-incorrect'}`} role="status">
      <div className="feedback-heading">
        <span className="feedback-symbol" aria-hidden="true">{feedback.is_correct ? '✓' : '!'}</span>
        <strong>{feedback.is_correct ? 'That’s correct!' : 'Not quite — keep learning.'}</strong>
      </div>
      <p>{feedback.explanation}</p>
    </div>
  )
}
