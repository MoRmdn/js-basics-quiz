import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { LoadingScreen } from './LoadingScreen.jsx'

export function ProtectedRoute({ children }) {
  const { profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen label="Restoring your learning session…" />
  if (!profile) return <Navigate to="/" replace state={{ from: location.pathname }} />

  return children
}
