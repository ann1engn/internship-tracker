import { useState } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session, signIn, signUp } = useAuth()

  // useState gives a component memory. Each call returns the current
  // value and a function to change it. Changing it redraws the screen.
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already logged in? Go straight to the app.
  if (session) return <Navigate to="/" replace />

  async function handleSubmit(event) {
    event.preventDefault() // stop the browser from reloading the page
    setError('')
    setNotice('')
    setSubmitting(true)

    const action = mode === 'signin' ? signIn : signUp
    const { data, error } = await action(email, password)

    if (error) {
      setError(error.message)
    } else if (mode === 'signup' && !data.session) {
      // Supabase asks new users to confirm their email by default, so
      // there is no session yet.
      setNotice('Check your email for a confirmation link, then sign in.')
      setMode('signin')
    }
    setSubmitting(false)
  }

  return (
    <div className="auth-screen">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Internship Tracker</h1>
        <p className="muted">
          {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
        </p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
        </label>

        {error && <p className="message message-error">{error}</p>}
        {notice && <p className="message message-success">{notice}</p>}

        <button className="button" type="submit" disabled={submitting}>
          {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>

        <button
          type="button"
          className="link-button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError('')
            setNotice('')
          }}
        >
          {mode === 'signin'
            ? 'New here? Create an account'
            : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
