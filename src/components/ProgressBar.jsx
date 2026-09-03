export function ProgressBar({ current, total, label = 'Progress' }) {
  const percentage = total ? Math.round((current / total) * 100) : 0

  return (
    <div className="progress-block">
      <div className="progress-copy">
        <span>{label}</span>
        <strong>{current} of {total}</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin="0"
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <span className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
