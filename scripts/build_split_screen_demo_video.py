#!/usr/bin/env python3
"""
PayPal Sentinel — Professional Split-Screen Desktop + Mobile iPhone Demo Video Builder
Generates:
  - s:/PayPal/deliverables/video/PayPal-Sentinel-SplitScreen-Demo.mp4 (1920x1080, 30fps, H.264 + AAC)
  - s:/PayPal/deliverables/video/PayPal-Sentinel-SplitScreen-Demo.srt (Synchronized Subtitles)
Strictly under 3:00 minutes (~2:25 runtime) with synthesized executive voiceover,
real-time audio-reactive waveform, synchronized Desktop + Mobile iPhone 15 Pro frames,
animated callout highlights, and burned-in captions.
"""

import math
import os
import struct
import subprocess
import wave
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT_DIR = Path("s:/PayPal")
SCREENSHOT_DIR = ROOT_DIR / "deliverables" / "screenshots"
MOBILE_DIR = SCREENSHOT_DIR / "mobile"
VIDEO_DIR = ROOT_DIR / "deliverables" / "video"
AUDIO_TMP_DIR = VIDEO_DIR / "_audio_tmp"
FFMPEG_BIN = Path(r"C:\Program Files\GNU Octave\Octave-11.3.0\mingw64\bin\ffmpeg.exe")

WIDTH = 1920
HEIGHT = 1080
FPS = 30

