export function ProgressBar({ current, total }) {
  const percentage = total ? Math.round((current / total) * 100) : 0

  return (
    <div className="progress-block">
      <div className="progress-copy">
        <span>Progress</span>
        <strong>{current} of {total}</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin="0"
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <span className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
