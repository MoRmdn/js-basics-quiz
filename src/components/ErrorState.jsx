export function ErrorState({ message, onRetry }) {
  return (
    <section className="state-card" role="alert">
      <span className="state-icon error-icon" aria-hidden="true">!</span>
      <h1>Something went wrong</h1>
      <p>{message || 'Please try again.'}</p>
      {onRetry && <button className="button primary-button" onClick={onRetry}>Try again</button>}
    </section>
  )
}
