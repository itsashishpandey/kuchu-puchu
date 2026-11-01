#!/bin/bash
# Kuchu Puchu rebrand — cute kids cartoon imagery (replaces all photorealistic assets)
# Style: cute 3D baby cartoon characters, big sparkly eyes, bright blue/pink kids-show palette
OUT=/home/z/my-project/scripts/gen
mkdir -p $OUT
LOG=/home/z/my-project/scripts/img/kp.log
mkdir -p /home/z/my-project/scripts/img

gen() { # prompt out size
  local p="$1" o="$2" s="$3"
  if [ -s "$OUT/$o" ]; then echo "skip $o" >> "$LOG"; return; fi
  for i in 1 2 3; do
    if z-ai image -p "$p" -o "$OUT/$o" -s "$s" >> "$LOG" 2>&1; then
      echo "ok $o" >> "$LOG"; return
    fi
    sleep 3
  done
  echo "FAIL $o" >> "$LOG"
}

STYLE="cute 3D cartoon render in the style of a beloved kids animated TV show, adorable chibi baby character with big sparkly eyes, soft rounded shapes, glossy toy-like material, bright cheerful blue and pink color palette, soft studio lighting, high quality, no text"

# ── batch A: avatars 1-5 ──
gen "Portrait of a cute smiling baby boy cartoon character wearing a blue denim overall, $STYLE" av01.png 1024x1024 &
gen "Portrait of a cute baby girl cartoon character with pigtails and pink hair bows, giggling, $STYLE" av02.png 1024x1024 &
gen "Portrait of an adorable baby elephant cartoon character holding a blue balloon, $STYLE" av03.png 1024x1024 &
gen "Portrait of a cute baby bunny cartoon character with a pink flower crown, $STYLE" av04.png 1024x1024 &
gen "Portrait of a cute baby panda cartoon character wearing a blue baseball cap, $STYLE" av05.png 1024x1024 &
wait
echo "== batch A done" >> "$LOG"

# ── batch B: avatars 6-10 ──
gen "Portrait of a cute baby kitten cartoon character wearing a pink dress, $STYLE" av06.png 1024x1024 &
gen "Portrait of a cute baby lion cub cartoon character with a blue scarf, $STYLE" av07.png 1024x1024 &
gen "Portrait of a cute baby teddy bear cartoon character with a pink ribbon bow, $STYLE" av08.png 1024x1024 &
gen "Portrait of a cute baby dinosaur cartoon character in a blue t-shirt, $STYLE" av09.png 1024x1024 &
gen "Portrait of a cute baby penguin cartoon character wearing a pink beanie hat, $STYLE" av10.png 1024x1024 &
wait
echo "== batch B done" >> "$LOG"

# ── batch C: avatars 11-12 + hero-creator + illus-earn ──
gen "Portrait of a cute baby monkey cartoon character with a blue backpack, $STYLE" av11.png 1024x1024 &
gen "Portrait of a cute baby unicorn cartoon character with a pink glittery mane, $STYLE" av12.png 1024x1024 &
gen "Full body cute dancing baby cartoon character celebrating with musical notes, sparkles and floating coins, vertical composition, $STYLE" hero-creator.png 720x1440 &
gen "Modern flat vector illustration of a cute cartoon piggy bank with gold coins, stars and a growth chart, kids earning app concept, blue and pink palette on white background, clean minimal, no text" illus-earn.png 1024x1024 &
wait
echo "== batch C done" >> "$LOG"

# ── batch D: thumbs 1-5 ──
gen "Vertical scene of a cute baby elephant taking a bubbly bath in a jungle river with rubber duck, surrounded by butterflies, $STYLE" th01.png 720x1440 &
gen "Vertical scene of a cute baby bunny hopping through a magical rainbow garden with giant lollipops and flowers, $STYLE" th02.png 720x1440 &
gen "Vertical scene of a cute teddy bear picnic with cupcakes, juice and a checkered blanket in a sunny park, $STYLE" th03.png 720x1440 &
gen "Vertical scene of a brave little cartoon sparrow with big eyes flying above a colorful jungle at sunrise, $STYLE" th04.png 720x1440 &
gen "Vertical scene of a cute baby panda giggling while eating bamboo cookies at a picnic table, $STYLE" th05.png 720x1440 &
wait
echo "== batch D done" >> "$LOG"

# ── batch E: thumbs 6-10 ──
gen "Vertical scene of a group of cute baby cartoon animals dancing at a colorful party with confetti and balloons, $STYLE" th06.png 720x1440 &
gen "Vertical scene of a cute baby lion learning the alphabet ABC on a chalkboard in a playful classroom, $STYLE" th07.png 720x1440 &
gen "Vertical scene of a cute baby cat painting a big rainbow with a paintbrush on a canvas, paint splashes, $STYLE" th08.png 720x1440 &
gen "Vertical cozy bedtime scene of a sleepy baby bunny in pajamas under a smiling crescent moon with glowing stars, $STYLE" th09.png 720x1440 &
gen "Vertical scene of a cute baby dinosaur in yellow rubber boots splashing in puddles on a rainy playful day, $STYLE" th10.png 720x1440 &
wait
echo "== batch E done" >> "$LOG"

# ── batch F: thumbs 11-16 ──
gen "Vertical scene of colorful toy blocks stacked high with a cute teddy bear playing, kids playroom, $STYLE" th11.png 720x1440 &
gen "Vertical scene of a cute baby penguin ice skating while holding pink and blue balloons on a sparkling ice rink, $STYLE" th12.png 720x1440 &
gen "Vertical scene of a cute baby fox marveling at glowing fireflies in an enchanted magical forest at night, $STYLE" th13.png 720x1440 &
gen "Vertical scene of a cute cartoon rocket ship flying to a candy planet with lollipop trees, smiling baby astronaut bear, $STYLE" th14.png 720x1440 &
gen "Vertical scene of a cute baby elephant and a tiny mouse hugging as best friends in a flower meadow, $STYLE" th15.png 720x1440 &
gen "Vertical scene of a cute puppy celebrating at a birthday party with a big cake, gifts and balloons, $STYLE" th16.png 720x1440 &
wait
echo "== batch F done" >> "$LOG"

# ── batch G: hero-wide + illus-shield + illus-phone ──
gen "Wide scene of a group of cute baby cartoon animal characters dancing together on a colorful stage with blue and pink balloons and confetti, joyful kids show poster, $STYLE" hero-wide.png 1440x720 &
gen "Modern flat vector illustration of a friendly shield protecting a cute teddy bear and a play button, content protection concept, blue and pink palette on white background, clean minimal, no text" illus-shield.png 1024x1024 &
gen "Modern flat vector illustration of a smartphone showing a colorful kids video app feed with cute cartoon animal characters, hearts and stars floating around, blue and pink palette, no text" illus-phone.png 1024x1024 &
wait
echo "== batch G done" >> "$LOG"
echo "KP_IMAGE_GEN_ALL_DONE" >> "$LOG"
