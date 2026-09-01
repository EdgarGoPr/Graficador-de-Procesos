@echo off
setlocal
title ProcesStudio Portable (Zero-AppData Mode)
echo ======================================================================
echo    PROCESSTUDIO PORTABLE - BPMN 2.0 (ISO 19510) y ISO 9001:2015
echo ======================================================================
echo  Iniciando entorno de escritorio portable...
echo  Ruta de persistencia: ../Proyectos/
echo.

set ELECTRON_ENABLE_LOGGING=false
set ELECTRON_NO_ATTACH_CONSOLE=true

:: 1. Buscar Electron local o en desarrollo
set "ELECTRON_EXE="
if exist "%~dp0electron\electron.exe" set "ELECTRON_EXE=%~dp0electron\electron.exe"
if not defined ELECTRON_EXE if exist "%~dp0..\..\node_modules\electron\dist\electron.exe" set "ELECTRON_EXE=%~dp0..\..\node_modules\electron\dist\electron.exe"

set "ELECTRON_MAIN="
if exist "%~dp0main.cjs" set "ELECTRON_MAIN=%~dp0main.cjs"
if not defined ELECTRON_MAIN if exist "%~dp0..\..\electron\main.cjs" set "ELECTRON_MAIN=%~dp0..\..\electron\main.cjs"

if defined ELECTRON_EXE if defined ELECTRON_MAIN (
    echo [INFO] Iniciando en modo escritorio nativo (Electron)...
    start "" "%ELECTRON_EXE%" "%ELECTRON_MAIN%"
    exit /b 0
)

:: 2. Si no hay Electron, buscar paquete web compilado (dist\index.html o index.html)
set "APP_HTML="
if exist "%~dp0dist\index.html" set "APP_HTML=%~dp0dist\index.html"
if not defined APP_HTML if exist "%~dp0index.html" set "APP_HTML=%~dp0index.html"
if not defined APP_HTML if exist "%~dp0..\..\dist\index.html" set "APP_HTML=%~dp0..\..\dist\index.html"

if defined APP_HTML (
    echo [INFO] Iniciando en modo Web Portable en navegador predeterminado...
    start "" "%APP_HTML%"
    exit /b 0
)

:: 3. Si no se encontró nada
echo [ERROR] No se encontraron los archivos necesarios para iniciar la aplicacion.
echo.
echo Presione cualquier tecla para salir...
pause >nul
exit /b 1
