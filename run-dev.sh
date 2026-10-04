#!/usr/bin/env bash
set -e

DIR="/home/vd/Projects/vks-qoder"

# Автоопределение доступного эмулятора терминала
TERMINAL=""
for t in gnome-terminal konsole xfce4-terminal lxterminal mate-terminal tilix alacritty kitty xterm; do
  if command -v "$t" >/dev/null 2>&1; then
    TERMINAL="$t"
    break
  fi
done

if [ -z "$TERMINAL" ]; then
  echo "Не найден эмулятор терминала (gnome-terminal, konsole, xfce4-terminal и т.д.)."
  echo "Установите, например: sudo apt install gnome-terminal"
  exit 1
fi

echo "Используется терминал: $TERMINAL"

case "$TERMINAL" in
  gnome-terminal|mate-terminal|tilix)
    "$TERMINAL" --tab --title="jmp-ui" --working-directory="$DIR/jmp-ui" -- bash -ic 'npm run dev; exec bash'
    sleep 0.5
    "$TERMINAL" --tab --title="jmp-web" --working-directory="$DIR/jmp-web" -- bash -ic 'mvn spring-boot:run -Dspring-boot.run.profiles=dev; exec bash'
    sleep 0.5
    "$TERMINAL" --tab --title="jitsi-meet" --working-directory="$DIR/jitsi-meet" -- bash -ic 'make dev; exec bash'
    ;;
  konsole)
    "$TERMINAL" --new-tab --tab-title="jmp-ui" --working-dir="$DIR/jmp-ui" -e bash -ic 'npm run dev; exec bash'
    "$TERMINAL" --new-tab --tab-title="jmp-web" --working-dir="$DIR/jmp-web" -e bash -ic 'mvn spring-boot:run -Dspring-boot.run.profiles=dev; exec bash'
    "$TERMINAL" --new-tab --tab-title="jitsi-meet" --working-dir="$DIR/jitsi-meet" -e bash -ic 'make dev; exec bash'
    ;;
  xfce4-terminal|lxterminal)
    "$TERMINAL" --tab --title="jmp-ui" --working-directory="$DIR/jmp-ui" -e bash -ic 'npm run dev; exec bash'
    sleep 0.5
    "$TERMINAL" --tab --title="jmp-web" --working-directory="$DIR/jmp-web" -e bash -ic 'mvn spring-boot:run -Dspring-boot.run.profiles=dev; exec bash'
    sleep 0.5
    "$TERMINAL" --tab --title="jitsi-meet" --working-directory="$DIR/jitsi-meet" -e bash -ic 'make dev; exec bash'
    ;;
  alacritty|kitty|xterm)
    "$TERMINAL" -e bash -ic "cd $DIR/jmp-ui && npm run dev; exec bash" &
    "$TERMINAL" -e bash -ic "cd $DIR/jmp-web && mvn spring-boot:run -Dspring-boot.run.profiles=dev; exec bash" &
    "$TERMINAL" -e bash -ic "cd $DIR/jitsi-meet && make dev; exec bash" &
    ;;
esac
