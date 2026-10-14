#!/bin/bash
cd "$(dirname "$0")"
echo "SAREBIDEA - vista previa en http://localhost:8080 (Ctrl+C para parar)"
( sleep 1; (open http://localhost:8080 || xdg-open http://localhost:8080) >/dev/null 2>&1 ) &
if command -v python3 >/dev/null; then python3 -m http.server 8080
elif command -v npx >/dev/null; then npx --yes serve -l 8080 .
else echo "Instala Python 3 o Node.js y vuelve a ejecutarlo."; fi
