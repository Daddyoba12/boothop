"""
BootHop Promo Video Generator
Records live pages from boothop.com, combines with music (skipping 28-30s).
Output: output/boothop_promo.mp4
"""

import asyncio
import os
import shutil
from pathlib import Path

from playwright.async_api import async_playwright
from moviepy import VideoFileClip, AudioFileClip, concatenate_videoclips, concatenate_audioclips

# ── Config ────────────────────────────────────────────────────────────────────
BASE_URL   = "https://www.boothop.com"
AUDIO_FILE = Path(__file__).parent / "shana.mp3"
OUTPUT_DIR = Path(__file__).parent / "output"
CLIPS_DIR  = Path(__file__).parent / "clips"
FINAL_OUT  = OUTPUT_DIR / "boothop_promo.mp4"

# Pages to record: (path, duration_seconds, description)
PAGES = [
    ("/",             6,  "Home"),
    ("/how-it-works", 6,  "How It Works"),
    ("/journeys",     7,  "Live Journeys"),
    ("/trust-safety", 5,  "Trust & Safety"),
    ("/pricing",      5,  "Pricing"),
    ("/register",     5,  "Get Started"),
]

VIDEO_WIDTH  = 1280
VIDEO_HEIGHT = 720

# ── Helpers ───────────────────────────────────────────────────────────────────

async def record_page(browser, path: str, duration: int, clip_dir: Path) -> Path:
    """Record a single page as a webm video clip."""
    context = await browser.new_context(
        viewport={"width": VIDEO_WIDTH, "height": VIDEO_HEIGHT},
        record_video_dir=str(clip_dir),
        record_video_size={"width": VIDEO_WIDTH, "height": VIDEO_HEIGHT},
    )
    page = await context.new_page()

    url = BASE_URL + path
    print(f"  > Recording {url} for {duration}s ...")

    await page.goto(url, wait_until="networkidle", timeout=30_000)

    # Smooth scroll to show content
    await page.evaluate("""async () => {
        const totalHeight = document.body.scrollHeight;
        const steps = 30;
        for (let i = 0; i <= steps; i++) {
            window.scrollTo(0, (totalHeight * i) / steps);
            await new Promise(r => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
    }""")

    # Wait remaining time
    await asyncio.sleep(max(duration - 4, 1))

    # Grab the video path before closing
    video_path = await page.video.path()
    await context.close()       # finishes writing the webm

    return Path(video_path)


def build_spliced_audio(audio_path: Path, video_duration: float) -> AudioFileClip:
    """Load audio, splice out 28-30 s, loop/trim to video length."""
    full = AudioFileClip(str(audio_path))

    part1 = full.subclipped(0, 28)
    part2 = full.subclipped(30, full.duration)
    spliced = concatenate_audioclips([part1, part2])

    # Loop if shorter than video, trim if longer
    if spliced.duration < video_duration:
        loops_needed = int(video_duration / spliced.duration) + 1
        spliced = concatenate_audioclips([spliced] * loops_needed)

    return spliced.subclipped(0, video_duration)


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

    # Convert webm → mp4 clips and collect
    print("\nProcessing clips ...")
    video_clips = []
    for raw in raw_clips:
        clip = VideoFileClip(str(raw))
        video_clips.append(clip)

    # Concatenate all clips
    final_video = concatenate_videoclips(video_clips, method="compose")

    # Build audio
    print("Building audio (splicing 28-30s) ...")
    audio = build_spliced_audio(AUDIO_FILE, final_video.duration)

    # Combine
    final_video = final_video.with_audio(audio)

    print(f"\nRendering final video -> {FINAL_OUT}")
    final_video.write_videofile(
        str(FINAL_OUT),
        fps=30,
        codec="libx264",
        audio_codec="aac",
        threads=4,
        logger="bar",
    )

    # Cleanup raw webm clips
    shutil.rmtree(CLIPS_DIR, ignore_errors=True)

    print(f"\nDone! Video saved to: {FINAL_OUT}")


if __name__ == "__main__":
    asyncio.run(main())
