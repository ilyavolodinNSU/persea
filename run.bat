@echo off
powershell -ExecutionPolicy Bypass -File scripts\setup-wsl.ps1
docker compose -f docker-compose-dev.yml up -d