#!/usr/bin/env bash
# Run ShipLog demo even if system Node isn't installed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -x "$ROOT/.tools/node/bin/node" ]]; then
  export PATH="$ROOT/.tools/node/bin:$PATH"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install Node 22+ or keep .tools/node from setup."
  exit 1
fi

echo "Using $(node -v) / npm $(npm -v)"
npm install --no-fund --no-audit
npx prisma generate
npm run build
echo ""
echo "Demo ready → http://localhost:3000/demo"
npm run start -- -p 3000
