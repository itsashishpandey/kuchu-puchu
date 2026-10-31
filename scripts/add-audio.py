#!/usr/bin/env python3
"""Synthesize distinct lo-fi backing loops for each demo video + mux into mp4s."""
import math, struct, wave, random, subprocess, os, sys

random.seed(42)
SR = 44100

NOTE = lambda semis: 440.0 * (2 ** (semis / 12.0))

# chord progressions (semitone offsets from root) — pleasant loops
PROGRESSIONS = [
    [0, 3, 7], [-4, 0, 3], [-5, -1, 2], [-2, 2, 5],           # Am F C G-ish shapes
    [0, 4, 7], [2, 5, 9], [-3, 0, 4], [-1, 2, 7],
]

def synth_track(seed: int, duration: float, root: float, bpm: int) -> str:
    rng = random.Random(seed)
    prog = [PROGRESSIONS[rng.randrange(len(PROGRESSIONS))],
            PROGRESSIONS[rng.randrange(len(PROGRESSIONS))],
            PROGRESSIONS[rng.randrange(len(PROGRESSIONS))],
            PROGRESSIONS[rng.randrange(len(PROGRESSIONS))]]
    n = int(duration * SR)
    buf = [0.0] * n
    beat = 60.0 / bpm
    chord_len = beat * 4  # one chord per bar

    def pluck(start, freq, amp, decay=6.0, length=1.2):
        s = int(start * SR)
        L = int(length * SR)
        for i in range(L):
            idx = s + i
            if idx >= n: break
            t = i / SR
            env = math.exp(-decay * t) * (1 - math.exp(-400 * t))
            # soft square-ish tone via 2 harmonics
            v = (math.sin(2 * math.pi * freq * t)
                 + 0.35 * math.sin(4 * math.pi * freq * t)
                 + 0.15 * math.sin(6 * math.pi * freq * t))
            buf[idx] += amp * env * v

    def hat(start, amp=0.05):
        s = int(start * SR)
        L = int(0.05 * SR)
        rng2 = random.Random(int(start * 1000))
        for i in range(L):
            idx = s + i
            if idx >= n: break
            env = math.exp(-60 * i / SR)
            buf[idx] += amp * env * (rng2.random() * 2 - 1)

    t = 0.0
    bar = 0
    while t < duration:
        chord = prog[bar % 4]
        # bass on beat 1 & 3
        pluck(t, root * NOTE(chord[0]) / 2, 0.30, decay=3.0, length=beat * 1.8)
        pluck(t + beat * 2, root * NOTE(chord[0]) / 2, 0.24, decay=3.0, length=beat * 1.8)
        # arpeggio 8ths
        for k in range(8):
            note = chord[k % len(chord)] + (12 if k % 5 == 4 else 0)
            pluck(t + k * beat / 2, root * NOTE(note), 0.16, decay=5.0, length=0.9)
        # hats on off-beats
        for k in range(4):
            hat(t + beat * (k + 0.5), amp=0.035 + rng.random() * 0.02)
        t += chord_len
        bar += 1

    # normalize + gentle fade in/out
    peak = max(1e-9, max(abs(x) for x in buf))
    gain = 0.85 / peak
    fade = int(0.35 * SR)
    for i in range(n):
        g = gain
        if i < fade: g *= i / fade
        if i > n - fade: g *= (n - i) / fade
        buf[i] *= g

    path = f"/tmp/track_{seed}.wav"
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in buf))
    return path

VID_DIR = "/home/z/my-project/public/videos"

specs = []  # (file, seed, rootHz, bpm)
roots = [220.0, 246.94, 261.63, 293.66, 196.0, 233.08, 174.61, 207.65]
for i in range(1, 17):
    specs.append((f"v{i:02d}.mp4", i, roots[i % len(roots)], 76 + (i * 5) % 40))

for fname, seed, root, bpm in specs:
    duration = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", f"{VID_DIR}/{fname}"]).decode().strip())
    wav = synth_track(seed, duration, root, bpm)
    out = f"{VID_DIR}/{fname}.tmp.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{VID_DIR}/{fname}", "-i", wav,
                    "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "96k",
                    "-shortest", "-movflags", "+faststart", out], check=True)
    os.replace(out, f"{VID_DIR}/{fname}")
    print(f"{fname}: {duration:.0f}s @ {bpm}bpm root {root:.0f}Hz ✓")

# duplicate video shares v01's audio (audio fingerprint match)
dur1 = float(subprocess.check_output(
    ["ffprobe", "-v", "error", "-show_entries", "format=duration",
     "-of", "csv=p=0", f"{VID_DIR}/v01.mp4"]).decode().strip())
wav = synth_track(1, dur1, roots[1], 81)
out = f"{VID_DIR}/v01_dup.mp4.tmp.mp4"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{VID_DIR}/v01_dup.mp4", "-i", wav,
                "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "64k",
                "-shortest", "-movflags", "+faststart", out], check=True)
os.replace(out, f"{VID_DIR}/v01_dup.mp4")
print("v01_dup.mp4: shares v01 audio ✓")
print("ALL AUDIO DONE")
