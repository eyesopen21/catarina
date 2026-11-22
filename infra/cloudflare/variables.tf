variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the Workers and R2 resources."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-f]{32}$", var.cloudflare_account_id))
    error_message = "cloudflare_account_id must be a 32-character hexadecimal account ID."
  }
}

variable "cloudflare_api_token" {
  description = "Scoped Cloudflare API token. Supply through TF_VAR_cloudflare_api_token or the CI secret store."
  type        = string
  sensitive   = true
}

variable "worker_bundle_paths" {
  description = "Paths to already-built Worker module bundles. The repository does not yet produce these bundles."
  type        = map(string)

  validation {
    condition     = toset(keys(var.worker_bundle_paths)) == toset(["dev", "staging"])
    error_message = "worker_bundle_paths must contain exactly dev and staging."
  }
}

variable "postgres_origins" {
  description = "External PostgreSQL origins, one per environment. Passwords are sensitive and will be stored in Terraform state; use only an approved encrypted remote backend."
  type = map(object({
    host     = string
    port     = optional(number, 5432)
    database = string
    user     = string
    password = string
  }))
  sensitive = true

  validation {
    condition     = toset(keys(var.postgres_origins)) == toset(["dev", "staging"])
    error_message = "postgres_origins must contain exactly dev and staging."
  }
}
