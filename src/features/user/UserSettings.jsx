import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'

export default function UserSettings() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Password updated successfully')
      setPassword('')
      setConfirm('')
    }
  }

  return (
    <div style={{maxWidth:400}}>
      <h2>User Settings</h2>
      <form onSubmit={handleSubmit} style={{display:'grid', gap:10}}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
        <button type="submit">Update password</button>
        {error && <div style={{color:'red'}}>{error}</div>}
        {message && <div style={{color:'green'}}>{message}</div>}
      </form>
    </div>
  )
}
