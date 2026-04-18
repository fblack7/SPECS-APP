import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AuthPage({ mode, token }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)
  const [view, setView]         = useState(mode || 'login')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (view === 'register' && password !== confirm) {
      return setError('Passwords do not match.')
    }
    if (password.length < 8) {
      return setError('Password must be at least 8 characters.')
    }
    setBusy(true)
    try {
      if (view === 'login') {
        await login(email, password)
      } else {
        await register(email, password, token || null)
      }
      navigate('/')
    } catch (err) {
      const msg = err.message || 'An error occurred.'
      setError(
        msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')
          ? 'Incorrect email or password.'
          : msg.includes('auth/user-not-found')
          ? 'No account found with this email.'
          : msg.includes('auth/email-already-in-use')
          ? 'This email is already registered. Please log in.'
          : msg
      )
    } finally {
      setBusy(false)
    }
  }

  const isRegister = view === 'register'

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo / brand */}
        <div className="auth-brand">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#C9982A" opacity="0.15"/>
            <path d="M8 28L14 12L20 22L26 16L32 28" stroke="#C9982A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="20" cy="10" r="3" fill="#C9982A"/>
          </svg>
          <div className="auth-brand-text">
            <span className="auth-brand-title">P&H SPEC REFERENCE</span>
            <span className="auth-brand-sub">Mining Equipment Documentation</span>
          </div>
        </div>

        <h1 className="auth-heading">
          {isRegister ? (token ? 'Accept Invitation' : 'Create Account') : 'Sign In'}
        </h1>

        {token && isRegister && (
          <div className="auth-invite-banner">
            <span className="invite-icon">✉</span>
            You've been invited to join. Complete your registration below.
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className="auth-input"
            />
          </div>

          <div className="field-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              className="auth-input"
            />
          </div>

          {isRegister && (
            <div className="field-group">
              <label>Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required
                autoComplete="new-password"
                className="auth-input"
              />
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {!token && (
          <div className="auth-toggle">
            {isRegister ? (
              <>Already have an account? <button onClick={() => { setView('login'); setError('') }}>Sign in</button></>
            ) : (
<>No account? <button onClick={() => { setView('register'); setError('') }}>Create Account</button></>            )}
          </div>
        )}
      </div>

      {/* Background decoration */}
      <div className="auth-bg-deco" aria-hidden="true">
        <div className="deco-ring deco-ring-1" />
        <div className="deco-ring deco-ring-2" />
        <div className="deco-grid" />
      </div>
    </div>
  )
}
