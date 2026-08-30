#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

say() { printf '\n==> %s\n' "$*"; }

if ! command -v pnpm >/dev/null 2>&1; then
  echo 'ERROR: pnpm is required.' >&2
  exit 127
fi
if ! command -v supabase >/dev/null 2>&1; then
  echo 'ERROR: Supabase CLI is required.' >&2
  exit 127
fi
if ! command -v deno >/dev/null 2>&1; then
  echo 'ERROR: Deno is required.' >&2
  exit 127
fi

say 'Resetting local Supabase database'
supabase db reset

say 'Running database tests'
supabase test db

say 'Running Edge Function shared-module tests'
deno test supabase/functions/_shared/*.test.ts

say 'Running unit/component tests'
pnpm vitest run

say 'Running TypeScript project check'
pnpm typecheck

say 'Building production PWA'
pnpm build

# Playwright needs the local public key and service-role key. Supabase emits
# shell-compatible env output; source only the values we explicitly need.
say 'Loading local Supabase test credentials'
STATUS_ENV="$(supabase status -o env)"
extract_env() {
  local key="$1"
  printf '%s\n' "$STATUS_ENV" | sed -nE "s/^${key}=['\"]?([^'\"]*)['\"]?$/\\1/p" | head -n1
}

export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-http://127.0.0.1:54321}"
LOCAL_PUBLIC_KEY="$(extract_env ANON_KEY)"
if [[ -z "$LOCAL_PUBLIC_KEY" ]]; then LOCAL_PUBLIC_KEY="$(extract_env PUBLISHABLE_KEY)"; fi
LOCAL_SERVICE_KEY="$(extract_env SERVICE_ROLE_KEY)"
if [[ -z "$LOCAL_SERVICE_KEY" ]]; then LOCAL_SERVICE_KEY="$(extract_env SECRET_KEY)"; fi
export VITE_SUPABASE_PUBLISHABLE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-$LOCAL_PUBLIC_KEY}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$LOCAL_SERVICE_KEY}"
export VITE_MAP_STYLE_URL="${VITE_MAP_STYLE_URL:-https://tiles.openfreemap.org/styles/liberty}"

if [[ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
  echo 'ERROR: Could not obtain local Supabase anon/service-role keys.' >&2
  exit 1
fi

say 'Running Playwright end-to-end tests'
pnpm exec playwright test

say 'SENSEMAP v0.1 release gate passed'
