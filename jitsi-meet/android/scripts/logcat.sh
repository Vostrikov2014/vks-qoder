#!/bin/bash

# VKS TV: пакет приложения (applicationId). Совпадает и с релизной
# (ru.slamx.vkst), и с debug-сборкой (ru.slamx.vkst.debug).
PKG_NAME=${1:-ru.slamx.vkst}
APP_PID=$(adb shell ps | grep $PKG_NAME | awk '{print $2}')

if [[ -z "$APP_PID" ]]; then
    echo "App is not running"
    exit 1
fi

exec adb logcat --pid=$APP_PID
