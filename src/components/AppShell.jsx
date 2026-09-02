import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export function AppShell() {
  const { profile, isDemo } = useAuth()

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to={profile ? '/dashboard' : '/'} aria-label="JS Quest home">
          <span className="brand-mark" aria-hidden="true">JS</span>
          <span>JS Quest</span>
        </Link>

        <div className="header-meta">
          {isDemo && <span className="mode-badge">3-question demo</span>}
          {profile && <span className="learner-name">Hi, {profile.display_name}</span>}
        </div>
      </header>

      {isDemo && (
        <div className="demo-banner" role="status">
          Demo mode is active. Add your Supabase values to <code>.env.local</code> to unlock all 100 questions and cloud saving.
        </div>
      )}

      <main className="page-container">
        <Outlet />
      </main>

      <footer className="site-footer">
        <span>Built to learn JavaScript and React by doing.</span>
        <span>Pass mark: 70%</span>
      </footer>
    </div>
  )
}
