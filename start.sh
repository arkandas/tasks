#!/bin/sh
set -e

if [ -z "$TASKS_NEXTAUTH_SECRET" ] && [ -z "$NEXTAUTH_SECRET" ]; then
  echo "TASKS_NEXTAUTH_SECRET is not set. Generate one with: openssl rand -base64 32" >&2
  exit 1
fi

case "$TASKS_NEXTAUTH_SECRET" in
  change-me|YOUR_SECRET)
    echo "WARNING: TASKS_NEXTAUTH_SECRET still has its example value. Anyone can forge a session with it." >&2
    ;;
esac

if [ -z "$TASKS_NEXTAUTH_URL" ] && [ -z "$NEXTAUTH_URL" ]; then
  echo "WARNING: TASKS_NEXTAUTH_URL is not set. Sign-in redirects will point at http://localhost:3000." >&2
fi

auth_mode=$(printf '%s' "${TASKS_AUTH:-local}" | tr '[:upper:]' '[:lower:]')
case "$auth_mode" in
  local) ;;
  oidc)
    for name in TASKS_OIDC_ISSUER TASKS_OIDC_CLIENT_ID TASKS_OIDC_CLIENT_SECRET; do
      eval "value=\${$name}"
      if [ -z "$value" ]; then
        echo "TASKS_AUTH=oidc also needs $name." >&2
        exit 1
      fi
    done
    ;;
  *)
    echo "TASKS_AUTH must be \"local\" or \"oidc\", not \"$TASKS_AUTH\"." >&2
    exit 1
    ;;
esac

echo "Initializing PostgreSQL database..."
./node_modules/.bin/prisma db push

echo "Starting Next.js application..."
exec node server.js
