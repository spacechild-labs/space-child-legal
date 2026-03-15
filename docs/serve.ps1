# PowerShell script to serve the docs locally
# Usage: .\serve.ps1 [port]

param(
    [int]$Port = 8000
)

Write-Host "Starting local server on port $Port..." -ForegroundColor Green
Write-Host "Open http://localhost:$Port in your browser" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Try different HTTP servers in order of preference
if (Get-Command npx -ErrorAction SilentlyContinue) {
    Write-Host "Using npx serve..." -ForegroundColor Blue
    npx serve . -p $Port
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Using Python HTTP server..." -ForegroundColor Blue
    python -m http.server $Port
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    Write-Host "Using Python3 HTTP server..." -ForegroundColor Blue
    python3 -m http.server $Port
} else {
    Write-Host "Error: No suitable HTTP server found." -ForegroundColor Red
    Write-Host "Please install Node.js (for npx) or Python to run a local server." -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Open index.html directly in your browser, but some features may not work due to CORS restrictions." -ForegroundColor Yellow
    exit 1
}