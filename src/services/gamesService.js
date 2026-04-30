import { supabase } from '../lib/supabaseClient.js'

export async function listGames(groupId) {
  if (!groupId) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('games')
    .select('id,title,min_players,max_players,play_time_minutes,owner_id,notes,created_at,group_id')
    .eq('group_id', groupId)
    .order('title', { ascending: true })

  if (error) return { data: [], error }

  return {
    data: data.map(g => ({
      id: g.id,
      title: g.title,
      minPlayers: g.min_players,
      maxPlayers: g.max_players,
      playTimeMinutes: g.play_time_minutes,
      ownerId: g.owner_id,
      groupId: g.group_id,
      notes: g.notes || '',
      createdAt: g.created_at
    })),
    error: null
  }
}

export async function createGame({ title, minPlayers, maxPlayers, playTimeMinutes, notes, userId, groupId }) {
  const { data, error } = await supabase
    .from('games')
    .insert({
      title,
      min_players: minPlayers,
      max_players: maxPlayers,
      play_time_minutes: playTimeMinutes,
      notes,
      owner_id: userId,
      group_id: groupId
    })
    .select('id,title,min_players,max_players,play_time_minutes,owner_id,notes,created_at,group_id')
    .single()

  if (error) return { data: null, error }

  return {
    data: {
      id: data.id,
      title: data.title,
      minPlayers: data.min_players,
      maxPlayers: data.max_players,
      playTimeMinutes: data.play_time_minutes,
      ownerId: data.owner_id,
      groupId: data.group_id,
      notes: data.notes || '',
      createdAt: data.created_at
    },
    error: null
  }
}
