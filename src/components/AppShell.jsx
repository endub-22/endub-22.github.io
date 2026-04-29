import React from 'react'

export default function AppShell({ userEmail, currentGroup, onSwitchGroup, onLogout, children }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand-block">
          <div className="brand-mark">🎲</div>
          <div>
            <h1>Board Night</h1>
            <p>{currentGroup ? currentGroup.name : 'Choose your game group'}</p>
          </div>
        </div>

        <div className="header-actions">
          {userEmail && <span className="user-pill">{userEmail}</span>}
          {currentGroup && <button className="btn ghost" onClick={onSwitchGroup}>Switch group</button>}
          <button className="btn danger" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <main className="page-wrap">
        {children}
      </main>
    </div>
  )
}
