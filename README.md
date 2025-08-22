# Lab Tracker

Inventory, storage, and records management for labs. Full‑stack app with a Flask API and a React (Vite + Tailwind) frontend. Supports Excel import/export, analytics, and a mobile‑friendly UI.


## Key Features

- Storage and records CRUD with unit consistency
- Excel import/export and downloadable template
- Analytics (dashboard, trends, personnel)
- PWA setup, mobile‑friendly UI

## API Overview

Storage

- GET/POST `/api/storage`
- GET/PUT/DELETE `/api/storage/{id}`
- POST `/api/storage/{id}/use` (create usage and update inventory)
- GET `/api/storage/template`, GET `/api/storage/export`, POST `/api/storage/import`

Records

- GET `/api/records`, GET/PUT/DELETE `/api/records/{id}`

Analytics

- GET `/api/analytics/dashboard`, `/api/analytics/personnel`, `/api/analytics/trends`

## Excel Import/Export

- Template file: `backend/uploads/storage_template.xlsx`
- Import via endpoint or the UI Import page

## Scripts

- `deploy-local.ps1`: builds and runs Dockerized frontend/backend
- `start.ps1`: opens backend and frontend dev servers in separate windows

## Troubleshooting

See `LOCAL_DEPLOYMENT.md` for common issues (ports, Docker, DB locks) and handy commands.
