import { supabase } from '../lib/supabaseClient.js'

export async function listAttendance(eventId) {
  const { data, error } = await supabase
    .from('event_attendees')
    .select(`
      event_id,
      user_id,
      status,
      profiles (
        id,
        username,
        email
      )
    `)
    .eq('event_id', eventId)
    .eq('status', 'attending')

  if (error) return { data: [], error }

  return {
    data: data.map(row => ({
      eventId: row.event_id,
      userId: row.user_id,
      status: row.status,
      username: row.profiles?.username || row.profiles?.email || 'Player',
      email: row.profiles?.email || ''
    })),
    error: null
  }
}

export async function setAttendance({ eventId, userId, attending }) {
  if (attending) {
    const { error } = await supabase
      .from('event_attendees')
      .upsert({
        event_id: eventId,
        user_id: userId,
        status: 'attending'
      }, { onConflict: 'event_id,user_id' })

    return { error }
  }

  const { error } = await supabase
    .from('event_attendees')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)

  return { error }
}
