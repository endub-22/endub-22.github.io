import React, { useEffect, useState } from 'react'
import { getPollForEvent, createPollForEvent, voteForOption } from '../../services/pollsService.js'
import { listGames } from '../../services/gamesService.js'
import { listAttendance, setAttendance } from '../../services/attendanceService.js'
import { supabase } from '../../lib/supabaseClient.js'

export default function EventDetail({ event, onBack }) {
  const [poll, setPoll] = useState(null)
  const [games, setGames] = useState([])
  const [creating, setCreating] = useState(false)
  const [selectedGames, setSelectedGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [attendees, setAttendees] = useState([])
  const [isAttending, setIsAttending] = useState(false)

  useEffect(() => {
    loadPoll()
    loadGames()
    loadAttendance()
  }, [event.id])

  async function loadPoll() {
    const { data } = await getPollForEvent(event.id)
    setPoll(data)
  }

  async function loadGames() {
    const gid = event.groupId || event.group_id
    if (!gid) return
    const { data } = await listGames(gid)
    setGames(data)
  }

  async function loadAttendance() {
    const { data } = await listAttendance(event.id)
    setAttendees(data)

    const session = await supabase.auth.getSession()
    const uid = session.data.session.user.id
    setIsAttending(data.some(a => a.userId === uid))
  }

  async function toggleAttendance() {
    const session = await supabase.auth.getSession()
    const uid = session.data.session.user.id

    await setAttendance({ eventId: event.id, userId: uid, attending: !isAttending })
    loadAttendance()
  }

  async function createPoll() {
    if (selectedGames.length === 0) return
    setLoading(true)

    const session = await supabase.auth.getSession()
    const uid = session.data.session.user.id

    const { data } = await createPollForEvent({
      eventId: event.id,
      title: 'What should we play?',
      gameIds: selectedGames,
      userId: uid
    })
    setPoll(data)
    setCreating(false)
    setLoading(false)
  }

  async function vote(optionId) {
    const session = await supabase.auth.getSession()
    const uid = session.data.session.user.id

    await voteForOption({ pollId: poll.id, optionId, userId: uid })
    loadPoll()
  }

  if (!event) return null

  return (
    <div className="card">
      <button onClick={onBack}>← Back</button>

      <h2>{event.title}</h2>
      <p>{event.date} at {event.time}</p>

      <h3>Attendance</h3>
      <button onClick={toggleAttendance}>
        {isAttending ? 'Cancel' : "I'm attending"}
      </button>
      <p>{attendees.length} attending</p>

      <ul>
        {attendees.map(a => (
          <li key={a.userId}>{a.username}</li>
        ))}
      </ul>

      <h3>Poll</h3>

      {!poll && !creating && (
        <button onClick={() => setCreating(true)}>Create poll</button>
      )}

      {creating && (
        <div>
          <p>Select games:</p>
          {games.map(g => (
            <label key={g.id}>
              <input
                type="checkbox"
                value={g.id}
                onChange={e => {
                  const id = e.target.value
                  setSelectedGames(prev =>
                    prev.includes(id)
                      ? prev.filter(x => x !== id)
                      : [...prev, id]
                  )
                }}
              />
              {g.title}
            </label>
          ))}
          <button onClick={createPoll} disabled={loading}>Create</button>
        </div>
      )}

      {poll && (
        <div>
          <h4>{poll.title}</h4>
          {poll.options.map(option => (
            <div key={option.id}>
              <strong>{option.game?.title}</strong>
              <span> ({option.votes.length} votes)</span>
              <button onClick={() => vote(option.id)}>Vote</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
