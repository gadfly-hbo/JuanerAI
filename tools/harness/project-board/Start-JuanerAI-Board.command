#!/bin/zsh
set -u

SCRIPT_DIR="${0:A:h}"
SERVER="$SCRIPT_DIR/server.mjs"
HOST="127.0.0.1"
PORT="41739"
URL="http://$HOST:$PORT"
LOG_FILE="${TMPDIR:-/tmp}/juanerai-project-board.log"

export PATH="/Users/huangbo/Dev/Env/homebrew/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

pause_on_error() {
  echo
  read -r "?启动失败。按回车键关闭此窗口。"
  exit 1
}

health_response() {
  /usr/bin/curl -fsS --max-time 1 "$URL/api/health" 2>/dev/null || true
}

open_board() {
  echo "正在打开 JuanerAI 开发看板：$URL"
  /usr/bin/open "$URL"
  sleep 1
  exit 0
}

if [[ ! -f "$SERVER" ]]; then
  echo "找不到看板服务：$SERVER"
  pause_on_error
fi

CURRENT_HEALTH="$(health_response)"
if [[ "$CURRENT_HEALTH" == *'"status":"ok"'* && "$CURRENT_HEALTH" == *'"mode":"read-only"'* ]]; then
  echo "JuanerAI 看板服务已经运行，直接打开页面。"
  open_board
fi

if /usr/sbin/lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "端口 $PORT 已被其他程序占用，未启动或终止任何进程。"
  echo "请关闭占用该端口的程序后重新双击启动。"
  pause_on_error
fi

NODE_BIN="$(command -v node 2>/dev/null || true)"
if [[ -z "$NODE_BIN" ]]; then
  echo "找不到 Node.js。请确认 Node.js 已安装并可在终端中运行。"
  pause_on_error
fi

echo "正在后台启动 JuanerAI 只读看板服务……"
nohup "$NODE_BIN" "$SERVER" >"$LOG_FILE" 2>&1 </dev/null &
SERVER_PID=$!

for attempt in {1..60}; do
  CURRENT_HEALTH="$(health_response)"
  if [[ "$CURRENT_HEALTH" == *'"status":"ok"'* && "$CURRENT_HEALTH" == *'"mode":"read-only"'* ]]; then
    echo "服务已启动，PID：$SERVER_PID"
    echo "运行日志：$LOG_FILE"
    open_board
  fi

  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "看板服务提前退出。"
    [[ -f "$LOG_FILE" ]] && /bin/cat "$LOG_FILE"
    pause_on_error
  fi
  sleep 0.1
done

echo "等待看板服务启动超时。"
[[ -f "$LOG_FILE" ]] && /bin/cat "$LOG_FILE"
pause_on_error
