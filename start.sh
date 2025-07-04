#!/bin/bash

echo "🎨 CMS Dashboard Client"
echo "======================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating one with default values..."
    echo "REACT_APP_API_URL=http://localhost:3000" > .env
    echo "✅ Created .env file pointing to http://localhost:3000"
    echo ""
fi

# Display current API URL
API_URL=$(grep REACT_APP_API_URL .env | cut -d '=' -f2)
echo "🔗 API URL: $API_URL"
echo ""

# Check if API is running
echo "🔍 Checking if CMS API is accessible..."
if curl -s --head --request GET "$API_URL/health" | grep "200" > /dev/null; then 
    echo "✅ CMS API is running at $API_URL"
else
    echo "⚠️  Warning: Cannot reach CMS API at $API_URL"
    echo "   Make sure the CMS is running before using the dashboard."
fi

echo ""
echo "🚀 Starting CMS Dashboard..."
echo "   The dashboard will open at http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the client
npm start
