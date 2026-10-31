#!/bin/bash
# Fetch real images for Clipora platform via z-ai image-search
OUT=/home/z/my-project/scripts/img
mkdir -p $OUT

run() {
  local name="$1"; shift
  local query="$1"; shift
  local count="$1"; shift
  z-ai image-search -q "$query" -c "$count" --gl us --no-rank -o "$OUT/$name.json" 2>"$OUT/$name.err" &
}

run hero "person filming vertical video with smartphone and ring light at home studio" 6
run portraits_w "smiling young woman content creator portrait headshot colorful background" 8
run portraits_m "smiling young man content creator portrait headshot studio" 8
run group "diverse young creators filming video together in studio" 4
run food "street food cooking closeup delicious meal" 6
run travel "tropical travel destination vlog beautiful landscape" 6
run dance "dancer performing hip hop dance street style" 6
run tech "tech gadget review desk setup smartphone" 6
run fitness "home workout fitness training exercise" 5
run beauty "beauty makeup tutorial creator filming mirror" 5
run education "online education learning laptop study" 5
run money "earning money online smartphone payment app" 5
run pets "cute puppy dog playing funny moment" 5
run fashion "street fashion outfit style young person city" 5
run music "musician playing guitar singing performance" 5
run comedy "friends laughing together funny reaction" 5

wait
echo "ALL DONE"
ls -la $OUT
