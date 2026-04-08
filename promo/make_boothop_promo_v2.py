"""
BootHop Promo Video Generator v2
- Slower scrolling so content is readable
- Longer time on each page
- Contact page shown at end
Output: output/boothop_promo_v2.mp4
"""

import asyncio
import shutil
from pathlib import Path

from playwright.async_api import async_playwright
from moviepy import VideoFileClip, AudioFileClip, ImageClip, concatenate_videoclips, concatenate_audioclips

# ── Config ────────────────────────────────────────────────────────────────────
BASE_URL   = "https://www.boothop.com"
AUDIO_FILE = Path(__file__).parent / "shana.mp3"
OUTPUT_DIR = Path(__file__).parent / "output"
CLIPS_DIR  = Path(__file__).parent / "clips_v2"
FINAL_OUT  = OUTPUT_DIR / "boothop_promo_v2.mp4"

# Pages to record: (path, duration_seconds, description)
# Increased durations — slower scroll + more reading time
PAGES = [
    ("/",             10, "Home"),
    ("/how-it-works", 12, "How It Works"),
    ("/journeys",     12, "Live Journeys"),
    ("/trust-safety",  9, "Trust & Safety"),
    ("/pricing",       9, "Pricing"),
    ("/register",      8, "Get Started"),
    ("/contact",       8, "Contact Us"),
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

    # Slow smooth scroll — 60 steps, 220ms each = ~13s full scroll
    await page.evaluate("""async () => {
        const totalHeight = document.body.scrollHeight;
        const steps = 60;
        const delay = 220;
        for (let i = 0; i <= steps; i++) {
            window.scrollTo(0, (totalHeight * i) / steps);
            await new Promise(r => setTimeout(r, delay));
        }
        // Pause at bottom briefly
        await new Promise(r => setTimeout(r, 800));
        // Scroll back up slowly
        for (let i = steps; i >= 0; i--) {
            window.scrollTo(0, (totalHeight * i) / steps);
            await new Promise(r => setTimeout(r, 80));
        }
    }""")

    # Wait any remaining time
    scroll_time = (60 * 220 + 800 + 60 * 80) / 1000  # ~18s
    remaining = duration - scroll_time - 1
    if remaining > 0:
        await asyncio.sleep(remaining)

    video_path = await page.video.path()
    await context.close()

    return Path(video_path)


def build_spliced_audio(audio_path: Path, video_duration: float) -> AudioFileClip:
    """Load audio, splice out 28-30 s, loop/trim to video length."""
    full = AudioFileClip(str(audio_path))

    part1 = full.subclipped(0, 28)
    part2 = full.subclipped(30, full.duration)
    spliced = concatenate_audioclips([part1, part2])

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
            clip_dir = CLIPS_DIR / label.replace(" ", "_").replace("&", "and")
            clip_dir.mkdir(parents=True, exist_ok=True)
            raw = await record_page(browser, path, duration, clip_dir)
            raw_clips.append(raw)
            print(f"    saved: {raw}")

        await browser.close()

    print("\nProcessing clips ...")
    video_clips = []
    for raw in raw_clips:
        clip = VideoFileClip(str(raw))
        video_clips.append(clip)

    final_video = concatenate_videoclips(video_clips, method="compose")

    print("Building audio (splicing 28-30s) ...")
    audio = build_spliced_audio(AUDIO_FILE, final_video.duration)

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

    shutil.rmtree(CLIPS_DIR, ignore_errors=True)
    print(f"\nDone! Video saved to: {FINAL_OUT}")


if __name__ == "__main__":
    asyncio.run(main())
