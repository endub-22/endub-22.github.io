import React, { useEffect, useState } from 'react'
import { getPollForEvent, createPollForEvent, voteForOption } from '../../services/pollsService.js'
import { listGames } from '../../services/gamesService.js'

export default function EventDetail({ event, onBack }) {
  const [poll, setPoll] = useState(null)
  const [games, setGames] = useState([])
  const [creating, setCreating] = useState(false)
  const [selectedGames, setSelectedGames] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPoll()
    loadGames()
  }, [event.id])

  async function loadPoll() {
    const { data } = await getPollForEvent(event.id)
    setPoll(data)
  }

  async function loadGames() {
    const { data } = await listGames()
    setGames(data)
  }

  async function createPoll() {
    if (selectedGames.length === 0) return
    setLoading(true)
    const { data } = await createPollForEvent({
      eventId: event.id,
      title: 'What should we play?',
      gameIds: selectedGames,
      userId: event.createdBy
    })
    setPoll(data)
    setCreating(false)
    setLoading(false)
  }

  async function vote(optionId) {
    await voteForOption({
      pollId: poll.id,
      optionId,
      userId: event.createdBy
    })
    loadPoll()
  }

  if (!event) return null

  return (
    <div>
      <button onClick={onBack}>← Back</button>

      <h2>{event.title}</h2>
      <p>{event.date} at {event.time}</p>

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
