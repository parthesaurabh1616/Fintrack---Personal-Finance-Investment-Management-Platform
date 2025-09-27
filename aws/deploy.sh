#!/bin/bash

set -e

echo "🚀 Starting AWS Deployment for FinTrack Platform"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install AWS CLI and try again."
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform and try again."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Set variables
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "📍 AWS Region: $AWS_REGION"
echo "📍 AWS Account ID: $AWS_ACCOUNT_ID"
echo "📍 ECR Registry: $ECR_REGISTRY"

# Check if tfvars file exists
if [ ! -f "terraform.tfvars" ]; then
    echo "❌ terraform.tfvars file not found. Please copy terraform.tfvars.example and update it."
    exit 1
fi

# Initialize Terraform
echo "🔧 Initializing Terraform..."
cd terraform
terraform init

# Plan Terraform deployment
echo "📋 Planning Terraform deployment..."
terraform plan -var="aws_account_id=${AWS_ACCOUNT_ID}" -out=tfplan

# Apply Terraform
echo "🏗️ Applying Terraform configuration..."
terraform apply tfplan

# Get outputs
VPC_ID=$(terraform output -raw vpc_id)
PUBLIC_SUBNETS=$(terraform output -json public_subnet_ids | jq -r '.[]')
PRIVATE_SUBNETS=$(terraform output -json private_subnet_ids | jq -r '.[]')

echo "✅ Infrastructure deployed successfully!"

# Create ECR repositories
echo "📦 Creating ECR repositories..."
aws ecr create-repository --repository-name fintrack-backend --region $AWS_REGION || echo "Repository already exists"
aws ecr create-repository --repository-name fintrack-ml-service --region $AWS_REGION || echo "Repository already exists"
aws ecr create-repository --repository-name fintrack-frontend --region $AWS_REGION || echo "Repository already exists"

# Get login token for ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build and push Docker images
echo "🏗️ Building and pushing Docker images..."

# Backend
echo "📦 Building backend image..."
docker build -t fintrack-backend:latest ../backend
docker tag fintrack-backend:latest $ECR_REGISTRY/fintrack-backend:latest
docker push $ECR_REGISTRY/fintrack-backend:latest

# ML Service
echo "📦 Building ML service image..."
docker build -t fintrack-ml-service:latest ../ml-service
docker tag fintrack-ml-service:latest $ECR_REGISTRY/fintrack-ml-service:latest
docker push $ECR_REGISTRY/fintrack-ml-service:latest

# Frontend
echo "📦 Building frontend image..."
docker build -t fintrack-frontend:latest ../frontend
docker tag fintrack-frontend:latest $ECR_REGISTRY/fintrack-frontend:latest
docker push $ECR_REGISTRY/fintrack-frontend:latest

echo "✅ Docker images pushed to ECR!"

# Update ECS task definitions with latest images
echo "🔄 Updating ECS task definitions..."
terraform apply -auto-approve -var="aws_account_id=${AWS_ACCOUNT_ID}"

echo "🎉 AWS deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  VPC ID: $VPC_ID"
echo "  Public Subnets: $PUBLIC_SUBNETS"
echo "  Private Subnets: $PRIVATE_SUBNETS"
echo "  ECR Registry: $ECR_REGISTRY"
echo ""
echo "🔗 Next steps:"
echo "  1. Configure your domain DNS to point to the load balancer"
echo "  2. Set up SSL certificates in ACM"
echo "  3. Configure monitoring and alerting"
echo "  4. Run database migrations"
