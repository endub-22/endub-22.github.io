import React, { useState, useEffect } from 'react'
import EventDetail from './features/events/EventDetail.jsx'
import EventForm from './features/events/EventForm.jsx'
import GamesPage from './features/games/GamesPage.jsx'
import GroupsPage from './features/groups/GroupsPage.jsx'
import { listEvents } from './services/eventsService.js'
import { supabase } from './lib/supabaseClient.js'
import AuthScreen from './features/auth/AuthScreen.jsx'
import { ensureProfile } from './services/profilesService.js'

export default function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [currentGroup, setCurrentGroup] = useState(null)
  const [view, setView] = useState('groups')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session && data.session.user) ensureProfile(data.session.user)
      setCheckingSession(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(function(_e, session) {
      setSession(session)
      if (session && session.user) ensureProfile(session.user)
    })

    return function() {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session && currentGroup) loadEvents()
  }, [session, currentGroup])

  async function loadEvents() {
    setLoading(true)
    const { data } = await listEvents()
    setEvents(data.filter(e => e.groupId === currentGroup.id))
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setCurrentGroup(null)
  }

  if (checkingSession) return <div>Checking login...</div>
  if (!session) return React.createElement(AuthScreen, { onLogin: s => setSession(s) })

  if (!currentGroup) {
    return <GroupsPage userId={session.user.id} onSelectGroup={setCurrentGroup} />
  }

  return (
    <div style={{padding:20}}>
      <h1>{currentGroup.name}</h1>
      <button onClick={() => setCurrentGroup(null)}>Switch Group</button>
      <button onClick={logout}>Logout</button>

      <nav>
        <button onClick={() => setView('events')}>Events</button>
        <button onClick={() => setView('games')}>Games</button>
      </nav>

      {view === 'games' && <GamesPage userId={session.user.id} groupId={currentGroup.id} />}

      {view === 'events' && (
        <div>
          <EventForm userId={session.user.id} groupId={currentGroup.id} onCreated={e => setEvents(prev => [e, ...prev])} />
          {events.map(e => (
            <div key={e.id}>
              {e.title}
              <button onClick={() => setSelectedEvent(e)}>Open</button>
            </div>
          ))}
        </div>
      )}

      {selectedEvent && <EventDetail event={selectedEvent} onBack={() => setSelectedEvent(null)} />}
    </div>
  )
}
