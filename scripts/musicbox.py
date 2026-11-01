#!/usr/bin/env python3
"""Music-box lullaby generator — soft celesta-like melodies for kids demo videos."""
import numpy as np, wave, sys

SR = 44100

# C major pentatonic across octaves (MIDI)
BASE = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84]

def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)

def musicbox(seed: int, duration: float) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = int(duration * SR)
    buf = np.zeros(n)
    bpm = rng.integers(84, 100)
    beat = 60.0 / bpm
    # melody: eighth notes with rests
    t = 0.0
    prev = 4
    while t < duration - 0.5:
        if rng.random() < 0.82:  # note density
            # random-walk over scale
            step = rng.integers(-2, 3)
            prev = int(np.clip(prev + step, 0, len(BASE) - 1))
            m = BASE[prev]
            if rng.random() < 0.18:
                m += 12  # sparkle octave
            amp = 0.16 + 0.1 * rng.random()
            add_note(buf, t, midi_hz(m), amp, length=1.6)
            # occasional soft harmony third above
            if rng.random() < 0.22 and prev + 2 < len(BASE):
                add_note(buf, t + 0.02, midi_hz(BASE[int(np.clip(prev + 2, 0, len(BASE) - 1))]), amp * 0.4, length=1.2)
        t += beat / 2
    # gentle bass root every 2 bars
    tb = 0.0
    root = 48
    while tb < duration - 1:
        add_note(buf, tb, midi_hz(root), 0.10, decay=2.2, length=2.4)
        if rng.random() < 0.3:
            root = 48 if root != 48 else 50
        tb += beat * 4
    # normalize + fades
    peak = np.abs(buf).max()
    if peak > 0:
        buf = buf / peak * 0.55
    fade = int(SR * 1.2)
    env = np.ones(n)
    env[:fade] = np.linspace(0, 1, fade)
    env[-fade:] = np.linspace(1, 0, fade)
    return (buf * env * 32767 * 0.9).astype(np.int16)

def add_note(buf, start, freq, amp, decay=5.0, length=1.4):
    s = int(start * SR)
    L = int(length * SR)
    if s >= len(buf):
        return
    L = min(L, len(buf) - s)
    t = np.arange(L) / SR
    # celesta-ish: sine + quiet octave + tiny 3rd harmonic, fast attack, exp decay
    tone = (np.sin(2 * np.pi * freq * t)
            + 0.30 * np.sin(2 * np.pi * freq * 2 * t)
            + 0.08 * np.sin(2 * np.pi * freq * 3 * t))
    env = np.exp(-decay * t) * (1 - np.exp(-500 * t))
    buf[s:s + L] += amp * env * tone

if __name__ == "__main__":
    seed, duration, out = int(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
    data = musicbox(seed, duration)
    with wave.open(out, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"wrote {out} ({duration:.0f}s)")
