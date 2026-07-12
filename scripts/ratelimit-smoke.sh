#!/usr/bin/env bash
# Smoke test for the /api/chat rate limiter.
#
# Usage:
#   scripts/ratelimit-smoke.sh [BASE_URL]   # default http://localhost:3000
#
# What to expect:
#   - Production (`pnpm start`) with NO Upstash env vars: fail-closed, every
#     request returns 429.
#   - Dev (`pnpm dev`) with NO Upstash env vars: the in-memory limiter allows
#     ~8 requests/minute per IP, then returns 429.
#
# Requires ANTHROPIC_API_KEY to be set (a dummy value is fine, since the limiter
# runs before the model call). Put it in .env.local, which is gitignored.

set -euo pipefail
BASE="${1:-http://localhost:3000}"
BODY='{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"hi"}]}]}'

echo "Hammering ${BASE}/api/chat (11 requests):"
for i in $(seq 1 11); do
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${BASE}/api/chat" \
    -H 'content-type: application/json' \
    -d "$BODY")
  echo "  request $i -> HTTP $code"
done
echo "Done. 429 = rate limited (scripted fallback served)."
