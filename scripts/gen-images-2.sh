#!/bin/bash
# Remaining imagery: avatars 11-12, 16 thumbnails, hero, extras — parallel batches of 5
OUT=/home/z/my-project/scripts/gen
mkdir -p $OUT

gen() { # prompt out size
  local p="$1" o="$2" s="$3"
  if [ -s "$OUT/$o" ]; then echo "skip $o"; return; fi
  for i in 1 2 3; do
    if z-ai image -p "$p" -o "$OUT/$o" -s "$s" >/dev/null 2>&1; then
      echo "ok $o"; return
    fi
    sleep 2
  done
  echo "FAIL $o"
}

# ── batch A
gen "Photorealistic portrait of a young woman hugging a golden retriever puppy, sunny park background, joyful, golden hour" av11.png 1024x1024 &
gen "Photorealistic portrait of a stylish young man in streetwear outfit and sneakers, city street background with bokeh lights at dusk, confident" av12.png 1024x1024 &
gen "Overhead photorealistic shot of colorful street tacos on a rustic wooden table, vibrant fresh ingredients, food photography" th01.png 720x1440 &
gen "Photorealistic tropical beach with turquoise water and palm trees at golden hour, travel vlog cinematic style" th02.png 720x1440 &
gen "Photorealistic dancer mid-air jump in urban street, dramatic sunset backlight, motion energy" th03.png 720x1440 &
wait
echo "== batch A done"

# ── batch B
gen "Photorealistic flat lay of smartphone, wireless earbuds and smartwatch on a clean desk, tech review aesthetic, blue LED accents" th04.png 720x1440 &
gen "Photorealistic athlete doing a workout in a bright modern gym, dynamic low angle, energetic" th05.png 720x1440 &
gen "Photorealistic makeup products flat lay with brushes, lipstick and pastel colors, beauty influencer aesthetic" th06.png 720x1440 &
gen "Photorealistic study desk with open books, laptop showing charts and coffee cup, top view, warm tones" th07.png 720x1440 &
gen "Photorealistic cute corgi dog wearing tiny sunglasses at the beach, fun summer vibe" th08.png 720x1440 &
wait
echo "== batch B done"

# ── batch C
gen "Photorealistic stylish streetwear outfit flat lay with sneakers, cap and accessories on concrete background" th09.png 720x1440 &
gen "Photorealistic singer with microphone on stage, purple and magenta stage lights, concert atmosphere" th10.png 720x1440 &
gen "Photorealistic group of friends laughing together on a couch in a bright living room, candid moment" th11.png 720x1440 &
gen "Photorealistic cozy morning scene with coffee cup and journal by a large window, soft golden light" th12.png 720x1440 &
gen "Photorealistic alpine mountain lake with perfect reflection at sunrise, dramatic landscape" th13.png 720x1440 &
wait
echo "== batch C done"

# ── batch D
gen "Photorealistic hands painting colorful abstract art on a canvas with brushes, paint splashes, creative energy" th14.png 720x1440 &
gen "Photorealistic gaming setup with RGB mechanical keyboard and monitor showing a racing game, dark room neon glow" th15.png 720x1440 &
gen "Photorealistic chef hands plating gourmet pasta dish in a restaurant kitchen, steam, culinary art" th16.png 720x1440 &
gen "Photorealistic young woman filming herself with a smartphone on a tripod with ring light, cozy modern creator studio, warm inviting light" hero-creator.png 720x1440 &
gen "Photorealistic diverse group of young content creators filming videos together in a colorful modern studio, phones and cameras, energetic collaboration" hero-wide.png 1440x720 &
wait
echo "== batch D done"

# ── batch E (extras)
gen "Modern flat vector illustration of a smartphone with money, coins and growth charts, earning app concept, bright red yellow and blue palette on white, clean minimal" illus-earn.png 1024x1024 &
gen "Modern flat vector illustration of a shield protecting a play button, content protection concept, bright red blue yellow palette on white, clean minimal" illus-shield.png 1024x1024 &
gen "Photorealistic closeup of hands holding a smartphone showing a colorful short video app feed, blurred cozy background" illus-phone.png 1024x1024 &
wait
echo "== batch E done"
echo ALL_IMAGE_GEN_DONE
ls -la $OUT | wc -l
