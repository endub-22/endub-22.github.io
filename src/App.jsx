import React, { useState, useEffect } from 'react'
import EventDetail from './features/events/EventDetail.jsx'
import { listEvents } from './services/eventsService.js'
import { supabase } from './lib/supabaseClient.js'
import AuthScreen from './features/auth/AuthScreen.jsx'
import { ensureProfile } from './services/profilesService.js'

export default function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [view, setView] = useState('dashboard')
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
    if (session) loadEvents()
  }, [session])

  async function loadEvents() {
    setLoading(true)
    const { data, error } = await listEvents()
    if (!error) setEvents(data)
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setEvents([])
    setView('dashboard')
  }

  if (checkingSession) {
    return <div style={{padding:20}}>Checking login...</div>
  }

  if (!session) {
    return React.createElement(AuthScreen, { onLogin: function(s) { setSession(s) } })
  }

  return (
    <div style={{padding:20}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:20}}>
        <div>
          <h1>Board Night</h1>
          <small>Logged in as {session.user.email}</small>
        </div>
        <button onClick={logout}>Log out</button>
      </div>

      {view !== 'event-detail' && (
        <nav style={{marginTop:20}}>
          <button onClick={() => setView('dashboard')}>Dashboard</button>
          <button onClick={() => setView('games')}>Games</button>
          <button onClick={() => setView('events')}>Events</button>
        </nav>
      )}

      <div style={{marginTop:20}}>
        {view === 'dashboard' && <div>Dashboard coming next</div>}

        {view === 'games' && <div>Games module coming next</div>}

        {view === 'events' && (
          <div>
            <h2>Events</h2>

            {loading && <div>Loading events...</div>}

            {!loading && events.length === 0 && (
              <div>No events yet.</div>
            )}

            {events.map(e => (
              <div key={e.id}>
                <strong>{e.title}</strong>
                <button onClick={() => {
                  setSelectedEvent(e)
                  setView('event-detail')
                }}>Open</button>
              </div>
            ))}
          </div>
        )}

        {view === 'event-detail' && (
          <EventDetail event={selectedEvent} onBack={() => setView('events')} />
        )}
      </div>
    </div>
  )
}
