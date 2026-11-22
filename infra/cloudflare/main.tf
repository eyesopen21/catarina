locals {
  environments = toset(["dev", "staging"])
}

resource "cloudflare_hyperdrive_config" "postgres" {
  for_each   = local.environments
  account_id = var.cloudflare_account_id
  name       = "catarina-${each.key}-postgres"

  origin = {
    scheme   = "postgres"
    host     = var.postgres_origins[each.key].host
    port     = var.postgres_origins[each.key].port
    database = var.postgres_origins[each.key].database
    user     = var.postgres_origins[each.key].user
    password = var.postgres_origins[each.key].password
  }

  # PostgreSQL state changes must always reach the origin; do not cache query results.
  caching = {
    disabled = true
  }
}

resource "cloudflare_r2_bucket" "objects" {
  for_each   = local.environments
  account_id = var.cloudflare_account_id
  name       = "catarina-${each.key}-objects"
}

resource "cloudflare_workers_script" "api" {
  for_each    = local.environments
  account_id  = var.cloudflare_account_id
  script_name = "catarina-${each.key}-api"

  compatibility_date = "2026-11-22T00:00:00Z"
  main_module        = "worker.mjs"

  files = {
    "worker.mjs" = {
      content_file = var.worker_bundle_paths[each.key]
      content_type = "application/javascript+module"
    }
  }

  bindings = [
    {
      name = "HYPERDRIVE"
      type = "hyperdrive"
      id   = cloudflare_hyperdrive_config.postgres[each.key].id
    },
    {
      name        = "OBJECTS"
      type        = "r2_bucket"
      bucket_name = cloudflare_r2_bucket.objects[each.key].name
    }
  ]

  observability = {
    enabled = true
    logs = {
      enabled         = true
      invocation_logs = true
      persist         = false
    }
    traces = {
      enabled = true
      persist = false
    }
  }
}
