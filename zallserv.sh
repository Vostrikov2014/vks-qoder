#!/bin/bash

# Строгий режим: остановка при ошибке, неопределённых переменных и ошибках в пайпах
set -euo pipefail

# Директория проекта на сервере
PROJECT_DIR="jmp"
COMPOSE_FILE="docker-compose.yml"

# Список контейнеров и образов
CONTAINERS="jmp-api jmp-jitsi-meet jmp-ui nginx-proxy"
IMAGES="vostrlog/jmp-api:latest vostrlog/jmp-jitsi-meet:latest vostrlog/jmp-ui:latest"
SERVICES_PULL="jitsi-meet jmp-api jmp-ui"
SERVICES_UP="jitsi-meet jmp-api jmp-ui nginx-proxy"

cd "$PROJECT_DIR"

echo "===> [1/5] Остановка контейнеров..."
for c in $CONTAINERS; do
    if docker ps --format '{{.Names}}' | grep -q "^${c}$"; then
        echo "  - stop $c"
        docker stop "$c"
    else
        echo "  - $c не запущен, пропускаем"
    fi
done

echo "===> [2/5] Удаление контейнеров..."
for c in $CONTAINERS; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${c}$"; then
        echo "  - rm $c"
        docker rm -f "$c"
    else
        echo "  - $c не найден, пропускаем"
    fi
done

echo "===> [3/5] Удаление старых образов..."
for img in $IMAGES; do
    if docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${img}$"; then
        echo "  - rmi $img"
        docker rmi "$img"
    else
        echo "  - $img не найден, пропускаем"
    fi
done

echo "===> [4/5] Скачивание новых образов..."
docker compose -f "$COMPOSE_FILE" pull $SERVICES_PULL

echo "===> [5/5] Поднятие контейнеров..."
docker compose -f "$COMPOSE_FILE" up -d $SERVICES_UP

echo "===> Проверка статуса..."
docker compose -f "$COMPOSE_FILE" ps

echo "===> Готово!"