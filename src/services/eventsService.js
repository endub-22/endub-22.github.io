import { supabase } from '../lib/supabaseClient.js'

export async function listEvents() {
  if (!supabase) return { data: [], error: new Error('Supabase is not configured') }

  const { data, error } = await supabase
    .from('events')
    .select('id,title,event_date,event_time,location,notes,created_by,created_at,group_id')
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true })

  if (error) return { data: [], error }

  return {
    data: data.map(event => ({
      id: event.id,
      title: event.title,
      date: event.event_date,
      time: event.event_time?.slice(0, 5),
      location: event.location || '',
      notes: event.notes || '',
      createdBy: event.created_by,
      createdAt: event.created_at,
      groupId: event.group_id,
      attendees: []
    })),
    error: null
  }
}

export async function createEvent({ title, date, time, location, notes, userId, groupId }) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') }

  const { data, error } = await supabase
    .from('events')
    .insert({
      title,
      event_date: date,
      event_time: time,
      location,
      notes,
      created_by: userId,
      group_id: groupId
    })
    .select('id,title,event_date,event_time,location,notes,created_by,created_at,group_id')
    .single()

  if (error) return { data: null, error }

  return {
    data: {
      id: data.id,
      title: data.title,
      date: data.event_date,
      time: data.event_time?.slice(0, 5),
      location: data.location || '',
      notes: data.notes || '',
      createdBy: data.created_by,
      createdAt: data.created_at,
      groupId: data.group_id,
      attendees: []
    },
    error: null
  }
}
