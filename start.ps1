# Simple PowerShell script to start Flask backend and React frontend in separate windows
# Save this as start-app-simple.ps1 in your project root directory

Write-Host "Starting Flask + React Application..." -ForegroundColor Green

# Start Flask backend in new PowerShell window
Write-Host "Starting Flask backend in new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python run.py"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start React frontend in new PowerShell window  
Write-Host "Starting React frontend in new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Both services are starting in separate windows!" -ForegroundColor Green
Write-Host "Close the individual PowerShell windows to stop each service." -ForegroundColor Yellow