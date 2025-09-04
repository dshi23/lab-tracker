# Lab Tracker

Inventory, storage, and records management for labs. Full‑stack app with a Flask API and a React (Vite + Tailwind) frontend. Supports Excel import/export, user authentication, and a mobile‑friendly UI.

## Key Features

- **User Authentication System**: Secure login/register with personnel management
- Storage and records CRUD with unit consistency
- Excel import/export and downloadable template
- Personnel information automatically filled in usage forms
- PWA setup, mobile‑friendly UI

## Authentication

The system now includes a complete user authentication system:

- **User Registration**: Create accounts with personnel information
- **User Login**: Secure authentication with session management
- **Personnel Management**: Store and manage user details (name, department, role, etc.)
- **Auto-fill**: Personnel information automatically populated in usage forms
- **Profile Management**: Users can update their personal information and change passwords

### Default Admin Account
- Username: `admin`
- Password: `admin123`
- Department: 实验室管理
- Role: 管理员

## API Overview

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- POST `/api/auth/register` - User registration
- GET `/api/auth/profile` - Get user profile
- PUT `/api/auth/profile` - Update user profile
- POST `/api/auth/change-password` - Change password
- GET `/api/auth/check` - Check authentication status

### Storage
- GET/POST `/api/storage`
- GET/PUT/DELETE `/api/storage/{id}`
- POST `/api/storage/{id}/use` (create usage and update inventory)
- GET `/api/storage/template`, GET `/api/storage/export`, POST `/api/storage/import`

### Records
- GET `/api/records`, GET/PUT/DELETE `/api/records/{id}`

## Excel Import/Export

- Template file: `backend/uploads/storage_template.xlsx`
- Import via endpoint or the UI Import page

## Database Setup

To set up the database with authentication:

```bash
cd backend
python create_tables.py
```

This will create all necessary tables and add a default admin user.

## Scripts

- `deploy-local.ps1`: builds and runs Dockerized frontend/backend
- `start.ps1`: opens backend and frontend dev servers in separate windows
- `create_tables.py`: creates database tables and sample data

## Troubleshooting

See `LOCAL_DEPLOYMENT.md` for common issues (ports, Docker, DB locks) and handy commands.

## Recent Changes

- ✅ Added complete user authentication system
- ✅ Removed analytics functionality and related tabs
- ✅ Changed settings to personal information management
- ✅ Removed "记录使用" tab from navigation
- ✅ Personnel information automatically filled in usage forms
- ✅ Added user profile and password management
- ✅ Secure session-based authentication
