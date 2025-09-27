#!/bin/bash

set -e

echo "🚀 Starting FinTrack Platform Deployment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl and try again."
    exit 1
fi

# Create namespace
echo "📦 Creating Kubernetes namespace..."
kubectl apply -f k8s/namespace.yaml

# Apply secrets and configmaps
echo "🔐 Applying secrets and configmaps..."
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml

# Deploy database services
echo "🗄️ Deploying database services..."
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n fintrack
kubectl wait --for=condition=available --timeout=300s deployment/redis -n fintrack

# Build and push Docker images (in production, these would be pushed to a registry)
echo "🏗️ Building Docker images..."
docker build -t fintrack/backend:latest ./backend
docker build -t fintrack/ml-service:latest ./ml-service
docker build -t fintrack/frontend:latest ./frontend

# Deploy application services
echo "🚀 Deploying application services..."
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/ml-service.yaml
kubectl apply -f k8s/frontend.yaml

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backend -n fintrack
kubectl wait --for=condition=available --timeout=300s deployment/ml-service -n fintrack
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n fintrack

# Apply ingress
echo "🌐 Applying ingress configuration..."
kubectl apply -f k8s/ingress.yaml

# Run database migrations
echo "🔄 Running database migrations..."
kubectl exec -it deployment/backend -n fintrack -- npm run migrate

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
kubectl get pods -n fintrack
echo ""
echo "🌐 Services:"
kubectl get services -n fintrack
echo ""
echo "🔗 Access URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8080"
echo "  ML Service: http://localhost:8001"
echo "  Grafana: http://localhost:3001"
echo "  Prometheus: http://localhost:9090"
