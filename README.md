# 🎲 Board Game Night App

A lightweight web app for organising board game nights with friends.
Built with React and Supabase, featuring group-based access control, event management, and game voting.

## 🚀 Features

### 👥 User & Auth
- Email/password authentication
- Sign up, login, password reset
- Change password

### 🧑‍🤝‍🧑 Groups
- Create and join groups
- Multi-group support
- Roles: member / admin

### 📅 Events
- Create events per group
- Attendance tracking

### 🎲 Games
- Group-scoped game library
- Add games with metadata

### 🗳️ Polls
- Create polls per event
- Vote on games

### 🛠️ Admin
- Remove users
- Promote/demote admins
- Delete resources

## 🧱 Tech Stack
- React (Vite)
- Supabase (Auth + Postgres + RLS)

## ⚙️ Setup

```
npm install
npm run dev
```

Add env:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## 🧠 Notes
- All data is group-scoped
- RLS enforces security
- Services map DB → UI
