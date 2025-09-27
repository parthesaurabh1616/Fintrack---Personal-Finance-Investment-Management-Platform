output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.fintrack_vpc.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public_subnets[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private_subnets[*].id
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.fintrack_db.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_replication_group.fintrack_redis.primary_endpoint_address
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.fintrack_storage.bucket
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.fintrack_cluster.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.fintrack_cluster.arn
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    alb = aws_security_group.fintrack_alb_sg.id
    ecs = aws_security_group.fintrack_ecs_sg.id
    rds = aws_security_group.fintrack_rds_sg.id
  }
}
