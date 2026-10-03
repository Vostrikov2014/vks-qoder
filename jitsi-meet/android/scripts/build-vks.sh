#!/bin/bash

# Сборка APK приложения VKS (артефакт: dist/vks.apk).
# Приложение универсальное: запускается и на смартфонах (LAUNCHER),
# и на телевизорах / ТВ-приставках (LEANBACK_LAUNCHER).
#
# Использование:
#   android/scripts/build-vks.sh [ABI[,ABI...]]
#
# Примеры:
#   scripts/build-vks.sh                        # arm64-v8a (по умолчанию)
#   scripts/build-vks.sh arm64-v8a,armeabi-v7a  # два ABI для старых устройств
#
# Переменные окружения:
#   JAVA_HOME        — JDK 17; если не задан, ищется сам
#   ANDROID_HOME     — Android SDK; если не задан, берётся из local.properties
#                      или из <workspace>/.toolchain/android-sdk
#   LIBRE_BUILD=true — сборка без сервисов Google/Firebase
#   VKS_TV_STORE_PASSWORD, VKS_TV_KEY_ALIAS, VKS_TV_KEY_PASSWORD —
#                      пароли release-ключа (по умолчанию «vks-tv»)

set -euo pipefail

THIS_DIR=$(cd -P "$(dirname "$0")" && pwd)
ANDROID_DIR=$(dirname "$THIS_DIR")
PROJECT_DIR=$(dirname "$ANDROID_DIR")
WORKSPACE_DIR=$(dirname "$PROJECT_DIR")
ARCHS=${1:-${ARCHS:-arm64-v8a}}

# --- JDK 17 ---
if [ -z "${JAVA_HOME:-}" ] || [ ! -x "${JAVA_HOME}/bin/java" ]; then
    for candidate in \
        "${WORKSPACE_DIR}/.toolchain/jdk17/usr/lib/jvm/java-17-openjdk-amd64" \
        "${HOME}"/.sdkman/candidates/java/17* \
        /usr/lib/jvm/java-17-openjdk-amd64; do
        if [ -x "${candidate}/bin/java" ]; then
            export JAVA_HOME="${candidate}"
            break
        fi
    done
fi

if [ -z "${JAVA_HOME:-}" ]; then
    echo "Не найден JDK 17. Установите его и укажите JAVA_HOME." >&2
    exit 1
fi

echo "JAVA_HOME=${JAVA_HOME}"
"${JAVA_HOME}/bin/java" -version 2>&1 | head -1

# --- Android SDK ---
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"

if [ -z "${SDK}" ] && [ -f "${ANDROID_DIR}/local.properties" ]; then
    SDK=$(sed -n 's/^sdk\.dir=//p' "${ANDROID_DIR}/local.properties")
fi

if [ -z "${SDK}" ] && [ -d "${WORKSPACE_DIR}/.toolchain/android-sdk" ]; then
    SDK="${WORKSPACE_DIR}/.toolchain/android-sdk"
fi

if [ -z "${SDK}" ]; then
    echo "Не найден Android SDK. Укажите ANDROID_HOME или путь в local.properties." >&2
    exit 1
fi

export ANDROID_HOME="${SDK}"
export ANDROID_SDK_ROOT="${SDK}"
echo "sdk.dir=${SDK}" > "${ANDROID_DIR}/local.properties"
echo "ANDROID_HOME=${SDK}"

# --- ключ подписи release (общий с ТВ-сборкой) ---
KEYSTORE="${ANDROID_DIR}/keystores/vks-tv.keystore"

if [ ! -f "${KEYSTORE}" ]; then
    echo "Создаю ключ подписи ${KEYSTORE} (для продакшена замените на боевой ключ)"
    "${JAVA_HOME}/bin/keytool" -genkeypair -v \
        -keystore "${KEYSTORE}" \
        -alias "${VKS_TV_KEY_ALIAS:-vks-tv}" \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass "${VKS_TV_STORE_PASSWORD:-vks-tv}" \
        -keypass "${VKS_TV_KEY_PASSWORD:-vks-tv}" \
        -dname "CN=VKS, OU=VKS, O=VKS, L=Moscow, C=RU"
fi

# --- сборка ---
cd "${ANDROID_DIR}"

echo "Сборка: ABI=${ARCHS}, LIBRE_BUILD=${LIBRE_BUILD:-false}"
./gradlew :app:assembleRelease "-PreactNativeArchitectures=${ARCHS}"

# --- результат ---
APK="${ANDROID_DIR}/app/build/outputs/apk/release/vks-tv.apk"
DIST="${PROJECT_DIR}/dist"
mkdir -p "${DIST}"
cp "${APK}" "${DIST}/vks.apk"

echo
echo "Готово: ${DIST}/vks.apk"
