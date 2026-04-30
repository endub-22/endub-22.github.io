import React, { useEffect, useState } from 'react'
import { createGame, listGames } from '../../services/gamesService.js'

export default function GamesPage({ userId, groupId }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [minPlayers, setMinPlayers] = useState(2)
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [playTimeMinutes, setPlayTimeMinutes] = useState(60)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadGames()
  }, [])

  async function loadGames() {
    setLoading(true)
    setError('')
    const { data, error } = await listGames()
    if (error) setError(error.message)
    else setGames(data)
    setLoading(false)
  }

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Game title is required.')
      return
    }

    if (Number(maxPlayers) < Number(minPlayers)) {
      setError('Maximum players must be greater than or equal to minimum players.')
      return
    }

    setSaving(true)
    const { data, error } = await createGame({
      title: title.trim(),
      minPlayers: Number(minPlayers),
      maxPlayers: Number(maxPlayers),
      playTimeMinutes: Number(playTimeMinutes),
      notes: notes.trim(),
      userId,
      groupId
    })
    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setGames(prev => [data, ...prev].sort((a, b) => a.title.localeCompare(b.title)))
    setTitle('')
    setMinPlayers(2)
    setMaxPlayers(4)
    setPlayTimeMinutes(60)
    setNotes('')
  }

  return (
    <div>
      <h2>Game Library</h2>
      <p>Add the games your group can vote on for each event.</p>

      <form onSubmit={submit} style={{display:'grid', gap:10, maxWidth:520, marginBottom:24}}>
        <h3>Add game</h3>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Game title" />
        <input type="number" min="1" value={minPlayers} onChange={e => setMinPlayers(e.target.value)} placeholder="Min players" />
        <input type="number" min="1" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} placeholder="Max players" />
        <input type="number" min="1" value={playTimeMinutes} onChange={e => setPlayTimeMinutes(e.target.value)} placeholder="Play time minutes" />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" />
        <button type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add game'}</button>
        {error && <div style={{color:'#fca5a5'}}>{error}</div>}
      </form>

      {loading && <div>Loading games...</div>}
      {!loading && games.length === 0 && <div>No games yet.</div>}

      <div style={{display:'grid', gap:12}}>
        {games.map(game => (
          <div key={game.id} style={{border:'1px solid rgba(255,255,255,0.14)', borderRadius:16, padding:14}}>
            <strong>{game.title}</strong>
            <div>{game.minPlayers}-{game.maxPlayers} players · {game.playTimeMinutes} min</div>
            {game.notes && <p>{game.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
