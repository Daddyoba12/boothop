"""
BootHop Hero Reel — v2 (cinematic bokeh treatment)

Problem: source footage is 480x270 — upscaling to 1280x720 looks pixelated.
Fix:
  - Scale to 960x540 (2x native, less artefacts)
  - Heavy Gaussian blur (sigma 8) hides pixelation, creates premium bokeh
  - Slight desaturation + strong emerald colour grade
  - Vignette darkens edges
  - Slow-mo 0.72x
  - CSS will do final upscale + adds filter:blur(2px) so edges blur further
  - Cross-dissolve 1.2s between clips
  - Output ~1.5 MB target
"""

import subprocess, os, sys, shutil, tempfile
sys.stdout.reconfigure(encoding='utf-8')

FFMPEG  = r'C:\Users\babso\Downloads\ffmpeg-2025-12-28-git-9ab2a437a1-essentials_build\ffmpeg-2025-12-28-git-9ab2a437a1-essentials_build\bin\ffmpeg.exe'
FFPROBE = FFMPEG.replace('ffmpeg.exe', 'ffprobe.exe')
SRC     = r'C:\Users\babso\Desktop\Boothop\public\videos\onecall'
OUT     = r'C:\Users\babso\Desktop\Boothop\public\business\hero-reel.mp4'
TMP     = tempfile.mkdtemp()

W, H   = 960, 540   # encode at 2x native, CSS scales to full screen
FPS    = 30
SLOW   = 0.72       # 72% speed — very slightly slow
XFADE  = 1.2        # crossfade seconds
MAX_S  = 9          # max seconds per clip

# Cinematic grade:
#  - blur sigma 8: hides low-res artefacts, creates intentional bokeh
#  - eq: slightly darker, more contrast, -30% saturation (desaturate for moodiness)
#  - colorchannelmixer: deep emerald push (BootHop brand)
#  - vignette: dark corners
VFILTER = (
    f"scale={W}:{H}:force_original_aspect_ratio=increase,"
    f"crop={W}:{H},"
    f"fps={FPS},"
    f"setpts={1/SLOW:.4f}*PTS,"
    "gblur=sigma=8,"
    "eq=brightness=-0.08:contrast=1.15:saturation=0.65,"
    "colorchannelmixer="
        "rr=0.80:rg=0.04:rb=0.00:"
        "gr=0.00:gg=0.92:gb=0.08:"
        "br=0.00:bg=0.08:bb=0.88,"
    f"vignette=angle=PI/3.5:mode=backward,"
    f"trim=duration={MAX_S},"
    "setpts=PTS-STARTPTS"
)

clips = [
    os.path.join(SRC, 'planex.mp4'),
    os.path.join(SRC, 'Aboutus_train.mp4'),
    os.path.join(SRC, 'AboutusMov.mp4'),
]

prepared = []
for i, src in enumerate(clips):
    out = os.path.join(TMP, f'c{i}.mp4')
    r = subprocess.run([
        FFMPEG, '-y', '-i', src,
        '-vf', VFILTER,
        '-an',
        '-c:v', 'libx264', '-crf', '22', '-preset', 'fast',
        '-pix_fmt', 'yuv420p',
        out
    ], capture_output=True, text=True)
    if r.returncode != 0:
        print(f'ERROR clip {i}:', r.stderr[-300:])
        sys.exit(1)
    kb = os.path.getsize(out) // 1024
    print(f'  clip {i}: {kb}kb')
    prepared.append(out)

def get_dur(p):
    r = subprocess.run([FFPROBE,'-v','error','-show_entries','format=duration',
                        '-of','csv=p=0', p], capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except: return float(MAX_S)

durs = [get_dur(p) for p in prepared]
print('Durations:', [f'{d:.2f}s' for d in durs])

# Build xfade filter chain
inputs = []
for p in prepared:
    inputs += ['-i', p]

parts, offset, prev = [], 0.0, '0:v'
for i in range(1, len(prepared)):
    offset += durs[i-1] - XFADE
    tag = f'v{i:02d}'
    parts.append(
        f'[{prev}][{i}:v]xfade=transition=fade:duration={XFADE}:offset={offset:.3f}[{tag}]'
    )
    prev = tag

print('Building final reel...')
r = subprocess.run([
    FFMPEG, '-y', *inputs,
    '-filter_complex', ';'.join(parts),
    '-map', f'[{prev}]',
    '-c:v', 'libx264', '-crf', '26', '-preset', 'slow',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    OUT
], capture_output=True, text=True)

if r.returncode != 0:
    print('FINAL ERROR:', r.stderr[-500:])
    sys.exit(1)

kb = os.path.getsize(OUT) // 1024
print(f'\nDone: hero-reel.mp4 {kb}kb')
shutil.rmtree(TMP, ignore_errors=True)
