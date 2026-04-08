"""
Patches boothop_promo_v2.mp4:
  0-9s   → branded "Introducing BootHop" banner
  125-133s → live /help page recording
Everything else keeps original video + audio.
Output: output/boothop_promo_v2_patched.mp4
"""

import asyncio
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import numpy as np

from playwright.async_api import async_playwright
from moviepy import (
    VideoFileClip, ImageClip, CompositeVideoClip, ColorClip,
    concatenate_videoclips, AudioFileClip,
)

# ── Config ────────────────────────────────────────────────────────────────────
V2_PATH   = Path("C:/Users/babso/desktop/boothop/promo/output/boothop_promo_v2.mp4")
LOGO_PATH = Path("C:/Users/babso/desktop/boothop/public/images/boothop1.png")
OUT_PATH  = Path("C:/Users/babso/desktop/boothop/promo/output/boothop_promo_v2_patched.mp4")
TMP_DIR   = Path("C:/Users/babso/desktop/boothop/promo/tmp_patch")

BASE_URL  = "https://www.boothop.com"

INTRO_START = 0
INTRO_END   = 9      # seconds

HELP_START  = 125    # 2:05
HELP_END    = 143    # 2:23  — 18s so scroll is fully visible

V_W, V_H = 1280, 720


# ── 1. Build intro banner frame ───────────────────────────────────────────────

def make_intro_image() -> np.ndarray:
    img = Image.new("RGB", (V_W, V_H), (6, 15, 40))
    draw = ImageDraw.Draw(img)

    # Background gradient (horizontal blue sweep)
    for x in range(V_W):
        t = x / V_W
        r = int(6  + t * 10)
        g = int(15 + t * 30)
        b = int(40 + t * 120)
        draw.line([(x, 0), (x, V_H)], fill=(r, g, b))

    # Glow circle behind logo
    cx, cy = V_W // 2, V_H // 2 - 60
    for radius in range(180, 100, -4):
        alpha = int(18 * (1 - (radius - 100) / 80))
        draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius],
                     fill=(30, 100, 230, 0))  # PIL RGB, no alpha in RGB mode

    # Logo
    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo_size = 160
    logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
    # paste with alpha
    temp = Image.new("RGB", img.size, (0, 0, 0))
    temp.paste(img)
    mask = logo.split()[3] if logo.mode == "RGBA" else None
    logo_x = (V_W - logo_size) // 2
    logo_y = cy - logo_size // 2
    temp.paste(logo.convert("RGB"), (logo_x, logo_y), mask)
    img = temp
    draw = ImageDraw.Draw(img)

    # "Introducing" text
    try:
        font_intro = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 52)
        font_name  = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 80)
        font_tag   = ImageFont.truetype("C:/Windows/Fonts/arial.ttf",   32)
    except Exception:
        font_intro = font_name = font_tag = ImageFont.load_default()

    intro_text = "Introducing"
    tw = draw.textlength(intro_text, font=font_intro)
    draw.text(((V_W - tw) / 2, logo_y + logo_size + 18), intro_text,
              fill=(140, 200, 255), font=font_intro)

    name_text = "BootHop"
    tw2 = draw.textlength(name_text, font=font_name)
    draw.text(((V_W - tw2) / 2, logo_y + logo_size + 72), name_text,
              fill=(255, 255, 255), font=font_name)

    tag_text = "Ship Anything. Anywhere. With a Verified Traveller."
    tw3 = draw.textlength(tag_text, font=font_tag)
    draw.text(((V_W - tw3) / 2, logo_y + logo_size + 168), tag_text,
              fill=(100, 180, 255), font=font_tag)

    return np.array(img)


# ── 2. Record /help page ──────────────────────────────────────────────────────

async def record_help(duration: int, clip_dir: Path) -> Path:
    clip_dir.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": V_W, "height": V_H},
            record_video_dir=str(clip_dir),
            record_video_size={"width": V_W, "height": V_H},
        )
        page = await context.new_page()
        url = f"{BASE_URL}/help"
        print(f"  Recording {url} for {duration}s ...")
        await page.goto(url, wait_until="networkidle", timeout=30_000)
        await asyncio.sleep(0.5)

        # Scroll down slowly through entire page — uses ~(duration - 1)s
        scroll_time_ms = int((duration - 1.0) * 1000)
        steps = 60
        delay_ms = scroll_time_ms // steps
        await page.evaluate(f"""async () => {{
            const h = document.body.scrollHeight;
            const steps = {steps};
            const delay = {delay_ms};
            for (let i = 0; i <= steps; i++) {{
                window.scrollTo(0, h * i / steps);
                await new Promise(r => setTimeout(r, delay));
            }}
        }}""")

        await asyncio.sleep(0.5)
        video_path = await page.video.path()
        await context.close()
        await browser.close()
    return Path(video_path)


# ── 3. Splice everything ──────────────────────────────────────────────────────

async def main():
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # -- Load original v2 video
    original = VideoFileClip(str(V2_PATH))
    total    = original.duration
    print(f"Original v2 duration: {total:.1f}s")

    # -- Build intro banner clip
    print("Building intro banner ...")
    banner_frame = make_intro_image()
    intro_clip   = (ImageClip(banner_frame, duration=INTRO_END - INTRO_START)
                    .with_fps(30))

    # -- Record /help
    help_duration = HELP_END - HELP_START
    help_raw = await record_help(help_duration, TMP_DIR / "help")
    help_clip = VideoFileClip(str(help_raw)).subclipped(0, help_duration)

    # -- Splice video track:
    #    intro (0-9s)  |  original[9..125]  |  help[0..8s]  |  original[133..end]
    seg_mid  = original.subclipped(INTRO_END, HELP_START)
    seg_tail = original.subclipped(HELP_END, total)

    final_video = concatenate_videoclips(
        [intro_clip, seg_mid, help_clip, seg_tail],
        method="compose"
    )

    # -- Re-attach original audio (unchanged)
    final_video = final_video.with_audio(original.audio)

    print(f"Final duration: {final_video.duration:.1f}s  (was {total:.1f}s)")
    print(f"Rendering -> {OUT_PATH}")

    final_video.write_videofile(
        str(OUT_PATH),
        fps=30,
        codec="libx264",
        audio_codec="aac",
        threads=4,
        logger="bar",
    )

    # Cleanup
    import shutil
    shutil.rmtree(TMP_DIR, ignore_errors=True)
    print(f"\nDone!  {OUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
