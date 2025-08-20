#!/bin/bash

echo "🔄 Restarting Node.js server on port 3000..."

# Kill any existing Node.js processes on port 3000
echo "🛑 Killing existing Node.js processes on port 3000..."
lsof -ti:3000 -c node | xargs kill -9 2>/dev/null || echo "No Node.js processes found on port 3000"

# Wait a moment for processes to fully terminate
sleep 1

# Start the development server
echo "🚀 Starting development server..."
pnpm exec next dev --turbopack
