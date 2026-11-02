#!/bin/bash
cd "$(dirname "$0")"
echo "SAREBIDEA - vista previa en http://localhost:8080 (Ctrl+C para parar)"
( sleep 1; (open http://localhost:8080 || xdg-open http://localhost:8080) >/dev/null 2>&1 ) &
# Solo en este ordenador (127.0.0.1): nadie de tu red puede ver la carpeta.
if command -v python3 >/dev/null; then python3 -m http.server 8080 --bind 127.0.0.1
elif command -v npx >/dev/null; then npx --yes serve@14.2.4 -l tcp://127.0.0.1:8080 .
else echo "Instala Python 3 o Node.js y vuelve a ejecutarlo."; fi
