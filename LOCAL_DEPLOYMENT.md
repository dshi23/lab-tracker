# Local Deployment Guide for Lab Tracker

This guide covers multiple options for deploying your Lab Tracker application on a local machine.

## Option 1: Docker Deployment (Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- At least 4GB RAM available

### Quick Start
1. **Run the deployment script:**
   ```powershell
   .\deploy-local.ps1
   ```

2. **Access your application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Manual Docker Setup
```powershell
# Build and start services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Option 2: Traditional Local Deployment

### Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
$env:FLASK_ENV = "development"
python run.py
```

### Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```

## Environment Configuration

### Backend Environment Variables
```
FLASK_ENV=development
SECRET_KEY=your-secure-secret-key
DATABASE_URL=sqlite:///lab_tracker_dev.db
CORS_ORIGINS=http://localhost:5174
```

### Frontend Environment Variables
```
VITE_API_URL=http://localhost:5000
```

## Security Considerations

1. **Firewall Configuration:**
   - Only allow necessary ports (5174, 5000)
   - Restrict access to local network if needed

2. **Environment Variables:**
   - Never commit secrets to version control
   - Use `.env` files for local development

## Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```powershell
   netstat -ano | findstr :5000
   taskkill /PID <process_id> /F
   ```

2. **Permission Issues:**
   - Run as administrator if needed

3. **Database Locked:**
   ```powershell
   docker-compose down
   Remove-Item "backend/instance/lab_tracker_prod.db"
   ```

## Useful Commands

```powershell
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update application
docker-compose up --build -d

# Check service status
docker-compose ps
```
