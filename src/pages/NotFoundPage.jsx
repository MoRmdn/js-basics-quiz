import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="state-card">
      <span className="state-icon">404</span>
      <h1>Page not found</h1>
      <p>The lesson you are looking for may have moved.</p>
      <Link className="button primary-button" to="/dashboard">Return to dashboard</Link>
    </section>
  )
}
