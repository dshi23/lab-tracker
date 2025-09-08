# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Flask)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python create_tables.py  # Setup database and create admin user
python app.py  # Run development server on port 5000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev     # Development server on port 5173
npm run build   # Production build
npm run lint    # ESLint checking
```

### Quick Setup Scripts
- `start.ps1` - Opens backend and frontend dev servers in separate windows
- `deploy-local.ps1` - Builds and runs Dockerized frontend/backend

### Database Management
- `python create_tables.py` - Creates all tables and default admin user
- Flask-Migrate is configured but not actively used in development

### Excel Import/Export
- **Storage Import**: `/api/storage/import` - Import storage items with 类型, 产品名, 品牌, 数量及数量单位, 存放地, CAS号
- **Storage Export**: `/api/storage/export` - Export all storage items to Excel
- **Storage Template**: `/api/storage/template` - Download template file for imports
- **Records Import**: `/api/import` - Import usage records with Chinese field names
- **Records Export**: `/api/export` - Export usage records to Excel
- **Records Template**: `/api/template` - Download template for usage records
- Supported formats: `.xlsx`, `.xls`, `.csv`
- Automatic column mapping for English/Chinese headers

## Architecture Overview

### Backend Structure
- **Flask Application Factory Pattern**: Main app creation in `app.py` with modular configuration
- **Authentication System**: Flask-Login + Flask-Bcrypt with session-based auth
- **Database Models** (`models.py`):
  - `User` - Authentication with Flask-Login integration
  - `Personnel` - User profile information linked to users
  - `Storage` - Inventory items with Chinese field names (类型, 产品名, etc.)
  - `UsageRecord` - Usage tracking with automatic inventory updates
- **API Routes**: Organized in `routes/` directory with blueprints
- **Storage Service**: Handles inventory management and Excel import/export

### Frontend Structure
- **React 18 + Vite**: Modern build tooling with hot reload
- **React Router v6**: Client-side routing
- **React Query v3**: Server state management and caching
- **Tailwind CSS**: Utility-first styling framework
- **PWA Support**: Service worker registration in `main.jsx`
- **Authentication Context**: `useAuth.jsx` hook for auth state management
- **Axios API Layer**: Centralized API calls in `services/api.js` with interceptors

### Key Features
- **Bilingual Interface**: Chinese field names in database, mixed CN/EN in UI
- **Inventory Management**: Storage items with unit conversion and stock tracking
- **Excel Integration**: Import/export with templates for bulk operations
- **Usage Tracking**: Automatic inventory updates when items are used
- **Authentication**: Session-based login with default admin account
- **Mobile-First**: Responsive design with PWA capabilities

### Database Schema Notes
- Uses Chinese field names for domain objects (产品名, 使用人, etc.)
- Storage quantities stored in grams with unit conversion
- Usage records linked to both storage items and users
- Indexes on commonly queried fields (类型, 产品名, CAS号)

### Default Credentials
- Username: `admin`
- Password: `admin123`
- Department: 实验室管理
- Role: 管理员

### API Patterns
- RESTful endpoints under `/api/`
- Authentication required for most endpoints
- Excel operations have dedicated endpoints (`/import`, `/export`, `/template`)
- Usage operations update inventory automatically via `/api/storage/{id}/use`

### Development Notes
- Backend runs on port 5000, frontend on 5173
- CORS configured for development
- Rate limiting enabled (2000/day, 500/hour)
- Request/response logging in development mode
- Chinese text throughout codebase requires UTF-8 handling