import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { validateDisplayName } from '../utils/validation.js'

export function NamePage() {
  const { profile, loading, error: authError, enterName } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [validationError, setValidationError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && profile) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    const message = validateDisplayName(name)
    setValidationError(message)
    if (message) return

    setSubmitting(true)
    try {
      await enterName(name.trim())
      navigate('/dashboard', { replace: true })
    } catch {
      // AuthContext owns the user-facing Supabase error message.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="welcome-layout">
      <div className="welcome-copy">
        <span className="eyebrow">100 questions · clear explanations · saved progress</span>
        <h1>Build your JavaScript confidence, one answer at a time.</h1>
        <p>
          Move from variables to async JavaScript through a focused learning path. Every answer is explained immediately, so mistakes become useful.
        </p>

        <div className="feature-row" aria-label="Quiz features">
          <div><strong>10</strong><span>Core topics</span></div>
          <div><strong>70%</strong><span>Pass mark</span></div>
          <div><strong>∞</strong><span>Retakes</span></div>
        </div>
      </div>

      <form className="name-card" onSubmit={handleSubmit} noValidate>
        <span className="card-step">Your learning profile</span>
        <h2>What should we call you?</h2>
        <p>No email or password. Your progress stays connected to this browser.</p>

        <label htmlFor="display-name">Your name</label>
        <input
          id="display-name"
          autoComplete="name"
          autoFocus
          maxLength="41"
          placeholder="e.g. Mohamed"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (validationError) setValidationError('')
          }}
          aria-describedby="name-help name-error"
          aria-invalid={Boolean(validationError || authError)}
        />
        <span id="name-help" className="field-help">Between 2 and 40 characters.</span>
        {(validationError || authError) && <p id="name-error" className="field-error">{validationError || authError}</p>}

        <button className="button primary-button full-button" disabled={submitting}>
          {submitting ? 'Creating your profile…' : 'Start learning'}
        </button>

        <p className="privacy-note">Your name does not need to be unique. Supabase uses a private anonymous ID behind the scenes.</p>
      </form>
    </section>
  )
}