SCENES = [
    {
        "id": "01",
        "title": "Executive Command Center & North-Star KPIs",
        "route": "sentinel.paypal.workspace/command-center",
        "metric_badge": "$26,960 Net Margin Protected · +38.4% YoY",
        "desktop_images": [
            "01-command-center-overview-3x2.png",
            "01-command-center-overview-3x2.png",
            "03-spotlight-cmd-k-assistant-3x2.png",
        ],
        "mobile_image": "mobile-tall-01-command-center.png",
        "narration": (
            "Welcome to PayPal Sentinel, the autonomous payment operations workspace built for ambitious merchants. "
            "In our Command Center, live scroll-triggered metrics track twenty-six thousand nine hundred sixty dollars "
            "in protected net margin, while our Quick Action studio lets treasury teams trigger invoices, dispute defenses, "
            "and supplier payouts in seconds."
        ),
        "subtitles": [
            "Welcome to PayPal Sentinel — the autonomous payment operations workspace for ambitious merchants.",
            "Live scroll-triggered KPIs track $26,960 in protected net margin, 16.0-day DSO, and an 84% dispute win rate.",
            "The Quick Action studio (Cmd+K) lets teams launch invoices, dispute defenses, and payouts in seconds.",
        ],
        "focus_boxes": [
            (80, 480, 1420, 680),   # KPI strip
            (80, 480, 1420, 680),   # KPI strip
            (340, 120, 1160, 450),  # Spotlight Cmd+K modal
        ],
    },
    {
        "id": "02",
        "title": "Live Execution Ledger & 30-Day Cash Waterfall",
        "route": "sentinel.paypal.workspace/command-center#ledger",
        "metric_badge": "Atomic 24h Idempotency Lock · Zero Duplicate Charges",
        "desktop_images": [
            "02-command-center-inspector-waterfall-3x2.png",
            "05-sdk-code-schema-inspector-3x2.png",
        ],
        "mobile_image": "mobile-02-command-center-ledger.png",
        "narration": (
            "Every autonomous action is recorded in our real-time execution ledger with a three-card verification inspector. "
            "Merchants can inspect atomic twenty-four-hour duplicate-charge locks, fraud risk signals, tamper-proof audit hashes, "
            "and our thirty-day cash inflow waterfall alongside multi-language PayPal SDK code."
        ),
        "subtitles": [
            "Every autonomous action is logged in the real-time execution ledger with a 3-card verification inspector.",
            "Inspect 24-hour atomic duplicate-charge locks, fraud risk signals, and 180-day tamper-proof audit hashes.",
            "Track the 30-day cash inflow waterfall and verify strongly-typed PayPal SDK payloads side by side.",
        ],
        "focus_boxes": [
            (80, 120, 1420, 920),
            (840, 80, 1480, 940),
        ],
    },
    {
        "id": "03",
        "title": "Policy Studio & Hardware Passkey Safety Gates",
        "route": "sentinel.paypal.workspace/policy-studio",
        "metric_badge": "Tier L0–L4 Guardrails · WebAuthn Hardware Sign-Off",
        "desktop_images": [
            "06-policy-studio-l0-l4-guardrails-3x2.png",
            "04-passkey-hitl-approval-modal-3x2.png",
            "07-policy-studio-simulator-rules-3x2.png",
        ],
        "mobile_image": "mobile-tall-03-policy-studio.png",
        "narration": (
            "In Policy Studio, CFOs configure five autonomy tiers from L0 Observe Only to L4 Full Auto. "
            "When an adversarial two-thousand-four-hundred-dollar refund is injected, Sentinel immediately pauses execution "
            "above the two-hundred-fifty-dollar cap and requires cryptographic hardware passkey approval."
        ),
        "subtitles": [
            "In Policy Studio, CFOs configure 5 autonomy tiers (L0 Observe Only through L4 Full Auto).",
            "When a $2,400 high-value refund is triggered, Sentinel automatically blocks unverified execution.",
            "Transactions exceeding the $250 cap require hardware passkey sign-off before touching PayPal.",
        ],
        "focus_boxes": [
            (80, 220, 1420, 620),
            (400, 160, 1100, 840),
            (80, 320, 1420, 920),
        ],
    },
    {
        "id": "04",
        "title": "Smart Invoicing, 72h Quiet Period & Fastlane QR",
        "route": "sentinel.paypal.workspace/invoicing-scheduler",
        "metric_badge": "-42.9% DSO Reduction · 28.0d down to 16.0d",
        "desktop_images": [
            "08-invoicing-scheduler-timeline-3x2.png",
            "09-invoicing-working-capital-histogram-3x2.png",
            "10-invoice-fastlane-qr-modal-3x2.png",
        ],
        "mobile_image": "mobile-tall-04-invoicing-scheduler.png",
        "narration": (
            "Smart Invoicing cuts Days Sales Outstanding from twenty-eight days down to sixteen days. "
            "Sentinel pairs a two percent Net-10 early-payment discount with a strict seventy-two-hour buyer quiet period, "
            "interactive working-capital recovery charts, and instant PayPal Fastlane QR checkout links."
        ),
        "subtitles": [
            "Smart Invoicing reduces Days Sales Outstanding by 42.9% — from 28.0 days down to 16.0 days.",
            "Combines a 2% Net-10 early-pay discount with a strict 72-hour customer quiet period guard.",
            "Generates instant PayPal Fastlane QR payment links and tracks working-capital recovery live.",
        ],
        "focus_boxes": [
            (80, 260, 1420, 880),
            (80, 420, 980, 950),
            (420, 130, 1080, 870),
        ],
    },
    {
        "id": "05",
        "title": "Automated Dispute Defense War Room",
        "route": "sentinel.paypal.workspace/dispute-war-room",
        "metric_badge": "84.0% Dispute Win Rate · +42.0 pts vs Baseline",
        "desktop_images": [
            "11-dispute-defense-war-room-3x2.png",
            "12-dispute-evidence-ocr-bundle-3x2.png",
        ],
        "mobile_image": "mobile-tall-05-dispute-war-room.png",
        "narration": (
            "When an item-not-received chargeback arrives, our Dispute Defense War Room maps the three-hop relationship "
            "across the buyer, order, and carrier tracking record. It compiles signed delivery receipts, customs declarations, "
            "and item serial numbers into a PayPal proof bundle, lifting dispute win rates to eighty-four percent."
        ),
        "subtitles": [
            "The Dispute Defense War Room maps the 3-hop Buyer, Order, and Carrier Delivery Graph automatically.",
            "Compiles signed carrier delivery proof, customs declarations, and serial records in under 4 seconds.",
            "Submits the complete evidence package to PayPal Disputes API, lifting win rates from 42% to 84%.",
        ],
        "focus_boxes": [
            (80, 250, 1420, 880),
            (80, 260, 1420, 920),
        ],
    },
    {
        "id": "06",
        "title": "Wholesale Fastlane Checkout & Instant PYUSD Bridge",
        "route": "sentinel.paypal.workspace/checkout-bridge",
        "metric_badge": "1.2s Cross-Border PYUSD Settlement · $0.001 Fee",
        "desktop_images": [
            "13-fastlane-checkout-pyusd-bridge-3x2.png",
        ],
        "mobile_image": "mobile-tall-06-checkout-bridge.png",
        "narration": (
            "On the buyer and supplier side, returning wholesale buyers complete restock orders in one click with PayPal Fastlane. "
            "Cross-border supplier invoices settle in one point two seconds using PayPal USD for a fraction of a cent, "
            "replacing forty-eight-dollar correspondent bank wires."
        ),
        "subtitles": [
            "Returning wholesale buyers complete B2B restock orders in 1 click via PayPal Fastlane.",
            "Cross-border supplier payouts settle in 1.2 seconds using PayPal USD (PYUSD) at $0.001 fee.",
            "Eliminates $48 correspondent wire fees and 4-day settlement delays for export merchants.",
        ],
        "focus_boxes": [
            (80, 220, 1420, 900),
        ],
    },
    {
        "id": "07",
        "title": "Mobile-First Governance, FAQs, Privacy & Terms",
        "route": "sentinel.paypal.workspace/about",
        "metric_badge": "100% Mobile Responsive · DPDP & PCI-DSS Compliant",
        "desktop_images": [
            "14-about-and-5-faqs-page-3x2.png",
            "15-privacy-and-terms-governance-3x2.png",
        ],
        "mobile_image": "mobile-tall-07-about.png",
        "narration": (
            "Finally, PayPal Sentinel is engineered with complete transparency and mobile-first ergonomics. "
            "Every screen adapts seamlessly to iPhone viewports with zero horizontal overflow, backed by comprehensive FAQs, "
            "Privacy Policy, Terms of Service, and instant empty-state and recovery controls. Thank you for watching."
        ),
        "subtitles": [
            "Engineered with Apple-grade typography, smooth spring motion, and mobile-first responsiveness.",
            "Includes dedicated About & 5 Core FAQs, Privacy Policy, Terms & Conditions, and 404/Error recovery.",
            "PayPal Sentinel — Autonomous Treasury, Invoicing & Dispute Protection for Modern Merchants.",
        ],
        "focus_boxes": [
            (180, 180, 1320, 900),
            (180, 180, 1320, 900),
        ],
    },
]


