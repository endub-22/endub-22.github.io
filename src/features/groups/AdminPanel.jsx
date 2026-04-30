import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'

export default function AdminPanel({ groupId }) {
  const [members, setMembers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadMembers()
  }, [groupId])

  async function loadMembers() {
    const { data, error } = await supabase
      .from('group_members')
      .select('user_id, role')
      .eq('group_id', groupId)

    if (error) setError(error.message)
    else setMembers(data)
  }

  async function removeUser(userId) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)

    if (!error) loadMembers()
  }

  return (
    <div>
      <h3>Admin Panel</h3>
      {error && <div>{error}</div>}
      {members.map(m => (
        <div key={m.user_id} style={{display:'flex', justifyContent:'space-between'}}>
          <span>{m.user_id} ({m.role})</span>
          <button onClick={() => removeUser(m.user_id)}>Remove</button>
        </div>
      ))}
    </div>
  )
}
