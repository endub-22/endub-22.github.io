import React, { useState } from 'react'

export default function App() {
  const [view, setView] = useState('dashboard')

  return (
    <div style={{padding:20}}>
      <h1>Board Night (Modular)</h1>
      <nav>
        <button onClick={() => setView('dashboard')}>Dashboard</button>
        <button onClick={() => setView('games')}>Games</button>
        <button onClick={() => setView('events')}>Events</button>
      </nav>

      <div style={{marginTop:20}}>
        {view === 'dashboard' && <div>Dashboard coming next</div>}
        {view === 'games' && <div>Games module coming next</div>}
        {view === 'events' && <div>Events module coming next</div>}
      </div>
    </div>
  )
}
