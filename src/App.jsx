import React, { useState, useEffect } from 'react'
import EventDetail from './features/events/EventDetail.jsx'
import { listEvents } from './services/eventsService.js'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    const { data, error } = await listEvents()
    if (!error) setEvents(data)
    setLoading(false)
  }

  return (
    <div style={{padding:20}}>
      <h1>Board Night (Modular)</h1>

      {view !== 'event-detail' && (
        <nav>
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
              <div>No events yet. Create one in Supabase or next step we’ll add UI.</div>
            )}

            {events.map(e => (
              <div key={e.id} style={{marginBottom:10}}>
                <strong>{e.title}</strong>
                <button onClick={() => {
                  setSelectedEvent(e)
                  setView('event-detail')
                }} style={{marginLeft:10}}>Open</button>
              </div>
            ))}
          </div>
        )}

        {view === 'event-detail' && (
          <EventDetail
            event={selectedEvent}
            onBack={() => setView('events')}
          />
        )}
      </div>
    </div>
  )
}
