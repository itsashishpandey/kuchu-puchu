#!/bin/bash
# Build 16 Kuchu Puchu demo videos (720x1280, 40-58s) from generated thumbnails:
# Ken Burns motion + music-box lullaby audio. Durations match seed data exactly.
set -e
MASTERS=/home/z/my-project/scripts/masters
AUD=/home/z/my-project/scripts/audio
VID=/home/z/my-project/public/videos
mkdir -p "$AUD"

# seed durations: v01..v16
DURS=(47 52 49 51 45 43 46 40 40 57 42 48 41 42 48 44)

# motion style per video: 0=zoom-in-center 1=zoom-out 2=zoom+pan-up 3=zoom+pan-down
STYLES=(0 1 2 3 1 0 3 2 1 0 2 3 0 1 2 3)

mk_video() { # idx motion dur
  local i=$1 style=$2 dur=$3
  local id=$(printf "v%02d" "$i")
  local frames=$((dur * 20))

  local zexpr xexpr yexpr
  case $style in
    0) zexpr="1+0.14*on/$frames"; xexpr="iw/2-(iw/zoom)/2"; yexpr="ih/2-(ih/zoom)/2" ;;
    1) zexpr="1.14-0.14*on/$frames"; xexpr="iw/2-(iw/zoom)/2"; yexpr="ih/2-(ih/zoom)/2" ;;
    2) zexpr="1+0.12*on/$frames"; xexpr="iw/2-(iw/zoom)/2"; yexpr="(ih-ih/zoom)*(1-0.85*on/$frames)" ;;
    3) zexpr="1+0.12*on/$frames"; xexpr="iw/2-(iw/zoom)/2"; yexpr="(ih-ih/zoom)*(0.15+0.85*on/$frames)" ;;
  esac

  python3 /home/z/my-project/scripts/musicbox.py "$i" "$dur" "$AUD/$id.wav"

  ffmpeg -y -loglevel error -loop 1 -i "$MASTERS/th$(printf '%02d' $i).png" -i "$AUD/$id.wav" \
    -filter_complex "[0:v]scale=1080:1920:flags=lanczos,zoompan=z='$zexpr':x='$xexpr':y='$yexpr':d=$frames:s=720x1280:fps=20,format=yuv420p[v]" \
    -map "[v]" -map 1:a -t "$dur" \
    -c:v libx264 -preset ultrafast -crf 25 -c:a aac -b:a 64k -ar 44100 \
    -movflags +faststart "$VID/$id.mp4"
  echo "built $id.mp4 (${dur}s, style $style)"
}

START=${1:-1}
END=${2:-16}
for i in $(seq "$START" "$END"); do
  d=${DURS[$((i-1))]}
  s=${STYLES[$((i-1))]}
  mk_video "$i" "$s" "$d"
done

# duplicate-content demo file: re-encode of v01 (different hash, same content)
if [ "$END" = "16" ]; then
  ffmpeg -y -loglevel error -i "$VID/v01.mp4" -c:v libx264 -preset veryfast -crf 28 \
    -c:a aac -b:a 64k -movflags +faststart "$VID/v01_dup.mp4"
  echo "built v01_dup.mp4"
fi
echo "VIDEOS DONE ($START-$END)"
