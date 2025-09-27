terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "fintrack_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "fintrack-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "fintrack_igw" {
  vpc_id = aws_vpc.fintrack_vpc.id

  tags = {
    Name = "fintrack-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public_subnets" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.fintrack_vpc.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "fintrack-public-subnet-${count.index + 1}"
  }
}

# Private Subnets
resource "aws_subnet" "private_subnets" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.fintrack_vpc.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "fintrack-private-subnet-${count.index + 1}"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.fintrack_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.fintrack_igw.id
  }

  tags = {
    Name = "fintrack-public-rt"
  }
}

# Route Table Association for Public Subnets
resource "aws_route_table_association" "public_rta" {
  count = length(aws_subnet.public_subnets)

  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# Security Groups
resource "aws_security_group" "fintrack_alb_sg" {
  name_prefix = "fintrack-alb-sg"
  vpc_id      = aws_vpc.fintrack_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "fintrack-alb-sg"
  }
}

resource "aws_security_group" "fintrack_ecs_sg" {
  name_prefix = "fintrack-ecs-sg"
  vpc_id      = aws_vpc.fintrack_vpc.id

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.fintrack_alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "fintrack-ecs-sg"
  }
}

resource "aws_security_group" "fintrack_rds_sg" {
  name_prefix = "fintrack-rds-sg"
  vpc_id      = aws_vpc.fintrack_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.fintrack_ecs_sg.id]
  }

  tags = {
    Name = "fintrack-rds-sg"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "fintrack_db_subnet_group" {
  name       = "fintrack-db-subnet-group"
  subnet_ids = aws_subnet.private_subnets[*].id

  tags = {
    Name = "fintrack-db-subnet-group"
  }
}

# RDS Instance
resource "aws_db_instance" "fintrack_db" {
  identifier = "fintrack-db"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "fintrack"
  username = "fintrack_user"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.fintrack_rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.fintrack_db_subnet_group.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = {
    Name = "fintrack-db"
  }
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "fintrack_cache_subnet_group" {
  name       = "fintrack-cache-subnet-group"
  subnet_ids = aws_subnet.private_subnets[*].id
}

# ElastiCache Redis Cluster
resource "aws_elasticache_replication_group" "fintrack_redis" {
  replication_group_id         = "fintrack-redis"
  description                  = "Redis cluster for FinTrack"
  
  node_type            = "cache.t3.micro"
  port                 = 6379
  parameter_group_name = "default.redis7"
  
  num_cache_clusters = 2
  
  subnet_group_name  = aws_elasticache_subnet_group.fintrack_cache_subnet_group.name
  security_group_ids = [aws_security_group.fintrack_ecs_sg.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token
  
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  tags = {
    Name = "fintrack-redis"
  }
}

# S3 Bucket for file storage
resource "aws_s3_bucket" "fintrack_storage" {
  bucket = var.s3_bucket_name

  tags = {
    Name = "fintrack-storage"
  }
}

resource "aws_s3_bucket_versioning" "fintrack_storage_versioning" {
  bucket = aws_s3_bucket.fintrack_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "fintrack_storage_encryption" {
  bucket = aws_s3_bucket.fintrack_storage.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "fintrack_cluster" {
  name = "fintrack-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "fintrack-cluster"
  }
}

# ECS Task Definition for Backend
resource "aws_ecs_task_definition" "fintrack_backend" {
  family                   = "fintrack-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "fintrack-backend"
      image = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/fintrack-backend:latest"
      
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "DATABASE_URL"
          value = "postgresql://${aws_db_instance.fintrack_db.username}:${var.db_password}@${aws_db_instance.fintrack_db.endpoint}:${aws_db_instance.fintrack_db.port}/${aws_db_instance.fintrack_db.db_name}"
        },
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_replication_group.fintrack_redis.primary_endpoint_address}:${aws_elasticache_replication_group.fintrack_redis.port}"
        }
      ]
      
      secrets = [
        {
          name      = "JWT_SECRET"
          valueFrom = aws_secretsmanager_secret.jwt_secret.arn
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.fintrack_backend_logs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "fintrack-backend-task"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "fintrack_backend_logs" {
  name              = "/ecs/fintrack-backend"
  retention_in_days = 7

  tags = {
    Name = "fintrack-backend-logs"
  }
}

# IAM Roles
resource "aws_iam_role" "ecs_execution_role" {
  name = "fintrack-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "fintrack-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Secrets Manager
resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "fintrack/jwt-secret"
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    jwt_secret = var.jwt_secret
  })
}
