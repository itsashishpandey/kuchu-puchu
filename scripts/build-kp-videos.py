#!/usr/bin/env python3
"""Build Kuchu Puchu demo videos: Ken Burns + music-box audio.
Validates existing outputs (duration + audio stream); rebuilds missing/invalid ones."""
import os, subprocess, sys

MASTERS = "/home/z/my-project/scripts/masters"
AUD = "/home/z/my-project/scripts/audio"
VID = "/home/z/my-project/public/videos"
os.makedirs(AUD, exist_ok=True)

DURS = [47, 52, 49, 51, 45, 43, 46, 40, 40, 57, 42, 48, 41, 42, 48, 44]
STYLES = [0, 1, 2, 3, 1, 0, 3, 2, 1, 0, 2, 3, 0, 1, 2, 3]

def motion(style, frames):
    if style == 0:
        return "1+0.14*on/{f}", "iw/2-(iw/zoom)/2", "ih/2-(ih/zoom)/2"
    if style == 1:
        return "1.14-0.14*on/{f}", "iw/2-(iw/zoom)/2", "ih/2-(ih/zoom)/2"
    if style == 2:
        return "1+0.12*on/{f}", "iw/2-(iw/zoom)/2", "(ih-ih/zoom)*(1-0.85*on/{f})"
    return "1+0.12*on/{f}", "iw/2-(iw/zoom)/2", "(ih-ih/zoom)*(0.15+0.85*on/{f})"

def valid(path, dur):
    if not os.path.exists(path) or os.path.getsize(path) < 100_000:
        return False
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "stream=codec_type", "-of", "csv=p=0", path],
            capture_output=True, text=True, timeout=30).stdout.split()
        d = float(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
            capture_output=True, text=True, timeout=30).stdout.strip())
        return "audio" in out and "video" in out and abs(d - dur) < 1.0
    except Exception:
        return False

def build(i, force=False):
    dur = DURS[i - 1]
    vid = os.path.join(VID, f"v{i:02d}.mp4")
    if not force and valid(vid, dur):
        print(f"v{i:02d} valid, skip")
        return
    frames = dur * 20
    zt, xt, yt = motion(STYLES[i - 1], frames)
    z, x, y = zt.format(f=frames), xt.format(f=frames), yt.format(f=frames)
    wav = os.path.join(AUD, f"v{i:02d}.wav")
    subprocess.run(["python3", "/home/z/my-project/scripts/musicbox.py", str(i), str(dur), wav], check=True)
    fc = (f"[0:v]scale=1080:1920:flags=lanczos,"
          f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s=720x1280:fps=20,format=yuv420p[v]")
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-loop", "1", "-i", os.path.join(MASTERS, f"th{i:02d}.png"),
        "-i", wav,
        "-filter_complex", fc, "-map", "[v]", "-map", "1:a", "-t", str(dur),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "27",
        "-c:a", "aac", "-b:a", "64k", "-ar", "44100",
        "-movflags", "+faststart", vid,
    ], check=True)
    print(f"built v{i:02d}.mp4 ({dur}s) size={os.path.getsize(vid)//1024}KB")

if __name__ == "__main__":
    args = sys.argv[1:]
    force = "--force" in args
    nums = [int(a) for a in args if a.isdigit()]
    todo = nums if nums else list(range(1, 17))
    for i in todo:
        try:
            build(i, force)
        except subprocess.CalledProcessError as e:
            print(f"ERROR v{i:02d}: {e}")
    # duplicate demo file
    dup = os.path.join(VID, "v01_dup.mp4")
    if not valid(dup, DURS[0]) or force:
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(VID, "v01.mp4"),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
            "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", dup], check=True)
        print("built v01_dup.mp4")
    print("DRIVER PASS COMPLETE")
