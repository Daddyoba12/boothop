"""
BootHop Final Promo — 45 seconds
- Vertical 9:16 (1080x1920) — TikTok / Instagram Reels / Mobile
- Music: Redemption ft Nemzz, starting from 10s in
- Slow, readable scrolling on each page
- Pages timed to fill exactly 45s
Output: output/boothop_final.mp4
"""

import asyncio
import shutil
from pathlib import Path

from playwright.async_api import async_playwright
from moviepy import (
    VideoFileClip, AudioFileClip,
    concatenate_videoclips,
    ColorClip, CompositeVideoClip,
)

# ── Config ────────────────────────────────────────────────────────────────────
BASE_URL   = "https://www.boothop.com"
AUDIO_FILE = Path(__file__).parent / "redemption.mp3"
AUDIO_START = 10          # start music from 10 seconds in
OUTPUT_DIR = Path(__file__).parent / "output"
CLIPS_DIR  = Path(__file__).parent / "clips_final"
FINAL_OUT  = OUTPUT_DIR / "boothop_final.mp4"

# Mobile viewport
REC_W = 390
REC_H = 844

# Output: TikTok / Reels / Shorts
OUT_W = 1080
OUT_H = 1920

# Pages timed to ~45s total
# (path, duration_seconds, label)
PAGES = [
    ("/",             9,  "Home"),
    ("/how-it-works", 9,  "How_It_Works"),
    ("/journeys",     9,  "Live_Journeys"),
    ("/trust-safety", 7,  "Trust_Safety"),
    ("/pricing",      6,  "Pricing"),
    ("/register",     5,  "Get_Started"),
]
# Total = 45s

# ── Scroll config — slow enough to read ──────────────────────────────────────
# For each page the scroll takes about 7s (slow down) then hold 1s at bottom
SCROLL_STEPS  = 55
SCROLL_DELAY  = 130   # ms per step downward  (55 * 130 = 7150ms ≈ 7s)
BOTTOM_HOLD   = 900   # ms pause at bottom
SCROLL_UP_MS  = 40    # ms per step back up

# ── Helpers ───────────────────────────────────────────────────────────────────

async def record_page(browser, path: str, duration: int, clip_dir: Path) -> Path:
    context = await browser.new_context(
        viewport={"width": REC_W, "height": REC_H},
        is_mobile=True,
        has_touch=True,
        record_video_dir=str(clip_dir),
        record_video_size={"width": REC_W, "height": REC_H},
    )
    page = await context.new_page()
    url = BASE_URL + path
    print(f"  > {url}  ({duration}s)")

    await page.goto(url, wait_until="networkidle", timeout=30_000)
    await asyncio.sleep(1.2)   # let page settle / animations finish

    # Slow scroll down then quick up
    await page.evaluate(f"""async () => {{
        const totalHeight = document.body.scrollHeight;
        const steps  = {SCROLL_STEPS};
        const delay  = {SCROLL_DELAY};
        const hold   = {BOTTOM_HOLD};
        const upMs   = {SCROLL_UP_MS};
        for (let i = 0; i <= steps; i++) {{
            window.scrollTo(0, totalHeight * i / steps);
            await new Promise(r => setTimeout(r, delay));
        }}
        await new Promise(r => setTimeout(r, hold));
        for (let i = steps; i >= 0; i--) {{
            window.scrollTo(0, totalHeight * i / steps);
            await new Promise(r => setTimeout(r, upMs));
        }}
    }}""")

    scroll_total = (SCROLL_STEPS * SCROLL_DELAY + BOTTOM_HOLD + SCROLL_STEPS * SCROLL_UP_MS) / 1000
    remaining = duration - scroll_total - 1.2
    if remaining > 0:
        await asyncio.sleep(remaining)

    video_path = await page.video.path()
    await context.close()
    return Path(video_path)


def pad_to_vertical(clip: VideoFileClip) -> CompositeVideoClip:
    """Scale to 1080 wide then letterbox top/bottom to 1920 with dark bg."""
    scaled = clip.resized(width=OUT_W)
    pad_y  = max((OUT_H - scaled.h) // 2, 0)
    bg     = ColorClip(size=(OUT_W, OUT_H), color=(8, 12, 28), duration=scaled.duration)
    return CompositeVideoClip([bg, scaled.with_position(("center", pad_y))])


# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)

    raw_clips: list[Path] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)

        for path, duration, label in PAGES:
            clip_dir = CLIPS_DIR / label
            clip_dir.mkdir(parents=True, exist_ok=True)
            raw = await record_page(browser, path, duration, clip_dir)
            raw_clips.append(raw)
            print(f"    clip: {raw.name}")

        await browser.close()

    print("\nScaling clips to 1080x1920 ...")
    video_clips = []
    for raw in raw_clips:
        clip   = VideoFileClip(str(raw))
        padded = pad_to_vertical(clip)
        video_clips.append(padded)

    final_video = concatenate_videoclips(video_clips, method="compose")
    total = final_video.duration
    print(f"Total video length: {total:.1f}s")

    # Music: start at 10s, take exactly as long as the video
    print(f"Cutting audio from {AUDIO_START}s ...")
    full_audio  = AudioFileClip(str(AUDIO_FILE))
    audio_clip  = full_audio.subclipped(AUDIO_START, AUDIO_START + total)

    final_video = final_video.with_audio(audio_clip)

    print(f"\nRendering -> {FINAL_OUT}")
    final_video.write_videofile(
        str(FINAL_OUT),
        fps=30,
        codec="libx264",
        audio_codec="aac",
        threads=4,
        logger="bar",
    )

    shutil.rmtree(CLIPS_DIR, ignore_errors=True)
    print(f"\nDone!  {FINAL_OUT}")


if __name__ == "__main__":
    asyncio.run(main())
