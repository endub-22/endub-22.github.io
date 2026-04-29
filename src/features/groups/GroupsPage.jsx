import React, { useEffect, useState } from 'react'
import { listMyGroups, createGroup, joinGroupByCode } from '../../services/groupsService.js'

export default function GroupsPage({ userId, onSelectGroup }) {
  const [groups, setGroups] = useState([])
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    const { data } = await listMyGroups()
    setGroups(data)
  }

  async function create(e) {
    e.preventDefault()
    if (!name.trim()) return
    const { data, error } = await createGroup({ name, userId })
    if (error) {
      setError(error.message)
      return
    }
    setGroups(prev => [...prev, data])
    setName('')
  }

  async function join(e) {
    e.preventDefault()
    const { error } = await joinGroupByCode(joinCode)
    if (error) {
      setError(error.message)
      return
    }
    setJoinCode('')
    loadGroups()
  }

  return (
    <div>
      <h2>Your Groups</h2>

      <form onSubmit={create}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="New group name" />
        <button>Create</button>
      </form>

      <form onSubmit={join}>
        <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Invite code" />
        <button>Join</button>
      </form>

      {error && <div style={{color:'red'}}>{error}</div>}

      <ul>
        {groups.map(g => (
          <li key={g.id}>
            <strong>{g.name}</strong> ({g.role})
            <button onClick={() => onSelectGroup(g)}>Enter</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
