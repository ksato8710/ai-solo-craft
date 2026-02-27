#!/usr/bin/env bash
set -euo pipefail

RSSHUB_DIR="${RSSHUB_DIR:-$HOME/dev/RSSHub}"
RSSHUB_PORT="${RSSHUB_PORT:-1200}"
PID_FILE="${RSSHUB_PID_FILE:-$RSSHUB_DIR/.rsshub.pid}"
LOG_FILE="${RSSHUB_LOG_FILE:-$RSSHUB_DIR/.rsshub.log}"

usage() {
  cat <<'EOF'
Usage: scripts/rsshub-local.sh <start|stop|status|logs>

Env vars:
  RSSHUB_DIR        RSSHub checkout directory (default: ~/dev/RSSHub)
  RSSHUB_PORT       Port for RSSHub process (default: 1200)
  RSSHUB_PID_FILE   PID file path (default: $RSSHUB_DIR/.rsshub.pid)
  RSSHUB_LOG_FILE   Log file path (default: $RSSHUB_DIR/.rsshub.log)
EOF
}

ensure_dir() {
  if [[ ! -d "$RSSHUB_DIR" ]]; then
    echo "RSSHub directory not found: $RSSHUB_DIR"
    echo "Clone RSSHub first: git clone https://github.com/DIYgod/RSSHub.git $RSSHUB_DIR"
    exit 1
  fi
}

is_running() {
  if [[ ! -f "$PID_FILE" ]]; then
    return 1
  fi
  local pid
  pid="$(cat "$PID_FILE")"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

start() {
  ensure_dir
  local entry_file="$RSSHUB_DIR/dist/index.mjs"

  if is_running; then
    echo "RSSHub already running (pid $(cat "$PID_FILE"))."
    exit 0
  fi

  if [[ ! -f "$entry_file" ]]; then
    echo "RSSHub build output is missing: $entry_file"
    echo "Run first: cd $RSSHUB_DIR && pnpm install && pnpm build"
    exit 1
  fi

  mkdir -p "$(dirname "$LOG_FILE")"

  (
    cd "$RSSHUB_DIR"
    nohup env \
      NODE_ENV=production \
      NODE_OPTIONS='--max-http-header-size=32768' \
      PORT="$RSSHUB_PORT" \
      node "$entry_file" >>"$LOG_FILE" 2>&1 &
    echo $! >"$PID_FILE"
  )

  sleep 1
  if is_running; then
    echo "RSSHub started (pid $(cat "$PID_FILE"), port $RSSHUB_PORT)."
    echo "Log: $LOG_FILE"
  else
    echo "Failed to start RSSHub. Recent logs:"
    tail -n 50 "$LOG_FILE" 2>/dev/null || true
    exit 1
  fi
}

stop() {
  if ! is_running; then
    echo "RSSHub is not running."
    rm -f "$PID_FILE"
    exit 0
  fi

  local pid
  pid="$(cat "$PID_FILE")"
  kill "$pid"

  for _ in {1..20}; do
    if kill -0 "$pid" 2>/dev/null; then
      sleep 0.25
    else
      break
    fi
  done

  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null || true
  fi

  rm -f "$PID_FILE"
  echo "RSSHub stopped."
}

status() {
  if is_running; then
    echo "running (pid $(cat "$PID_FILE"))"
  else
    echo "stopped"
    exit 1
  fi
}

logs() {
  ensure_dir
  touch "$LOG_FILE"
  tail -f "$LOG_FILE"
}

main() {
  local cmd="${1:-}"
  case "$cmd" in
    start) start ;;
    stop) stop ;;
    status) status ;;
    logs) logs ;;
    *) usage; exit 1 ;;
  esac
}

main "$@"
