import { supabase } from '../lib/supabaseClient.js'

export async function listGames() {
  const { data, error } = await supabase
    .from('games')
    .select('id,title,min_players,max_players,play_time_minutes,owner_id,notes,created_at')
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
      notes: g.notes || '',
      createdAt: g.created_at
    })),
    error: null
  }
}

export async function createGame({ title, minPlayers, maxPlayers, playTimeMinutes, notes, userId }) {
  const { data, error } = await supabase
    .from('games')
    .insert({
      title,
      min_players: minPlayers,
      max_players: maxPlayers,
      play_time_minutes: playTimeMinutes,
      notes,
      owner_id: userId
    })
    .select('id,title,min_players,max_players,play_time_minutes,owner_id,notes,created_at')
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
      notes: data.notes || '',
      createdAt: data.created_at
    },
    error: null
  }
}
