import { supabase } from '../lib/supabaseClient.js'

export async function listMyGroups() {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      role,
      game_groups (
        id,
        name,
        invite_code,
        created_by,
        created_at
      )
    `)
    .order('created_at', { ascending: true })

  if (error) return { data: [], error }

  return {
    data: data
      .filter(row => row.game_groups)
      .map(row => ({
        id: row.game_groups.id,
        name: row.game_groups.name,
        inviteCode: row.game_groups.invite_code,
        createdBy: row.game_groups.created_by,
        createdAt: row.game_groups.created_at,
        role: row.role
      })),
    error: null
  }
}

export async function createGroup({ name, userId }) {
  const { data, error } = await supabase
    .from('game_groups')
    .insert({
      name,
      created_by: userId
    })
    .select('id,name,invite_code,created_by,created_at')
    .single()

  if (error) return { data: null, error }

  return {
    data: {
      id: data.id,
      name: data.name,
      inviteCode: data.invite_code,
      createdBy: data.created_by,
      createdAt: data.created_at,
      role: 'admin'
    },
    error: null
  }
}

export async function joinGroupByCode(code) {
  const { data, error } = await supabase.rpc('join_group_with_code', {
    join_code: code
  })

  if (error) return { data: null, error }
  return { data, error: null }
}
