#!/usr/bin/env bash
# Rotate GitHub Secrets and Variables for this repo.
#
# Rotation is a *two-step* process per credential:
#   1. Generate a new value in the issuing dashboard (Turnstile, Resend, Cloudflare).
#   2. Push that value into GitHub → re-run the deploy workflow to sync it
#      into the Cloudflare Worker env.
#
# This script handles step 2. It prompts you for each new value, never echoes
# secrets to the terminal, and optionally triggers the deploy workflow at the
# end so Worker-side secrets (TURNSTILE_SECRET_KEY, RESEND_API_KEY) are synced.
#
# Usage:
#   scripts/rotate-secrets.sh                 # interactive, all rotatable keys
#   scripts/rotate-secrets.sh --only RESEND_API_KEY,TURNSTILE_SECRET_KEY
#   scripts/rotate-secrets.sh --dry-run       # show what would change, no writes
#   scripts/rotate-secrets.sh --no-deploy     # skip workflow_dispatch at the end

set -euo pipefail

ONLY=""
DRY_RUN=0
DEPLOY=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)      ONLY="$2"; shift 2 ;;
    --dry-run)   DRY_RUN=1; shift ;;
    --no-deploy) DEPLOY=0; shift ;;
    -h|--help)
      sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

command -v gh >/dev/null || { echo "gh CLI required" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "run 'gh auth login' first" >&2; exit 1; }

REPO_ROOT="$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# kind: secret | variable
# dash: URL to regenerate the value
# note: follow-up instruction specific to this credential
declare -a ROTATABLE=(
  "TURNSTILE_SECRET_KEY|secret|https://dash.cloudflare.com/?to=/:account/turnstile|Paired with VITE_TURNSTILE_SITE_KEY."
  "RESEND_API_KEY|secret|https://resend.com/api-keys|Revoke the old key after the new deploy succeeds."
  "CLOUDFLARE_API_TOKEN|secret|https://dash.cloudflare.com/profile/api-tokens|Scope: Pages Edit + Workers Scripts Edit only."
  "VITE_TURNSTILE_SITE_KEY|variable|https://dash.cloudflare.com/?to=/:account/turnstile|Public; also update local .env. Rotate together with TURNSTILE_SECRET_KEY."
)

want() {
  [[ -z "$ONLY" ]] && return 0
  local k="$1"
  IFS=',' read -ra picks <<<"$ONLY"
  for p in "${picks[@]}"; do
    [[ "$p" == "$k" ]] && return 0
  done
  return 1
}

read_secret() {
  local prompt="$1" var
  printf "%s" "$prompt" >&2
  IFS= read -rs var
  printf "\n" >&2
  printf "%s" "$var"
}

set_value() {
  local kind="$1" name="$2" value="$3"
  if (( DRY_RUN )); then
    echo "  [dry-run] would update $kind: $name"
    return
  fi
  if [[ "$kind" == "secret" ]]; then
    printf "%s" "$value" | gh secret set "$name" --body -
  else
    gh variable set "$name" --body "$value"
  fi
  echo "  ✓ updated $kind: $name"
}

update_local_env() {
  local name="$1" value="$2"
  local env_file="$REPO_ROOT/.env"
  [[ -f "$env_file" ]] || return 0
  read -r -p "  Update $name in local .env? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || return 0
  if (( DRY_RUN )); then
    echo "  [dry-run] would update $name in .env"
    return
  fi
  if grep -q "^${name}=" "$env_file"; then
    # portable in-place edit (macOS + GNU sed)
    tmp="$(mktemp)"
    awk -v k="$name" -v v="$value" '
      BEGIN { FS=OFS="=" }
      $1==k { print k"="v; next }
      { print }
    ' "$env_file" >"$tmp"
    mv "$tmp" "$env_file"
  else
    printf "%s=%s\n" "$name" "$value" >>"$env_file"
  fi
  echo "  ✓ wrote $name to .env"
}

echo "Current state:"
gh secret list
echo "---"
gh variable list
echo

rotated_any=0
for row in "${ROTATABLE[@]}"; do
  IFS='|' read -r name kind url note <<<"$row"
  want "$name" || continue

  echo
  echo "→ $name  ($kind)"
  echo "  Generate at: $url"
  echo "  Note: $note"
  read -r -p "  Rotate $name now? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "  skipped."; continue; }

  value="$(read_secret "  Paste new value (input hidden): ")"
  [[ -n "$value" ]] || { echo "  empty — skipped."; continue; }

  set_value "$kind" "$name" "$value"
  [[ "$name" == "VITE_TURNSTILE_SITE_KEY" ]] && update_local_env "$name" "$value"
  rotated_any=1
done

echo
if (( rotated_any == 0 )); then
  echo "Nothing rotated."
  exit 0
fi

if (( DRY_RUN )); then
  echo "Dry-run complete. Re-run without --dry-run to apply."
  exit 0
fi

if (( DEPLOY )); then
  read -r -p "Trigger deploy workflow to sync Worker secrets? [y/N] " ans
  if [[ "$ans" =~ ^[Yy]$ ]]; then
    gh workflow run deploy.yml --ref main
    echo "✓ workflow_dispatch fired. Watch: gh run watch"
  else
    echo "Skipped deploy. Worker secrets sync on the next push to main or workflow run."
  fi
fi

echo "Done. Revoke old values in the issuing dashboards once the new deploy is green."
