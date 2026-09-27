@echo off
title KlikPOS Enterprise - Launcher
cd /d "%~dp0"
if exist "%~dp0KlikPOS.exe" (
    start "" "%~dp0KlikPOS.exe"
) else (
    start "" "%~dp0VenematicPOS.exe"
)
exit
