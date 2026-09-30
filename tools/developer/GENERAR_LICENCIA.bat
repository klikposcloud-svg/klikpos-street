@echo off
title Venematic POS - Generador de Licencias
cd /d "%~dp0"
node scripts\generar-licencia.mjs
pause
