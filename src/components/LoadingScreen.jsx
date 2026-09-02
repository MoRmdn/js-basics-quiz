export function LoadingScreen({ label = 'Loading your quiz…' }) {
  return (
    <div className="center-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}
