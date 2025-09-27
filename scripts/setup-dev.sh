#!/bin/bash

set -e

echo "🔧 Setting up FinTrack Development Environment"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup backend
echo "🔧 Setting up backend..."
cd backend
npm install
npx prisma generate
cd ..

# Setup frontend
echo "🔧 Setting up frontend..."
cd frontend
npm install
cd ..

# Setup ML service
echo "🔧 Setting up ML service..."
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p backend/logs

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🔄 Running database migrations..."
cd backend
npx prisma migrate dev --name init
cd ..

echo "✅ Development environment setup completed!"
echo ""
echo "🚀 To start the development servers:"
echo "  npm run dev"
echo ""
echo "📊 To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "🗄️ To access database:"
echo "  npx prisma studio"
