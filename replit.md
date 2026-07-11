# Book Tracker

A personal iOS mobile app for tracking books across three lists: Want to Read, Currently Reading, and Finished.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo app
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native)
- Storage: AsyncStorage (on-device, no server required)

## Architecture

All data is stored locally on the device via AsyncStorage. No backend, no database, no internet connection required (except for book cover search via OpenLibrary).

### Branches
- `main` — current version, fully local/offline
- `server-version` — older version with Express API + PostgreSQL

## Where things live

- `artifacts/mobile` — Expo app
- `artifacts/mobile/context/BooksContext.tsx` — all book CRUD, reads/writes AsyncStorage
- `artifacts/mobile/hooks/useTutorialStep.ts` — tutorial step state, also in AsyncStorage

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- No server or DATABASE_URL needed — everything runs on the device
- Tutorial key prefix must be bumped (`@tutorial_vN:`) to reset the tutorial for all users
