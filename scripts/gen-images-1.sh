#!/bin/bash
# Generate all platform imagery via z-ai image CLI (batch 1: avatars)
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

gen "Photorealistic portrait of a cheerful young Latina woman content creator smiling at camera, casual stylish outfit, softbox studio lighting, pastel pink background, professional photography, high quality" av01.png 1024x1024
gen "Photorealistic portrait of a young Black man filmmaker holding a compact vlogging camera, confident smile, urban loft background, natural window lighting, professional photography" av02.png 1024x1024
gen "Photorealistic portrait of a South Asian woman chef in a modern kitchen wearing an apron, warm smile, shallow depth of field, professional food photography style" av03.png 1024x1024
gen "Photorealistic portrait of a young man dancer with headphones around his neck, energetic pose, neon lit studio background, dramatic rim lighting" av04.png 1024x1024
gen "Photorealistic portrait of a young East Asian woman tech reviewer at a desk with smartphone and gadgets, friendly smile, blue ambient lighting, modern" av05.png 1024x1024
gen "Photorealistic portrait of a funny young man making a surprised comedic expression, bright yellow studio background, punchy lighting" av06.png 1024x1024
gen "Photorealistic portrait of an athletic Middle Eastern woman in fitness clothing holding a water bottle, bright gym background, motivated smile" av07.png 1024x1024
gen "Photorealistic portrait of a friendly male teacher with glasses at a desk with laptop and books, warm home office background, approachable" av08.png 1024x1024
gen "Photorealistic portrait of a glamorous young woman beauty influencer with flawless makeup, ring light catchlights in eyes, pink gradient background" av09.png 1024x1024
gen "Photorealistic portrait of a young man musician holding an acoustic guitar, cozy studio with warm string lights, relaxed smile" av10.png 1024x1024
gen "Photorealistic portrait of a young woman hugging a golden retriever puppy, sunny park background, joyful, golden hour" av11.png 1024x1024
gen "Photorealistic portrait of a stylish young man in streetwear outfit and sneakers, city street background with bokeh lights at dusk, confident" av12.png 1024x1024
echo DONE_BATCH1
