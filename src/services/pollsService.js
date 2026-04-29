import { supabase } from '../lib/supabaseClient.js'

export async function getPollForEvent(eventId) {
  const { data, error } = await supabase
    .from('polls')
    .select(`
      id,
      event_id,
      title,
      is_closed,
      closes_at,
      created_by,
      poll_options (
        id,
        game_id,
        games (
          id,
          title,
          min_players,
          max_players,
          play_time_minutes
        )
      ),
      poll_votes (
        poll_id,
        option_id,
        user_id
      )
    `)
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) return { data: null, error }
  if (!data) return { data: null, error: null }

  return { data: mapPoll(data), error: null }
}

export async function createPollForEvent({ eventId, title, gameIds, userId }) {
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .insert({
      event_id: eventId,
      title,
      created_by: userId
    })
    .select('id,event_id,title,is_closed,closes_at,created_by')
    .single()

  if (pollError) return { data: null, error: pollError }

  const optionRows = gameIds.map(gameId => ({
    poll_id: poll.id,
    game_id: gameId
  }))

  const { error: optionsError } = await supabase
    .from('poll_options')
    .insert(optionRows)

  if (optionsError) return { data: null, error: optionsError }

  return getPollForEvent(eventId)
}

export async function voteForOption({ pollId, optionId, userId }) {
  const { error } = await supabase
    .from('poll_votes')
    .upsert({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId
    }, { onConflict: 'poll_id,user_id' })

  if (error) return { error }
  return { error: null }
}

function mapPoll(poll) {
  const votes = poll.poll_votes || []

  return {
    id: poll.id,
    eventId: poll.event_id,
    title: poll.title,
    isClosed: poll.is_closed,
    closesAt: poll.closes_at,
    createdBy: poll.created_by,
    options: (poll.poll_options || []).map(option => ({
      id: option.id,
      gameId: option.game_id,
      game: option.games ? {
        id: option.games.id,
        title: option.games.title,
        minPlayers: option.games.min_players,
        maxPlayers: option.games.max_players,
        playTimeMinutes: option.games.play_time_minutes
      } : null,
      votes: votes.filter(vote => vote.option_id === option.id)
    }))
  }
}
