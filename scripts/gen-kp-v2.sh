#!/bin/bash
# Kuchu Puchu v2 imagery — sequential with rate-limit backoff
OUT=/home/z/my-project/scripts/gen2
LOG=/home/z/my-project/scripts/img/kp2.log
mkdir -p "$OUT"

STYLE="high quality 3D Pixar-style CGI render, adorable chibi characters with oversized heads and huge expressive sparkly eyes, soft subsurface skin, glossy toy-like materials, soft diffused cinematic lighting, pastel color grading, cozy detailed background with gentle depth of field, kids animated movie still, vibrant, vertical composition, no text, no watermark"
KIDS="cute 3D toddler character with oversized head and huge sparkly eyes, soft rosy cheeks"
GIRL="$KIDS wearing a pink dress with little flowers"
BOY="$KIDS wearing blue denim overalls with a yellow t-shirt"

declare -A P
P[th01]="Adorable baby elephant with a tiny yellow rubber duck enjoying a bubbly foam bath in a jungle spa pool, bubbles and butterflies floating around, happy giggling expression, $STYLE"
P[th02]="Cute fluffy baby bunny hopping through a magical rainbow garden with giant smiling flowers, mushrooms and butterflies, joyful wide eyes, $STYLE"
P[th03]="$GIRL and $BOY dancing happily together at a colorful party with confetti, balloons and musical notes, both laughing with arms up, $STYLE"
P[th04]="Brave cute little sparrow chick with big determined eyes flying above a colorful jungle at sunrise, tiny wings spread wide, warm golden light, $STYLE"
P[th05]="Giggling baby panda baking bamboo cookies in a cozy pastel kitchen, flour dust in the air, plate of cookies, chef hat, $STYLE"
P[th06]="$BOY and $GIRL building a tall colorful tower of toy blocks together in a bright playroom, reaching up on tiptoes, blocks stacked high, teamwork, $STYLE"
P[th07]="Cute baby lion cub with a chalkboard showing colorful alphabet letters, playful classroom, pointing with a stick, proud smile, $STYLE"
P[th08]="Adorable baby kitten artist painting a big rainbow on a canvas with a paintbrush, paint splashes of pink and blue, art studio smock, $STYLE"
P[th09]="Cozy bedtime scene of a sleepy baby bunny in striped pajamas hugging a carrot plushie in a soft bed, smiling crescent moon and glowing stars outside the window, $STYLE"
P[th10]="Cheerful green baby dinosaur wearing yellow rubber boots joyfully splashing in big puddles on a rainy day, rain boots and umbrella, sparkling raindrops, $STYLE"
P[th11]="Excited baby panda opening a surprise toy box with teddy bears, balls and toys flying out with sparkles, playful messy playroom, $STYLE"
P[th12]="Cute baby penguin ice skating gracefully on a sparkling ice rink under a starry night sky with twinkling stars and soft northern lights, $STYLE"
P[th13]="Tiny cute baby fox with wonder-filled eyes following a trail of glowing magic fireflies through an enchanted forest at night, magical bokeh, $STYLE"
P[th14]="$GIRL and $BOY as little astronauts inside a toy rocket spaceship flying toward a candy planet with lollipop trees and cotton candy clouds, view of space through the window, $STYLE"
P[th15]="Gentle baby elephant and a tiny mouse hugging as best friends in a sunny flower meadow, dandelion fluff floating, heartwarming, $STYLE"
P[th16]="Cute golden retriever puppy wearing a party hat celebrating at a birthday party with a big cake, wrapped gifts, balloons and confetti, $STYLE"
P[hero-kids]="$GIRL and $BOY standing back to back winking and giving thumbs up, surrounded by colorful confetti, stars and floating play buttons, bright cheerful studio background, $STYLE"
P[upload-kid]="$BOY filming himself with a smartphone on a small tripod and ring light in a cozy kids bedroom creator studio, clapperboard and plush toys around, big excited smile, $STYLE"
P[earn-kid]="$GIRL hugging a big pink piggy bank with golden coins and stars floating around her, sitting on a stack of giant coins, delighted expression, $STYLE"

ORDER=(th01 th02 th03 th04 th05 th06 th07 th08 th09 th10 th11 th12 th13 th14 th15 th16 hero-kids upload-kid earn-kid)

gen_one() {
  local key=$1
  local o="$key.png"
  if [ -s "$OUT/$o" ]; then return 0; fi
  for i in 1 2 3 4 5; do
    if z-ai image -p "${P[$key]}" -o "$OUT/$o" -s 768x1344 >/dev/null 2>&1; then
      echo "ok $key (attempt $i)" >> "$LOG"
      return 0
    fi
    sleep $((10 + i * 10))
  done
  echo "FAIL $key" >> "$LOG"
  return 1
}

ALL_DONE=1
for key in "${ORDER[@]}"; do
  if [ -s "$OUT/$key.png" ]; then continue; fi
  ALL_DONE=0
  gen_one "$key"
  sleep 6
done
if [ "$ALL_DONE" = "1" ]; then echo "KP2_ALL_DONE" >> "$LOG"; fi
ls "$OUT" | wc -l
