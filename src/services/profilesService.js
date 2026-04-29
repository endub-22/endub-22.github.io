import { supabase } from '../lib/supabaseClient.js'

export async function ensureProfile(user) {
  if (!supabase || !user) return { data: null, error: null }

  const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Player'

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      username,
      email: user.email || null
    }, { onConflict: 'id' })
    .select('id,username,email')
    .single()

  return { data, error }
}
