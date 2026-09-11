#!/bin/bash
# ==============================================================================
# ProcesStudio Portable — Lanzador 1-Clic para macOS (.command)
# Compatibilidad: Apple macOS (Intel y Apple Silicon M1/M2/M3/M4)
# ==============================================================================

DIR="$(cd "$(dirname "$0")" && pwd)"

# 1. Asegurar carpetas de persistencia local en USB
if [ ! -d "$DIR/Proyectos" ]; then
  mkdir -p "$DIR/Proyectos"
fi

if [ ! -d "$DIR/data" ]; then
  mkdir -p "$DIR/data"
fi

# 2. Buscar Electron empaquetado para Mac en App/ o superior
ELECTRON_APP="$DIR/App/electron.app/Contents/MacOS/Electron"
ELECTRON_MAIN="$DIR/App/main.cjs"

if [ -f "$ELECTRON_APP" ] && [ -f "$ELECTRON_MAIN" ]; then
  "$ELECTRON_APP" "$ELECTRON_MAIN" --portable &
  exit 0
fi

# 3. Abrir el paquete web compilado en el navegador predeterminado de macOS
HTML_PATH="$DIR/App/dist/index.html"
if [ ! -f "$HTML_PATH" ]; then
  HTML_PATH="$DIR/dist/index.html"
fi

if [ ! -f "$HTML_PATH" ]; then
  HTML_PATH="$DIR/index.html"
fi

if [ -f "$HTML_PATH" ]; then
  open "$HTML_PATH"
  osascript -e 'tell application "Terminal" to close (every window whose name contains "ProcesStudio_Mac.command")' 2>/dev/null &
  exit 0
fi

# 4. Notificación gráfica de error si faltan archivos
osascript -e 'display dialog "No se encontraron los componentes de inicio de ProcesStudio.\nVerifique que la carpeta App/ contenga los archivos del programa." with title "ProcesStudio Portable" buttons {"Aceptar"} default button "Aceptar" with icon stop'
exit 1
