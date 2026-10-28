#!/usr/bin/env bash
# Converte o manifesto (1080p, 1min50, áudio PCM, 170 MB) em versões leves para a web.
set -euo pipefail
ORIGEM="$HOME/Library/CloudStorage/GoogleDrive-marcelo@i9criacoes.com.br/Drives compartilhados/ALWAYS ON/ALWAYS ON/PEÇAS/3_VIDEOS/18_MAESTRO_MANIFESTO/AF/Maestro_Manifesto_v2.mp4"
DEST="public/video"
TMP="$(mktemp -d)"
mkdir -p "$DEST"
cp "$ORIGEM" "$TMP/origem.mp4"

# 720p ~ 14 MB (2 passadas, 950 kb/s de vídeo + 96 kb/s de áudio)
ffmpeg -y -i "$TMP/origem.mp4" -vf "scale=-2:720" -c:v libx264 -preset slow -b:v 950k -pass 1 -passlogfile "$TMP/p720" -an -f mp4 /dev/null
ffmpeg -y -i "$TMP/origem.mp4" -vf "scale=-2:720" -c:v libx264 -preset slow -b:v 950k -pass 2 -passlogfile "$TMP/p720" \
  -pix_fmt yuv420p -profile:v high -movflags +faststart -c:a aac -b:a 96k "$DEST/manifesto-720.mp4"

# 480p ~ 8 MB
ffmpeg -y -i "$TMP/origem.mp4" -vf "scale=-2:480" -c:v libx264 -preset slow -b:v 520k -pass 1 -passlogfile "$TMP/p480" -an -f mp4 /dev/null
ffmpeg -y -i "$TMP/origem.mp4" -vf "scale=-2:480" -c:v libx264 -preset slow -b:v 520k -pass 2 -passlogfile "$TMP/p480" \
  -pix_fmt yuv420p -profile:v main -movflags +faststart -c:a aac -b:a 80k "$DEST/manifesto-480.mp4"

# Capa: quadro aos 3 s
ffmpeg -y -ss 3 -i "$TMP/origem.mp4" -frames:v 1 -vf "scale=1280:-2" -q:v 3 "$DEST/manifesto-poster.jpg"

rm -rf "$TMP"
ls -lh "$DEST"
