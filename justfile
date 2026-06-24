# Serve the paper on a free port (or `just serve 8420` to pick one).
# Web Crypto needs a secure context — http://localhost counts, file:// does not.
run port="":
    #!/usr/bin/env bash
    set -euo pipefail
    PORT="{{port}}"
    if [ -z "$PORT" ]; then
        PORT=$(python3 -c 'import socket;s=socket.socket();s.bind(("",0));print(s.getsockname()[1]);s.close()')
    fi
    echo "→ http://localhost:$PORT/index.html"
    python3 -m http.server "$PORT"
