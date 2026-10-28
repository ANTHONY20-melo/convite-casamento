@echo off
rem Convite de casamento - servidor local (confirmacoes directas na planilha Excel)
rem Nao feche esta janela enquanto o convite estiver em uso.
cd /d "%~dp0"
node server.js
pause
