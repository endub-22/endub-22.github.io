import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'

export default function AuthScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)

    if (error) {
      setError(error.message)
    } else {
      onLogin(data.session)
    }
  }

  async function handlePasswordReset(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Enter your email address first.')
      return
    }

    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin
    })
    setBusy(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Password reset email sent. Check your inbox.')
    setMode('login')
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={mode === 'reset' ? handlePasswordReset : handleLogin}>
        <div className="brand-mark">🎲</div>
        <h2>{mode === 'reset' ? 'Reset password' : 'Login'}</h2>
        <p>{mode === 'reset' ? 'Enter your email and we will send you a reset link.' : 'Sign in to manage your game groups.'}</p>

        <input placeholder="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />

        {mode === 'login' && (
          <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        )}

        <button className="btn primary" disabled={busy} type="submit">
          {busy ? 'Working...' : mode === 'reset' ? 'Send reset email' : 'Login'}
        </button>

        {mode === 'login' ? (
          <button type="button" className="btn ghost" onClick={() => { setMode('reset'); setError(''); setMessage('') }}>
            Forgot password?
          </button>
        ) : (
          <button type="button" className="btn ghost" onClick={() => { setMode('login'); setError(''); setMessage('') }}>
            Back to login
          </button>
        )}

        {message && <div className="notice good">{message}</div>}
        {error && <div className="notice error">{error}</div>}
      </form>
    </div>
  )
}
