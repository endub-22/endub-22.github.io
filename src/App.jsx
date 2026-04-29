import React, { useState, useEffect } from 'react'
import AppShell from './components/AppShell.jsx'
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

  if (checkingSession) return <div className="loading-screen">Checking login...</div>
  if (!session) return React.createElement(AuthScreen, { onLogin: s => setSession(s) })

  if (!currentGroup) {
    return (
      <AppShell userEmail={session.user.email} currentGroup={null} onLogout={logout}>
        <GroupsPage userId={session.user.id} onSelectGroup={setCurrentGroup} />
      </AppShell>
    )
  }

  return (
    <AppShell
      userEmail={session.user.email}
      currentGroup={currentGroup}
      onSwitchGroup={() => {
        setSelectedEvent(null)
        setCurrentGroup(null)
      }}
      onLogout={logout}
    >
      {!selectedEvent && (
        <nav className="tab-nav">
          <button className={view === 'events' ? 'active' : ''} onClick={() => setView('events')}>Events</button>
          <button className={view === 'games' ? 'active' : ''} onClick={() => setView('games')}>Games</button>
        </nav>
      )}

      {view === 'games' && !selectedEvent && <GamesPage userId={session.user.id} groupId={currentGroup.id} />}

      {view === 'events' && !selectedEvent && (
        <section className="content-stack">
          <EventForm userId={session.user.id} groupId={currentGroup.id} onCreated={e => setEvents(prev => [e, ...prev])} />
          {loading && <div className="empty-state">Loading events...</div>}
          {!loading && events.length === 0 && <div className="empty-state">No events yet.</div>}
          <div className="card-grid">
            {events.map(e => (
              <article className="card" key={e.id}>
                <h3>{e.title}</h3>
                <p>{e.date} at {e.time}</p>
                {e.location && <p>{e.location}</p>}
                <button className="btn primary" onClick={() => setSelectedEvent(e)}>Open event</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {selectedEvent && <EventDetail event={selectedEvent} onBack={() => setSelectedEvent(null)} />}
    </AppShell>
  )
}
