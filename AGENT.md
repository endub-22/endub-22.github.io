# Agent Helper

## Purpose
Quick context snapshot for continuing development sessions.

## Core Model
Group → Event → Poll
Group → Games
Group → Members (roles)

## Key Rules
- ALWAYS scope by group_id
- NEVER query without group filter
- UI uses camelCase
- DB uses snake_case

## Critical Patterns
- event.groupId || event.group_id
- listGames(groupId)
- filter events by group

## RLS Notes
- Inserts fail if group_id missing
- Membership required for access
- Admin role required for management actions

## Common Bugs
- group_id undefined
- mismatched casing
- missing useEffect dependencies

## Dev Guidance
- Pass groupId everywhere
- Map DB fields in services
- Avoid raw DB objects in UI

## Current State
- Auth working
- Groups working
- Events, games, polls scoped correctly
- Admin UI implemented

## Next Priorities
- Invite system
- Super admin tools
- UI polish
