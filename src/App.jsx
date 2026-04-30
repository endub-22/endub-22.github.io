import React, { useState, useEffect } from 'react'
import AppShell from './components/AppShell.jsx'
import EventDetail from './features/events/EventDetail.jsx'
import EventForm from './features/events/EventForm.jsx'
import GamesPage from './features/games/GamesPage.jsx'
import GroupsPage from './features/groups/GroupsPage.jsx'
import AdminPanel from './features/groups/AdminPanel.jsx'
import UserSettings from './features/user/UserSettings.jsx'
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
  const [isAdmin, setIsAdmin] = useState(false)

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
    if (session && currentGroup) {
      loadEvents()
      checkRole()
    }
  }, [session, currentGroup])

  async function checkRole() {
    const { data } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', currentGroup.id)
      .eq('user_id', session.user.id)
      .single()

    setIsAdmin(data?.role === 'admin')
  }

  async function loadEvents() {
    setLoading(true)
    const { data } = await listEvents()

    const filtered = data.filter(e => {
      const gid = e.groupId || e.group_id
      return gid === currentGroup.id
    })

    setEvents(filtered)
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setCurrentGroup(null)
  }

  if (checkingSession) return <div>Checking login...</div>
  if (!session) return <AuthScreen onLogin={s => setSession(s)} />

  if (view === 'settings') {
    return (
      <AppShell userEmail={session.user.email} currentGroup={currentGroup} onLogout={logout}>
        <UserSettings />
      </AppShell>
    )
  }

  if (!currentGroup) {
    return (
      <AppShell userEmail={session.user.email} currentGroup={null} onLogout={logout}>
        <button onClick={() => setView('settings')}>User Settings</button>
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
      <nav>
        <button onClick={() => setView('events')}>Events</button>
        <button onClick={() => setView('games')}>Games</button>
        {isAdmin && <button onClick={() => setView('admin')}>Admin</button>}
        <button onClick={() => setView('settings')}>User</button>
      </nav>

      {view === 'games' && <GamesPage userId={session.user.id} groupId={currentGroup.id} />}

      {view === 'events' && (
        <>
          <EventForm userId={session.user.id} groupId={currentGroup.id} onCreated={e => setEvents(prev => [e, ...prev])} />

          <div>
            {loading && <div>Loading events...</div>}
            {!loading && events.length === 0 && <div>No events yet.</div>}

            {events.map(e => (
              <div key={e.id} onClick={() => setSelectedEvent(e)} style={{cursor:'pointer', marginBottom:10}}>
                <strong>{e.title}</strong>
                <div>{e.date} at {e.time}</div>
              </div>
            ))}
          </div>

          {selectedEvent && (
            <EventDetail event={selectedEvent} onBack={() => setSelectedEvent(null)} />
          )}
        </>
      )}

      {view === 'admin' && isAdmin && <AdminPanel groupId={currentGroup.id} />}

    </AppShell>
  )
}
