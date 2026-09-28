#!/bin/bash

# Строгий режим: остановка при ошибке, неопределённых переменных и ошибках в пайпах
set -euo pipefail

PROJECT_DIR="/home/vd/Projects/vks-qoder"

echo "===> [1/3] Удаление старых образов..."
cd "$PROJECT_DIR"
docker rmi vostrlog/jmp-api:latest vostrlog/jmp-jitsi-meet:latest vostrlog/jmp-ui:latest || true

echo "===> [2/3] Сборка образов..."
cd "$PROJECT_DIR"
docker compose -f docker-compose.over.yml build jmp-api jmp-ui jitsi-meet

echo "===> [3/3] Пуш образов на DockerHub..."
docker push vostrlog/jmp-api:latest
docker push vostrlog/jmp-jitsi-meet:latest
docker push vostrlog/jmp-ui:latest

echo "===> Готово!"