# Supabase Setup and Migration Runbook

Updated: 2026-02-11
Target project ref: `jvmvaxobseoqeqjjpdcr` (`ai-solo-builder`)

## 1. Current Status

Completed in this repository:
- Supabase project initialized (`supabase/`)
- Project linked to `jvmvaxobseoqeqjjpdcr`
- Migrations created and applied to remote DB

Applied migrations:
- `supabase/migrations/20260211045100_init_content_model.sql`
- `supabase/migrations/20260211045200_seed_default_tags.sql`
- `supabase/migrations/20260211045300_enable_content_rls.sql`

`supabase db push --linked --include-all` now reports: `Remote database is up to date.`

## 2. Data Model Summary

Canonical content model:
- Root types: `news | product | digest`
- Digest dimension: `digest_edition = morning | evening`
- News semantics via tags: `dev-knowledge`, `case-study`, `product-update`

Core tables:
- `contents`
- `digest_details`
- `products`
- `tags`, `content_tags`
- `content_product_links`
- `sources`, `content_sources`
- `digest_rankings`, `digest_ranking_items`
- `content_revisions`

Details are specified in:
- `specs/content-policy/spec.md`
- `specs/content-model-db/spec.md`

## 3. Runtime Environment Variables

For Next.js / mobile API access:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server-side only)

Backward compatibility (optional aliases):
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional for CLI reliability:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

## 4. Standard Commands

```bash
# List migration status (local/remote)
supabase migration list

# Apply new migrations
supabase db push --linked --include-all

# Lint linked DB schema
supabase db lint --linked --level error --fail-on error

# Generate TypeScript DB types
npm run db:types
```

## 5. Notes on Authentication

In this environment, `supabase db push` succeeded, but `supabase migration list` / `supabase db lint` can fail if `cli_login_postgres` password auth is stale.

If that happens, re-link with explicit DB password:

```bash
supabase link --project-ref jvmvaxobseoqeqjjpdcr --password "<DB_PASSWORD>"
```

Then rerun lint/list commands.

## 6. Markdown and DB Relationship

Current recommended operation (Phase 1):
- Authoring SoT: Markdown (`content/news`, `content/products`)
- Serving SoT: Supabase DB mirror
- Ingestion job (next implementation step): parse markdown frontmatter/body and upsert to DB tables

Legacy compatibility mapping is documented in:
- `specs/content-policy/spec.md`

## 7. Next Implementation Steps

1. Extend `scripts/validate-content.mjs` to validate canonical fields (`contentType`, `digestEdition`, `tags`, `relatedProducts`) while preserving legacy compatibility.
2. Add `scripts/sync-content-to-supabase` (idempotent upsert pipeline).
3. Switch web/mobile read paths from file parsing to DB-backed APIs.
