#!/bin/bash
# Build vertical (9:16) 40-60s video library for the Clipora demo feed
set -e
SRC=/home/z/my-project/scripts/vidsrc
OUT=/home/z/my-project/public/videos
mkdir -p "$OUT"

# sources are 1280x720 → vertical crop 405x720, x = (1280-405)*frac = 875*frac
cropx() { echo $(( 875 * $1 / 1000 )); }

mk() { # src frac dur extra out
  local src=$1 frac=$2 dur=$3 extra=$4 out=$5
  local x=$(cropx $frac)
  ffmpeg -y -loglevel error -stream_loop 8 -i "$SRC/$src" \
    -vf "crop=405:720:${x}:0,scale=720:1280,${extra}" \
    -t "$dur" -c:v libx264 -preset veryfast -crf 27 -pix_fmt yuv420p \
    -c:a aac -b:a 96k -movflags +faststart "$OUT/$out"
  echo "made $out ($(du -h "$OUT/$out" | cut -f1))"
}

mkb() { # boomerang: src frac extra out (fixed ~48s)
  local src=$1 frac=$2 extra=$3 out=$4
  local x=$(cropx $frac)
  ffmpeg -y -loglevel error -i "$SRC/$src" \
    -vf "crop=405:720:${x}:0,scale=720:1280,${extra},split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0" \
    -an -c:v libx264 -preset veryfast -crf 27 -pix_fmt yuv420p "$OUT/tmp_boom.mp4"
  ffmpeg -y -loglevel error -stream_loop 8 -i "$OUT/tmp_boom.mp4" -t 48 -c:v libx264 -preset veryfast -crf 27 -pix_fmt yuv420p -movflags +faststart "$OUT/$out"
  rm -f "$OUT/tmp_boom.mp4"
  echo "made $out ($(du -h "$OUT/$out" | cut -f1))"
}

mk bbb.mp4 500 47 "eq=saturation=1.15:brightness=0.02" v01.mp4
mk bbb.mp4 0   52 "eq=saturation=1.05:contrast=1.06" v02.mp4
mk bbb.mp4 1000 41 "eq=saturation=1.2:brightness=0.04" v03.mp4
mk bbb.mp4 300 58 "hue=h=8:s=1.1" v04.mp4
mk bbb.mp4 700 44 "eq=contrast=1.1:saturation=0.95" v05.mp4
mk jf.mp4 500 49 "eq=saturation=1.25:brightness=0.03" v06.mp4
mk jf.mp4 150 43 "eq=contrast=1.08:saturation=1.1" v07.mp4
mk jf.mp4 850 55 "hue=h=-6:s=1.15" v08.mp4
mk jf.mp4 400 40 "eq=brightness=0.05:saturation=1.0" v09.mp4
mk sintel.mp4 500 51 "eq=saturation=1.1:contrast=1.05" v10.mp4
mk sintel.mp4 0   46 "eq=brightness=0.02:saturation=1.2" v11.mp4
mk sintel.mp4 1000 57 "hue=h=5:s=1.05" v12.mp4
mk sintel.mp4 250 42 "eq=contrast=1.12" v13.mp4
mk sintel.mp4 750 48 "eq=saturation=1.18:brightness=-0.01" v14.mp4
mkb bbb.mp4 450 "eq=saturation=1.08" v15.mp4
mkb jf.mp4 600 "eq=saturation=1.12:contrast=1.04" v16.mp4

# near-duplicate of v01 (re-encode + tiny crop shift) → duplicate-detection demo
ffmpeg -y -loglevel error -i "$OUT/v01.mp4" \
  -vf "crop=704:1252:8:14,scale=720:1280,eq=brightness=0.005" \
  -c:v libx264 -preset medium -crf 30 -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart "$OUT/v01_dup.mp4"
echo "made v01_dup.mp4 ($(du -h "$OUT/v01_dup.mp4" | cut -f1))"
echo "ALL VIDEOS DONE"
ls -la "$OUT"
