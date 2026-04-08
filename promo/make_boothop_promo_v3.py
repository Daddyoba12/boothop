"""
BootHop Promo Video Generator v3
- Vertical 9:16 (1080x1920) — TikTok / Instagram Reels / Mobile
- Slow readable scrolling
- Continuous looping music (28-30s spliced out)
- Contact page at end
Output: output/boothop_promo_v3_vertical.mp4
"""

import asyncio
import shutil
from pathlib import Path

from playwright.async_api import async_playwright
from moviepy import (
    VideoFileClip, AudioFileClip,
    concatenate_videoclips, concatenate_audioclips,
    ColorClip, CompositeVideoClip, vfx,
)

# ── Config ────────────────────────────────────────────────────────────────────
BASE_URL   = "https://www.boothop.com"
AUDIO_FILE = Path(__file__).parent / "shana.mp3"
OUTPUT_DIR = Path(__file__).parent / "output"
CLIPS_DIR  = Path(__file__).parent / "clips_v3"
FINAL_OUT  = OUTPUT_DIR / "boothop_promo_v3_vertical.mp4"

# Mobile viewport — close to 9:16
REC_W = 390
REC_H = 844

# Output dimensions (TikTok/Reels)
OUT_W = 1080
OUT_H = 1920

# Pages: (path, duration_seconds, label)
PAGES = [
    ("/",             11, "Home"),
    ("/how-it-works", 13, "How It Works"),
    ("/journeys",     13, "Live Journeys"),
    ("/trust-safety", 10, "Trust and Safety"),
    ("/pricing",      10, "Pricing"),
    ("/register",      9, "Get Started"),
    ("/contact",      10, "Contact Us"),
]

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
    print(f"  > Recording {url} for {duration}s ...")

    await page.goto(url, wait_until="networkidle", timeout=30_000)
    await asyncio.sleep(1.0)

    # Slow scroll down — 70 steps * 230ms = ~16s down, quick scroll up
    await page.evaluate("""async () => {
        const totalHeight = document.body.scrollHeight;
        const steps = 70;
        for (let i = 0; i <= steps; i++) {
            window.scrollTo(0, (totalHeight * i) / steps);
            await new Promise(r => setTimeout(r, 230));
        }
        await new Promise(r => setTimeout(r, 1000));
        for (let i = steps; i >= 0; i--) {
            window.scrollTo(0, (totalHeight * i) / steps);
            await new Promise(r => setTimeout(r, 60));
        }
    }""")

    scroll_time = (70 * 230 + 1000 + 70 * 60) / 1000
    remaining = duration - scroll_time - 1.0
    if remaining > 0:
        await asyncio.sleep(remaining)

    video_path = await page.video.path()
    await context.close()
    return Path(video_path)


def pad_to_vertical(clip: VideoFileClip) -> CompositeVideoClip:
    """Scale clip to fit 1080 wide, then pad top/bottom to reach 1920."""
    scaled = clip.resized(width=OUT_W)
    pad_total = OUT_H - scaled.h
    pad_top = pad_total // 2
    bg = ColorClip(size=(OUT_W, OUT_H), color=(10, 10, 30), duration=scaled.duration)
    return CompositeVideoClip([bg, scaled.with_position(("center", pad_top))])


def build_continuous_audio(audio_path: Path, video_duration: float) -> AudioFileClip:
    """Splice out 28-30s, loop seamlessly to fill video."""
    full = AudioFileClip(str(audio_path))
    part1 = full.subclipped(0, 28)
    part2 = full.subclipped(30, full.duration)
    spliced = concatenate_audioclips([part1, part2])
    loops_needed = int(video_duration / spliced.duration) + 2
    looped = concatenate_audioclips([spliced] * loops_needed)
    return looped.subclipped(0, video_duration)


# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)

    raw_clips: list[Path] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)

        for path, duration, label in PAGES:
            clip_dir = CLIPS_DIR / label.replace(" ", "_")
            clip_dir.mkdir(parents=True, exist_ok=True)
            raw = await record_page(browser, path, duration, clip_dir)
            raw_clips.append(raw)
            print(f"    saved: {raw}")

        await browser.close()

    print("\nProcessing and scaling clips to 1080x1920 ...")
    video_clips = []
    for raw in raw_clips:
        clip = VideoFileClip(str(raw))
        padded = pad_to_vertical(clip)
        video_clips.append(padded)

    final_video = concatenate_videoclips(video_clips, method="compose")

    print("Building continuous audio ...")
    audio = build_continuous_audio(AUDIO_FILE, final_video.duration)
    final_video = final_video.with_audio(audio)

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
    print(f"\nDone! TikTok/Reels video: {FINAL_OUT}")


if __name__ == "__main__":
    asyncio.run(main())
