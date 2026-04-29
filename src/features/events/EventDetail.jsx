import React from 'react'

export default function EventDetail({ event, onBack }) {
  if (!event) return null

  return (
    <div>
      <button onClick={onBack}>← Back to events</button>

      <h2>{event.title}</h2>
      <p>{event.date} at {event.time}</p>
      <p>{event.location}</p>
      <p>{event.notes}</p>

      <h3>Attendees</h3>
      <ul>
        {event.attendees?.map(a => <li key={a}>{a}</li>)}
      </ul>

      <h3>Poll</h3>
      <div>
        <p>No poll yet for this event.</p>
        <button>Create poll</button>
      </div>
    </div>
  )
}
