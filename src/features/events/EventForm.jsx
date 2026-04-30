import React, { useState } from 'react'
import { createEvent } from '../../services/eventsService.js'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function EventForm({ userId, groupId, onCreated }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayIso())
  const [time, setTime] = useState('19:00')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Event title is required.')
      return
    }

    setSaving(true)
    const { data, error } = await createEvent({
      title: title.trim(),
      date,
      time,
      location: location.trim(),
      notes: notes.trim(),
      userId,
      groupId
    })
    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setTitle('')
    setDate(todayIso())
    setTime('19:00')
    setLocation('')
    setNotes('')
    onCreated(data)
  }

  return (
    <form onSubmit={submit} style={{display:'grid', gap:10, maxWidth:520, marginBottom:24}}>
      <h3>Create event</h3>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" />
      <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      <input type="time" value={time} onChange={e => setTime(e.target.value)} />
      <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" />
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" />
      <button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create event'}</button>
      {error && <div style={{color:'#fca5a5'}}>{error}</div>}
    </form>
  )
}
