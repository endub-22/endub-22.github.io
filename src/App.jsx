import React, { useState } from 'react'
import EventDetail from './features/events/EventDetail.jsx'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [selectedEvent, setSelectedEvent] = useState(null)

  const mockEvents = [
    { id: 1, title: 'Friday Game Night', date: '2026-05-01', time: '19:00', location: 'Nicks place', notes: 'Bring snacks', attendees: ['Nick','Sam'] }
  ]

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
            {mockEvents.map(e => (
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
