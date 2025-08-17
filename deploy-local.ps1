# Local Deployment Script for Lab Tracker
# This script sets up the application for local deployment

Write-Host "Setting up Lab Tracker for local deployment..." -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is available
try {
    docker-compose --version | Out-Null
    Write-Host "Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "Docker Compose is not available. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Generate secure secret key
Write-Host "Generating secure secret key..." -ForegroundColor Cyan
$secretKey = python -c "import secrets; print(secrets.token_hex(32))" 2>$null
if (-not $secretKey) {
    $secretKey = "your-secure-secret-key-change-this-in-production"
    Write-Host "Warning: Could not generate secret key, using default" -ForegroundColor Yellow
}

# Create .env file for local deployment
Write-Host "Creating environment configuration..." -ForegroundColor Cyan
$envContent = @"
# Local Deployment Environment Variables
FLASK_ENV=production
SECRET_KEY=$secretKey
DATABASE_URL=sqlite:///lab_tracker_prod.db
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
VITE_API_URL=http://localhost:5000
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "Environment file created: .env" -ForegroundColor Green

# Build and start the application
Write-Host "Building and starting the application..." -ForegroundColor Cyan
Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow

docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your application is now running at:" -ForegroundColor White
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Backend API: http://localhost:5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Yellow
    Write-Host "  View logs: docker-compose logs -f" -ForegroundColor White
    Write-Host "  Stop services: docker-compose down" -ForegroundColor White
    Write-Host "  Restart services: docker-compose restart" -ForegroundColor White
    Write-Host "  Update application: docker-compose up --build -d" -ForegroundColor White
} else {
    Write-Host "Deployment failed. Check the logs above for errors." -ForegroundColor Red
    exit 1
}


