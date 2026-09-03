const statusCopy = {
  completed: 'Completed',
  in_progress: 'In progress',
  ready: 'Ready to start',
  locked: 'Locked',
}

const actionCopy = {
  completed: 'View chapter result',
  in_progress: 'Continue chapter',
  ready: 'Start chapter',
  locked: 'Complete the previous chapter',
}

export function ChapterCard({ chapter, onOpen, busy }) {
  const percentage = chapter.total
    ? Math.round((chapter.answered / chapter.total) * 100)
    : 0

  return (
    <article className={`chapter-card chapter-${chapter.status}`}>
      <div className="chapter-card-heading">
        <span className="chapter-number" aria-hidden="true">
          {chapter.completed ? '✓' : chapter.locked ? '⌁' : chapter.number}
        </span>
        <span className={`chapter-status status-${chapter.status}`}>
          {statusCopy[chapter.status]}
        </span>
      </div>

      <div className="chapter-copy">
        <span className="chapter-label">Chapter {chapter.number}</span>
        <h3>{chapter.name}</h3>
        <p>{chapter.topics.join(' · ')}</p>
      </div>

      <div className="chapter-progress-row">
        <div className="chapter-progress-copy">
          <span>{chapter.completed ? 'Chapter score' : 'Progress'}</span>
          <strong>
            {chapter.completed
              ? `${chapter.score}/${chapter.total}`
              : `${chapter.answered}/${chapter.total}`}
          </strong>
        </div>
        <div
          className="chapter-progress-track"
          role="progressbar"
          aria-label={`${chapter.name} progress`}
          aria-valuemin="0"
          aria-valuemax={chapter.total}
          aria-valuenow={chapter.answered}
        >
          <span style={{ width: `${percentage}%` }} />
        </div>
      </div>

      <button
        className={`chapter-action ${chapter.locked ? 'chapter-action-locked' : ''}`}
        onClick={() => onOpen(chapter)}
        disabled={chapter.locked || busy}
      >
        <span>{actionCopy[chapter.status]}</span>
        {!chapter.locked && <span aria-hidden="true">→</span>}
      </button>
    </article>
  )
}

