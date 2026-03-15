#!/bin/bash
# Simple HTTP server for local development
# Usage: ./serve.sh [port]

PORT=${1:-8000}

echo "Starting local server on port $PORT..."
echo "Open http://localhost:$PORT in your browser"
echo "Press Ctrl+C to stop"

# Try different HTTP servers in order of preference
if command -v npx >/dev/null 2>&1; then
    npx serve . -p $PORT
elif command -v python3 >/dev/null 2>&1; then
    python3 -m http.server $PORT
elif command -v python >/dev/null 2>&1; then
    python -m http.server $PORT
elif command -v php >/dev/null 2>&1; then
    php -S localhost:$PORT
else
    echo "Error: No suitable HTTP server found."
    echo "Please install one of: Node.js (npx), Python, or PHP"
    exit 1
fi