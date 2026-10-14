@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  SAREBIDEA - vista previa en tu ordenador
echo  Se abrira http://localhost:8080  (cierra esta ventana para parar)
echo.
start "" http://localhost:8080
where py >nul 2>nul && (py -m http.server 8080 & goto :fin)
where python >nul 2>nul && (python -m http.server 8080 & goto :fin)
where npx >nul 2>nul && (npx --yes serve -l 8080 . & goto :fin)
echo  No se ha encontrado Python ni Node.js. Instala uno de los dos (python.org o nodejs.org) y vuelve a abrir este archivo.
pause
:fin
