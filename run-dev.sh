#!/usr/bin/env bash
set -e

DIR="/home/vd/Projects/vks-qoder"

gnome-terminal --tab --title="jmp-ui" --working-directory="$DIR/jmp-ui" -- bash -ic 'npm run dev; exec bash'
sleep 0.5
gnome-terminal --tab --title="jmp-web" --working-directory="$DIR/jmp-web" -- bash -ic 'mvn spring-boot:run -Dspring-boot.run.profiles=dev; exec bash'
sleep 0.5
gnome-terminal --tab --title="jitsi-meet" --working-directory="$DIR/jitsi-meet" -- bash -ic 'make dev; exec bash'