def load_font(size: int, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    candidates = []
    if mono:
        candidates = [
            r"C:\Windows\Fonts\consolab.ttf" if bold else r"C:\Windows\Fonts\consola.ttf",
            r"C:\Windows\Fonts\courbd.ttf" if bold else r"C:\Windows\Fonts\cour.ttf",
        ]
    else:
        candidates = [
            r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
            r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


FONT_HEADER_BRAND = load_font(16, bold=True)
FONT_HEADER_SUB = load_font(13, bold=False)
FONT_URL = load_font(13, bold=False, mono=True)
FONT_CARD_BADGE = load_font(12, bold=True, mono=True)
FONT_CARD_TITLE = load_font(18, bold=True)
FONT_CARD_METRIC = load_font(13, bold=True, mono=True)
FONT_SUBTITLE = load_font(21, bold=True)
FONT_TIME = load_font(13, bold=True, mono=True)
FONT_IPHONE_STATUS = load_font(11, bold=True)


def synthesize_scene_audio(scene_idx: int, text: str, out_wav: Path) -> tuple[float, list[float]]:
    """
    Uses Windows System.Speech.Synthesis.SpeechSynthesizer to generate a crystal-clear
    WAV narration file for the scene, plus returns (duration_seconds, per_frame_rms_envelope).
    """
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    if not out_wav.exists() or out_wav.stat().st_size < 1000:
        escaped_text = text.replace("'", "''")
        ps_script = f"""
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $synth.GetInstalledVoices() | Where-Object {{ $_.Enabled -and $_.VoiceInfo.Culture.Name -like 'en-*' }}
if ($voices.Count -gt 0) {{
    $preferred = $voices | Where-Object {{ $_.VoiceInfo.Name -match 'Zira|David|Mark|Eva|Hazel' }} | Select-Object -First 1
    if ($preferred) {{
        $synth.SelectVoice($preferred.VoiceInfo.Name)
    }} else {{
        $synth.SelectVoice($voices[0].VoiceInfo.Name)
    }}
}}
$synth.Rate = 1
$synth.Volume = 100
$synth.SetOutputToWaveFile('{str(out_wav)}')
$synth.Speak('{escaped_text}')
$synth.Dispose()
"""
        subprocess.run(
            ["powershell", "-NoProfile", "-Command", ps_script],
            check=True,
        )

    # Read WAV and compute duration + per-frame RMS amplitude for audio visualizer
    with wave.open(str(out_wav), "rb") as wf:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        n_frames = wf.getnframes()
        raw_bytes = wf.readframes(n_frames)

    duration_sec = n_frames / float(framerate)
    # Add 0.6s breathing pause at the end of each scene
    total_scene_sec = duration_sec + 0.6
    total_video_frames = max(1, int(round(total_scene_sec * FPS)))

    if sampwidth == 2:
        samples = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32)
        if n_channels > 1:
            samples = samples.reshape(-1, n_channels).mean(axis=1)
        samples /= 32768.0
    else:
        samples = np.zeros(n_frames, dtype=np.float32)

    envelope = []
    samples_per_video_frame = max(1, int(framerate / FPS))
    for vf in range(total_video_frames):
        start_sample = vf * samples_per_video_frame
        end_sample = min(len(samples), start_sample + samples_per_video_frame)
        if start_sample < len(samples) and end_sample > start_sample:
            chunk = samples[start_sample:end_sample]
            rms = float(np.sqrt(np.mean(chunk * chunk)))
            envelope.append(min(1.0, rms * 4.2))
        else:
            envelope.append(0.05)

    return total_scene_sec, envelope


def concat_wav_files(wav_paths: list[Path], pauses_sec: float, output_wav: Path) -> None:
    """Concatenates scene WAV files with a trailing 0.6s silence pad per scene to match video frames."""
    with wave.open(str(wav_paths[0]), "rb") as first_wf:
        params = first_wf.getparams()
        framerate = first_wf.getframerate()
        sampwidth = first_wf.getsampwidth()
        n_channels = first_wf.getnchannels()

    silence_frames = int(round(pauses_sec * framerate))
    silence_bytes = b"\x00" * (silence_frames * sampwidth * n_channels)

    with wave.open(str(output_wav), "wb") as out_wf:
        out_wf.setparams(params)
        for p in wav_paths:
            with wave.open(str(p), "rb") as wf:
                out_wf.writeframes(wf.readframes(wf.getnframes()))
            out_wf.writeframes(silence_bytes)


def build_base_studio_canvas() -> Image.Image:
    """Creates the 1920x1080 dark executive studio background with subtle radial lighting."""
    arr = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    # Vertical gradient from #0B0F17 to #111827
    for y in range(HEIGHT):
        t = y / float(HEIGHT)
        r = int(11 * (1 - t) + 15 * t)
        g = int(15 * (1 - t) + 23 * t)
        b = int(23 * (1 - t) + 36 * t)
        arr[y, :] = (r, g, b)

    canvas = Image.fromarray(arr, mode="RGB")
    draw = ImageDraw.Draw(canvas)

    # Top Studio Header Strip
    draw.rectangle([0, 0, WIDTH, 54], fill=(9, 13, 20))
    draw.line([(0, 54), (WIDTH, 54)], fill=(34, 46, 66), width=1)

    # Brand mark on top-left
    draw.rounded_rectangle([36, 15, 42, 39], radius=2, fill=(94, 234, 212))
    draw.text((52, 16), "PAYPAL SENTINEL", font=FONT_HEADER_BRAND, fill=(248, 250, 252))
    draw.text(
        (215, 18),
        "·  Autonomous CFO Treasury, Smart Invoicing & Dispute Defense  ·  Desktop + iPhone Split-Screen Walkthrough",
        font=FONT_HEADER_SUB,
        fill=(148, 163, 184),
    )

    # Live Sandbox Pill on top-right
    draw.rounded_rectangle([1630, 12, 1884, 42], radius=15, fill=(16, 38, 34), outline=(45, 106, 88), width=1)
    draw.ellipse([1646, 22, 1656, 32], fill=(52, 211, 153))
    draw.text((1666, 18), "PAYPAL SANDBOX · LIVE", font=FONT_CARD_BADGE, fill=(167, 243, 208))

    return canvas


def create_rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return mask


def format_srt_timestamp(seconds: float) -> str:
    millis = int(round((seconds - int(seconds)) * 1000))
    total_secs = int(seconds)
    hrs = total_secs // 3600
    mins = (total_secs % 3600) // 60
    secs = total_secs % 60
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"


def main() -> None:
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    AUDIO_TMP_DIR.mkdir(parents=True, exist_ok=True)

    print("1. Synthesizing voiceover narration for all 7 scenes...")
    scene_wavs: list[Path] = []
    scene_durations: list[float] = []
    scene_envelopes: list[list[float]] = []

    for idx, scene in enumerate(SCENES):
        wav_path = AUDIO_TMP_DIR / f"scene_{scene['id']}.wav"
        dur, env = synthesize_scene_audio(idx, scene["narration"], wav_path)
        scene_wavs.append(wav_path)
        scene_durations.append(dur)
        scene_envelopes.append(env)
        print(f"   Scene {scene['id']} ({scene['title']}): {dur:.2f}s ({len(env)} frames)")

    total_duration = sum(scene_durations)
    print(f"Total Demo Video Duration: {total_duration:.2f} seconds ({total_duration/60:.2f} mins) [Limit: < 180.0s]")
    assert total_duration < 180.0, f"Video duration {total_duration}s exceeds 180s limit!"

    full_audio_wav = AUDIO_TMP_DIR / "full_narration.wav"
    concat_wav_files(scene_wavs, 0.6, full_audio_wav)

    # Write synchronized .srt subtitle file
    srt_path = VIDEO_DIR / "PayPal-Sentinel-SplitScreen-Demo.srt"
    srt_lines = []
    sub_counter = 1
    elapsed_cursor = 0.0
    for idx, scene in enumerate(SCENES):
        dur = scene_durations[idx]
        subs = scene["subtitles"]
        seg_dur = dur / len(subs)
        for s_idx, sub_text in enumerate(subs):
            start_t = elapsed_cursor + s_idx * seg_dur
            end_t = elapsed_cursor + (s_idx + 1) * seg_dur - 0.08
            srt_lines.append(f"{sub_counter}")
            srt_lines.append(f"{format_srt_timestamp(start_t)} --> {format_srt_timestamp(end_t)}")
            srt_lines.append(sub_text)
            srt_lines.append("")
            sub_counter += 1
        elapsed_cursor += dur
    srt_path.write_text("\n".join(srt_lines), encoding="utf-8")
    print(f"2. Wrote synchronized SRT subtitles to: {srt_path}")

    # Preload Desktop and Mobile images
    desktop_cache: dict[str, Image.Image] = {}
    mobile_cache: dict[str, Image.Image] = {}

    for scene in SCENES:
        for d_name in scene["desktop_images"]:
            p = SCREENSHOT_DIR / d_name
            if p.exists() and d_name not in desktop_cache:
                desktop_cache[d_name] = Image.open(p).convert("RGB")
        m_name = scene["mobile_image"]
        mp = MOBILE_DIR / m_name
        if mp.exists() and m_name not in mobile_cache:
            mobile_cache[m_name] = Image.open(mp).convert("RGB")

    # Geometry Constants for Split-Screen Layout (matching reference layout)
    # Left Desktop Frame (~72% width): x=36..1404 (1368px wide), y=68..966 (898px high)
    DESK_X, DESK_Y = 36, 68
    DESK_W, DESK_H = 1368, 898
    DESK_CHROME_H = 42
    DESK_VIEW_W = DESK_W - 4
    DESK_VIEW_H = DESK_H - DESK_CHROME_H - 4  # 852px

    # Top-Right Telemetry & Voiceover Studio Card: x=1424..1884 (460px wide), y=68..304 (236px high)
    CARD_X, CARD_Y = 1424, 68
    CARD_W, CARD_H = 460, 236

    # Bottom-Right iPhone 15 Pro Frame: x=1424..1884 (460px wide), y=318..966 (648px high)
    PHONE_PANEL_X, PHONE_PANEL_Y = 1424, 318
    PHONE_PANEL_W, PHONE_PANEL_H = 460, 648
    # Actual iPhone 15 Pro Bezel centered inside Right Panel: 296x616 (screen: 276x584)
    IPHONE_W, IPHONE_H = 298, 616
    IPHONE_X = PHONE_PANEL_X + (PHONE_PANEL_W - IPHONE_W) // 2
    IPHONE_Y = PHONE_PANEL_Y + (PHONE_PANEL_H - IPHONE_H) // 2 + 6
    SCREEN_W, SCREEN_H = 278, 586
    SCREEN_X = IPHONE_X + 10
    SCREEN_Y = IPHONE_Y + 15

    desk_mask = create_rounded_mask((DESK_VIEW_W, DESK_VIEW_H), radius=10)
    screen_mask = create_rounded_mask((SCREEN_W, SCREEN_H), radius=30)

    base_canvas = build_base_studio_canvas()

    raw_video_path = AUDIO_TMP_DIR / "silent_video.mp4"
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(raw_video_path), fourcc, FPS, (WIDTH, HEIGHT))

    print("3. Rendering 1920x1080 @ 30fps split-screen frames...")
    global_frame_idx = 0
    total_frames = sum(len(env) for env in scene_envelopes)

    for s_idx, scene in enumerate(SCENES):
        env = scene_envelopes[s_idx]
        n_frames = len(env)
        d_imgs = [desktop_cache[name] for name in scene["desktop_images"]]
        m_img = mobile_cache[scene["mobile_image"]]
        subs = scene["subtitles"]
        focus_boxes = scene["focus_boxes"]

        for f_idx in range(n_frames):
            progress = f_idx / float(max(1, n_frames - 1))
            elapsed_sec = global_frame_idx / float(FPS)

            frame = base_canvas.copy()
            draw = ImageDraw.Draw(frame)

            # Determine active desktop image (smoothly cross-fade between sub-views in the scene)
            num_d = len(d_imgs)
            seg_float = progress * num_d
            d_i = min(num_d - 1, int(seg_float))
            local_t = seg_float - d_i

            active_d = d_imgs[d_i]
            if d_i + 1 < num_d and local_t > 0.82:
                blend_alpha = (local_t - 0.82) / 0.18
                active_d = Image.blend(d_imgs[d_i], d_imgs[d_i + 1], min(1.0, max(0.0, blend_alpha)))

            # Subtle smooth zoom/pan (1.0 -> 1.028) for cinematic polish
            zoom = 1.0 + 0.024 * math.sin(progress * math.pi)
            src_w, src_h = active_d.size
            crop_w = int(src_w / zoom)
            crop_h = int(src_h / zoom)
            cx = (src_w - crop_w) // 2
            cy = int((src_h - crop_h) * (0.25 + 0.5 * progress))
            cropped_d = active_d.crop((cx, cy, cx + crop_w, cy + crop_h)).resize(
                (DESK_VIEW_W, DESK_VIEW_H), Image.Resampling.LANCZOS
            )

            # 1) Render Left Desktop Window Frame
            draw.rounded_rectangle(
                [DESK_X, DESK_Y, DESK_X + DESK_W, DESK_Y + DESK_H],
                radius=14,
                fill=(17, 24, 39),
                outline=(51, 65, 85),
                width=2,
            )
            # macOS Window Chrome Bar
            draw.rounded_rectangle(
                [DESK_X + 2, DESK_Y + 2, DESK_X + DESK_W - 2, DESK_Y + DESK_CHROME_H],
                radius=12,
                fill=(24, 33, 49),
            )
            # Traffic Light Dots
            draw.ellipse([DESK_X + 18, DESK_Y + 15, DESK_X + 30, DESK_Y + 27], fill=(239, 68, 68))
            draw.ellipse([DESK_X + 38, DESK_Y + 15, DESK_X + 50, DESK_Y + 27], fill=(245, 158, 11))
            draw.ellipse([DESK_X + 58, DESK_Y + 15, DESK_X + 70, DESK_Y + 27], fill=(16, 185, 129))
            # Browser URL Bar
            draw.rounded_rectangle(
                [DESK_X + 320, DESK_Y + 8, DESK_X + 1048, DESK_Y + 34],
                radius=7,
                fill=(13, 18, 28),
                outline=(45, 58, 79),
                width=1,
            )
            draw.text(
                (DESK_X + 340, DESK_Y + 12),
                f"https://{scene['route']}",
                font=FONT_URL,
                fill=(203, 213, 225),
            )
            draw.text(
                (DESK_X + 1165, DESK_Y + 13),
                "DESKTOP 1500×1000 (3:2)",
                font=FONT_CARD_BADGE,
                fill=(148, 163, 184),
            )

            # Paste Desktop Viewport
            frame.paste(cropped_d, (DESK_X + 2, DESK_Y + DESK_CHROME_H + 2), desk_mask)

            # 2) Render Top-Right Voiceover & Live Telemetry Card
            draw.rounded_rectangle(
                [CARD_X, CARD_Y, CARD_X + CARD_W, CARD_Y + CARD_H],
                radius=14,
                fill=(17, 24, 39),
                outline=(51, 65, 85),
                width=2,
            )
            # Scene Badge
            draw.rounded_rectangle(
                [CARD_X + 18, CARD_Y + 16, CARD_X + 138, CARD_Y + 40],
                radius=6,
                fill=(217, 249, 157),
            )
            draw.text(
                (CARD_X + 28, CARD_Y + 20),
                f"SCENE {scene['id']} / 07",
                font=FONT_CARD_BADGE,
                fill=(15, 23, 42),
            )
            draw.text(
                (CARD_X + 150, CARD_Y + 20),
                "VOICEOVER TELEMETRY",
                font=FONT_CARD_BADGE,
                fill=(148, 163, 184),
            )
            # Scene Title
            draw.text(
                (CARD_X + 18, CARD_Y + 52),
                scene["title"],
                font=FONT_CARD_TITLE,
                fill=(248, 250, 252),
            )
            # Metric Pill
            draw.rounded_rectangle(
                [CARD_X + 18, CARD_Y + 86, CARD_X + CARD_W - 18, CARD_Y + 116],
                radius=8,
                fill=(16, 38, 34),
                outline=(45, 106, 88),
                width=1,
            )
            draw.text(
                (CARD_X + 30, CARD_Y + 93),
                scene["metric_badge"],
                font=FONT_CARD_METRIC,
                fill=(110, 231, 183),
            )

            # Audio-Reactive 32-Bar Voiceover Waveform Visualizer
            amp = env[f_idx]
            num_bars = 32
            bar_x0 = CARD_X + 22
            bar_w = 9
            bar_gap = 4
            base_y = CARD_Y + 182
            max_bar_h = 44
            for b_i in range(num_bars):
                wave_mod = 0.45 + 0.55 * abs(math.sin(global_frame_idx * 0.22 + b_i * 0.45))
                bh = max(4, int(max_bar_h * max(0.12, amp) * wave_mod))
                bx = bar_x0 + b_i * (bar_w + bar_gap)
                by_top = base_y - bh // 2
                by_bot = base_y + bh // 2
                color = (52, 211, 153) if b_i % 3 != 0 else (217, 249, 157)
                draw.rounded_rectangle([bx, by_top, bx + bar_w, by_bot], radius=3, fill=color)

            draw.text(
                (CARD_X + 20, CARD_Y + 208),
                f"AUDIO SYNC · {elapsed_sec:05.1f}s / {total_duration:05.1f}s",
                font=FONT_CARD_BADGE,
                fill=(148, 163, 184),
            )

            # 3) Render Bottom-Right Synchronized iPhone 15 Pro Frame
            draw.rounded_rectangle(
                [PHONE_PANEL_X, PHONE_PANEL_Y, PHONE_PANEL_X + PHONE_PANEL_W, PHONE_PANEL_Y + PHONE_PANEL_H],
                radius=14,
                fill=(15, 21, 34),
                outline=(45, 58, 79),
                width=1,
            )
            draw.text(
                (PHONE_PANEL_X + 18, PHONE_PANEL_Y + 10),
                "LIVE MOBILE VIEW · iPHONE 15 PRO (390×844)",
                font=FONT_CARD_BADGE,
                fill=(148, 163, 184),
            )

            # Outer Titanium Bezel
            draw.rounded_rectangle(
                [IPHONE_X - 3, IPHONE_Y - 3, IPHONE_X + IPHONE_W + 3, IPHONE_Y + IPHONE_H + 3],
                radius=40,
                fill=(71, 85, 105),
            )
            draw.rounded_rectangle(
                [IPHONE_X, IPHONE_Y, IPHONE_X + IPHONE_W, IPHONE_Y + IPHONE_H],
                radius=38,
                fill=(15, 23, 42),
                outline=(100, 116, 139),
                width=2,
            )

            # Smooth vertical mobile scroll during scene below a dedicated 30px iOS status bar
            STATUS_BAR_H = 30
            CONTENT_H = SCREEN_H - STATUS_BAR_H
            m_src_w, m_src_h = m_img.size
            m_crop_h = min(m_src_h, int(m_src_w * (CONTENT_H / float(SCREEN_W))))
            max_scroll = min(1150, max(0, m_src_h - m_crop_h))
            scroll_px = int(max_scroll * (0.5 - 0.5 * math.cos(progress * math.pi)))
            m_cropped = m_img.crop((0, scroll_px, m_src_w, min(m_src_h, scroll_px + m_crop_h))).resize(
                (SCREEN_W, CONTENT_H), Image.Resampling.LANCZOS
            )

            # Compose full iPhone screen (30px iOS status bar + scrolled webpage) before masking
            phone_screen_canvas = Image.new("RGB", (SCREEN_W, SCREEN_H), (248, 250, 252))
            ps_draw = ImageDraw.Draw(phone_screen_canvas)
            # iOS Status Bar (9:41 on left, 5G + Battery on right)
            ps_draw.text((22, 7), "9:41", font=FONT_CARD_BADGE, fill=(17, 25, 31))
            ps_draw.text((SCREEN_W - 64, 7), "5G", font=FONT_CARD_BADGE, fill=(17, 25, 31))
            ps_draw.rounded_rectangle([SCREEN_W - 40, 9, SCREEN_W - 18, 20], radius=3, outline=(17, 25, 31), width=1)
            ps_draw.rectangle([SCREEN_W - 38, 11, SCREEN_W - 22, 18], fill=(16, 185, 129))
            ps_draw.line([(0, STATUS_BAR_H - 1), (SCREEN_W, STATUS_BAR_H - 1)], fill=(226, 232, 240), width=1)
            phone_screen_canvas.paste(m_cropped, (0, STATUS_BAR_H))

            frame.paste(phone_screen_canvas, (SCREEN_X, SCREEN_Y), screen_mask)

            # iPhone Dynamic Island Pill centered inside the 30px iOS Status Bar
            di_w, di_h = 84, 18
            di_x = IPHONE_X + (IPHONE_W - di_w) // 2
            di_y = SCREEN_Y + 6
            draw.rounded_rectangle([di_x, di_y, di_x + di_w, di_y + di_h], radius=9, fill=(9, 13, 20))
            draw.ellipse([di_x + di_w - 17, di_y + 4, di_x + di_w - 7, di_y + 14], fill=(30, 41, 59))

            # iPhone Home Indicator Bar
            hi_w = 96
            hi_x = IPHONE_X + (IPHONE_W - hi_w) // 2
            hi_y = SCREEN_Y + SCREEN_H - 10
            draw.rounded_rectangle([hi_x, hi_y, hi_x + hi_w, hi_y + 4], radius=2, fill=(100, 116, 139))

            # 4) Render Burned-In Synchronized Subtitle Bar at Bottom (y=980..1054)
            sub_idx = min(len(subs) - 1, int(progress * len(subs)))
            current_subtitle = subs[sub_idx]

            draw.rounded_rectangle(
                [36, 980, 1884, 1052],
                radius=12,
                fill=(9, 13, 20),
                outline=(51, 65, 85),
                width=1,
            )
            # CC Badge
            draw.rounded_rectangle([54, 998, 92, 1032], radius=6, fill=(30, 41, 59))
            draw.text((62, 1007), "CC", font=FONT_CARD_BADGE, fill=(217, 249, 157))
            # Subtitle Text
            draw.text((110, 1002), current_subtitle, font=FONT_SUBTITLE, fill=(248, 250, 252))

            # Timestamp on right of Subtitle Bar
            mins_e = int(elapsed_sec) // 60
            secs_e = int(elapsed_sec) % 60
            mins_t = int(total_duration) // 60
            secs_t = int(total_duration) % 60
            draw.text(
                (1760, 1008),
                f"{mins_e:02d}:{secs_e:02d} / {mins_t:02d}:{secs_t:02d}",
                font=FONT_TIME,
                fill=(148, 163, 184),
            )

            # Bottom Timeline Progress Bar
            overall_pct = global_frame_idx / float(max(1, total_frames - 1))
            prog_w = int(1848 * overall_pct)
            draw.rounded_rectangle([36, 1058, 1884, 1064], radius=3, fill=(30, 41, 59))
            if prog_w > 4:
                draw.rounded_rectangle([36, 1058, 36 + prog_w, 1064], radius=3, fill=(52, 211, 153))

            # Write frame to OpenCV VideoWriter (RGB -> BGR)
            bgr = cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2BGR)
            writer.write(bgr)

            # Save a preview frame of Scene 1 and Scene 5 for visual inspection
            if s_idx == 0 and f_idx == n_frames // 2:
                frame.save(VIDEO_DIR / "preview-frame-scene-01.png")
            elif s_idx == 4 and f_idx == n_frames // 2:
                frame.save(VIDEO_DIR / "preview-frame-scene-05.png")

            global_frame_idx += 1

    writer.release()
    print(f"4. Rendered {global_frame_idx} frames ({global_frame_idx/FPS:.2f}s). Muxing H.264 + AAC MP4 via FFmpeg...")

    final_mp4 = VIDEO_DIR / "PayPal-Sentinel-SplitScreen-Demo.mp4"
    ffmpeg_cmd = [
        str(FFMPEG_BIN),
        "-y",
        "-i",
        str(raw_video_path),
        "-i",
        str(full_audio_wav),
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "22",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        "-movflags",
        "+faststart",
        str(final_mp4),
    ]
    subprocess.run(ffmpeg_cmd, check=True)
    if raw_video_path.exists():
        raw_video_path.unlink()
    size_mb = final_mp4.stat().st_size / (1024 * 1024)
    print(f"SUCCESS: Created {final_mp4} ({size_mb:.2f} MB, {total_duration:.2f}s < 180s)")


if __name__ == "__main__":
    main()
