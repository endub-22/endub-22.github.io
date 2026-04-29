# Board Night modular refactor plan

## Why refactor now

The current app lives mostly inside a single `index.html` file. That was useful for proving the idea quickly, but it is not a good structure for the next stage because the app now needs:

- Supabase authentication
- database reads and writes
- event detail views
- nested event polls
- attendance handling
- voting logic
- cleaner security boundaries

A modular structure will make the app easier to understand, safer to change, and easier to move into Codex or another development workflow.

## Recommended stack

Use a small Vite React app deployed to GitHub Pages.

Recommended:

- Vite
- React
- plain CSS modules or a small global CSS file to start
- Supabase JS client
- GitHub Pages deployment

This avoids overengineering while still moving away from the brittle single-file prototype.

## Proposed folder structure

```text
/
├─ index.html
├─ package.json
├─ vite.config.js
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ lib/
│  │  ├─ supabaseClient.js
│  │  └─ dates.js
│  ├─ services/
│  │  ├─ profilesService.js
│  │  ├─ gamesService.js
│  │  ├─ eventsService.js
│  │  └─ pollsService.js
│  ├─ components/
│  │  ├─ Layout.jsx
│  │  ├─ Header.jsx
│  │  ├─ StatCard.jsx
│  │  ├─ EmptyState.jsx
│  │  └─ Notice.jsx
│  ├─ features/
│  │  ├─ auth/
│  │  │  └─ AuthScreen.jsx
│  │  ├─ dashboard/
│  │  │  └─ Dashboard.jsx
│  │  ├─ games/
│  │  │  ├─ GamesPage.jsx
│  │  │  ├─ GameCard.jsx
│  │  │  └─ GameForm.jsx
│  │  └─ events/
│  │     ├─ EventsPage.jsx
│  │     ├─ EventCard.jsx
│  │     ├─ EventDetail.jsx
│  │     ├─ EventForm.jsx
│  │     └─ EventPoll.jsx
│  └─ styles/
│     └─ app.css
├─ supabase/
│  └─ schema.sql
└─ docs/
   └─ refactor-plan.md
```

## MVP route model

For now, keep routing simple with React state instead of adding React Router immediately.

Views:

- `dashboard`
- `games`
- `events`
- `event-detail`
- `account`

Polls are not a top-level view. A poll belongs inside an event detail screen.

## Data model in the UI

Event detail should be the core container:

```text
Event
├─ event details
├─ attendees
└─ poll
   ├─ options
   └─ votes
```

The standalone Polls nav item should be removed.

## Refactor phases

### Phase 1: Project structure

Create the Vite structure and move the existing app into modules without changing behaviour.

Goal: app still runs, but code is separated.

### Phase 2: Supabase client and auth module

Move Supabase setup into:

```text
src/lib/supabaseClient.js
src/features/auth/AuthScreen.jsx
```

Add profile upsert/insert support for existing auth users.

### Phase 3: Real game library

Replace mocked game state with Supabase reads and writes.

Tables:

- `games`
- `profiles`

### Phase 4: Real events

Replace mocked event state with Supabase reads and writes.

Tables:

- `events`
- `event_attendees`

### Phase 5: Event detail and nested poll

Remove standalone Polls page.

Add:

```text
src/features/events/EventDetail.jsx
src/features/events/EventPoll.jsx
```

Poll creation should only be visible to the event creator.

### Phase 6: Voting

Wire poll options and votes.

Tables:

- `polls`
- `poll_options`
- `poll_votes`

## Key design rule

Do not wire everything at once. First make the modular app behave exactly like the current prototype, then replace one feature at a time with real Supabase data.
