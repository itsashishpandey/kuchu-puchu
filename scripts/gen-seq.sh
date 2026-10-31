#!/bin/bash
# Sequential image generation with 429 backoff; skips existing files. Pass max count.
OUT=/home/z/my-project/scripts/gen
MAX=${1:-8}

declare -A PROMPTS
PROMPTS[th01]="Overhead photorealistic shot of colorful street tacos on a rustic wooden table, vibrant fresh ingredients, food photography|768x1344"
PROMPTS[th02]="Photorealistic tropical beach with turquoise water and palm trees at golden hour, travel vlog cinematic style|768x1344"
PROMPTS[th03]="Photorealistic dancer mid-air jump in urban street, dramatic sunset backlight, motion energy|768x1344"
PROMPTS[th04]="Photorealistic flat lay of smartphone, wireless earbuds and smartwatch on a clean desk, tech review aesthetic, blue LED accents|768x1344"
PROMPTS[th05]="Photorealistic athlete doing a workout in a bright modern gym, dynamic low angle, energetic|768x1344"
PROMPTS[th06]="Photorealistic makeup products flat lay with brushes, lipstick and pastel colors, beauty influencer aesthetic|768x1344"
PROMPTS[th07]="Photorealistic study desk with open books, laptop showing charts and coffee cup, top view, warm tones|768x1344"
PROMPTS[th08]="Photorealistic cute corgi dog wearing tiny sunglasses at the beach, fun summer vibe|768x1344"
PROMPTS[th09]="Photorealistic stylish streetwear outfit flat lay with sneakers, cap and accessories on concrete background|768x1344"
PROMPTS[th10]="Photorealistic singer with microphone on stage, purple and magenta stage lights, concert atmosphere|768x1344"
PROMPTS[th11]="Photorealistic group of friends laughing together on a couch in a bright living room, candid moment|768x1344"
PROMPTS[th12]="Photorealistic cozy morning scene with coffee cup and journal by a large window, soft golden light|768x1344"
PROMPTS[th13]="Photorealistic alpine mountain lake with perfect reflection at sunrise, dramatic landscape|768x1344"
PROMPTS[th14]="Photorealistic hands painting colorful abstract art on a canvas with brushes, paint splashes, creative energy|768x1344"
PROMPTS[th15]="Photorealistic gaming setup with RGB mechanical keyboard and monitor showing a racing game, dark room neon glow|768x1344"
PROMPTS[th16]="Photorealistic chef hands plating gourmet pasta dish in a restaurant kitchen, steam, culinary art|768x1344"
PROMPTS[hero-creator]="Photorealistic young woman filming herself with a smartphone on a tripod with ring light, cozy modern creator studio, warm inviting light|768x1344"
PROMPTS[hero-wide]="Photorealistic diverse group of young content creators filming videos together in a colorful modern studio, phones and cameras, energetic collaboration|1344x768"
PROMPTS[illus-earn]="Modern flat vector illustration of a smartphone with money, coins and growth charts, earning app concept, bright red yellow and blue palette on white, clean minimal|1024x1024"
PROMPTS[illus-shield]="Modern flat vector illustration of a shield protecting a play button, content protection concept, bright red blue yellow palette on white, clean minimal|1024x1024"
PROMPTS[illus-phone]="Photorealistic closeup of hands holding a smartphone showing a colorful short video app feed, blurred cozy background|1024x1024"

ORDER=(hero-creator hero-wide th01 th02 th03 th04 th05 th06 th07 th08 th09 th10 th11 th12 th13 th14 th15 th16 illus-earn illus-shield illus-phone)

count=0
for name in "${ORDER[@]}"; do
  if [ $count -ge $MAX ]; then echo "REACHED_MAX"; break; fi
  if [ -s "$OUT/$name.png" ]; then continue; fi
  IFS='|' read -r prompt size <<< "${PROMPTS[$name]}"
  ok=0
  for i in 1 2 3 4; do
    if z-ai image -p "$prompt" -o "$OUT/$name.png" -s "$size" >/dev/null 2>&1; then
      echo "ok $name"; ok=1; count=$((count+1)); break
    fi
    echo "retry $name ($i) — waiting 45s"; sleep 45
  done
  [ $ok -eq 0 ] && echo "FAIL $name"
  sleep 3
done
echo "CHUNK_DONE generated=$count"
