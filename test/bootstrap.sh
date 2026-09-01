#!/usr/bin/env bash
set -euo pipefail

test_root="$(mktemp -d)"
trap 'rm -rf "$test_root"' EXIT
mock_bin="$test_root/bin"
mock_log="$test_root/commands.log"
mkdir -p "$mock_bin"

cat >"$mock_bin/mock-command" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
name="$(basename "$0")"
printf '%s %s\n' "$name" "$*" >>"$MOCK_LOG"
exit 0
MOCK
chmod +x "$mock_bin/mock-command"
ln -s mock-command "$mock_bin/openclaw"
ln -s mock-command "$mock_bin/npm"
ln -s mock-command "$mock_bin/openclaw-companion"
ln -s mock-command "$mock_bin/npx"

PATH="$mock_bin:$PATH" MOCK_LOG="$mock_log" OPENCLAW_COMPANION_SPEC="openclaw-companion@next" \
  bash ./install.sh --lang en >/dev/null

grep -F "npm ping --registry https://registry.npmjs.org" "$mock_log" >/dev/null
grep -F "npm install -g openclaw-companion@next" "$mock_log" >/dev/null
grep -F "openclaw-companion setup --lang en" "$mock_log" >/dev/null
if grep -F "npm config set" "$mock_log" >/dev/null; then
  echo "bootstrap persisted npm configuration" >&2
  exit 1
fi

: >"$mock_log"
PATH="$mock_bin:$PATH" MOCK_LOG="$mock_log" bash ./bin/openclaw-manager >/dev/null 2>&1
grep -F "openclaw-companion menu" "$mock_log" >/dev/null

echo "bootstrap compatibility checks passed"
