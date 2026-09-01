#!/bin/bash
# ==============================================================================
# ProcesStudio Portable — Lanzador Nativo 1-Clic para macOS
# Compatibilidad: Apple macOS (Intel y Apple Silicon M1/M2/M3/M4)
# Persistencia Autocontenida: ./Proyectos/
# ==============================================================================

# 1. Obtener la ruta absoluta del directorio donde reside este archivo
DIR="$(cd "$(dirname "$0")" && pwd)"

# 2. Asegurar que la subcarpeta de Proyectos exista localmente en esta misma carpeta
if [ ! -d "$DIR/Proyectos" ]; then
  mkdir -p "$DIR/Proyectos"
fi

# 3. Buscar Electron empaquetado para Mac en App/
ELECTRON_APP="$DIR/App/electron.app/Contents/MacOS/Electron"
ELECTRON_MAIN="$DIR/App/main.cjs"

if [ -f "$ELECTRON_APP" ] && [ -f "$ELECTRON_MAIN" ]; then
  "$ELECTRON_APP" "$ELECTRON_MAIN" &
  exit 0
fi

# 4. Abrir el paquete web compilado en el navegador predeterminado de macOS
HTML_PATH="$DIR/App/dist/index.html"
if [ ! -f "$HTML_PATH" ]; then
  HTML_PATH="$DIR/dist/index.html"
fi

if [ -f "$HTML_PATH" ]; then
  open "$HTML_PATH"
  # Cerrar la ventana del terminal de forma limpia
  osascript -e 'tell application "Terminal" to close (every window whose name contains "ProcesStudio_Mac.command")' 2>/dev/null &
  exit 0
fi

# 5. Notificación gráfica de error si faltan archivos
osascript -e 'display dialog "No se encontraron los componentes de inicio de ProcesStudio.\nVerifique que la carpeta App/ contenga los archivos del programa." with title "ProcesStudio Portable" buttons {"Aceptar"} default button "Aceptar" with icon stop'
exit 1
