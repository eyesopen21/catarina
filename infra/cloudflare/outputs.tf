output "worker_script_names" {
  description = "Worker script names managed for each environment."
  value       = { for environment, worker in cloudflare_workers_script.api : environment => worker.script_name }
}

output "r2_bucket_names" {
  description = "Private R2 bucket names managed for each environment."
  value       = { for environment, bucket in cloudflare_r2_bucket.objects : environment => bucket.name }
}
