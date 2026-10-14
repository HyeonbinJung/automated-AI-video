<div align="center">

# 🎬 SuperDuper Video

**Automated AI Short-Form Animation Platform — from one story to a finished vertical video**

<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" height="26">
<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" height="26">
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" height="26">
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" height="26">
<img src="https://img.shields.io/badge/DeepSeek-4D6BFE?style=for-the-badge" height="26">
<img src="https://img.shields.io/badge/Seedance%201.5%20Pro-1F2937?style=for-the-badge" height="26">
<img src="https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" height="26">

[Overview](#-overview) · [Features](#-key-features) · [Tech Stack](#-tech-stack) · [Pipeline](#-generation-pipeline) · [Pricing](#-usage-based-credits) · [Getting Started](#-getting-started) · [Structure](#%EF%B8%8F-project-structure) · [Limitations](#-limitations)

</div>

---

## 📌 Overview

SuperDuper Video turns a short written story into a vertical (9:16) animated short. The user answers five questions — **story → animation strategy → character → number of scenes → Launch** — and the platform refines the story, designs a consistent character, draws a storyboard, animates every scene and joins them into one MP4.

The pipeline is built around the cheapest usable models and **usage-based credits**: every AI call is deducted at its real provider cost + 20 %.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **5-Step Launcher** | Questions open one at a time; later steps stay locked until the previous one is answered |
| **AI Story Refinement** | DeepSeek improves the user's rough story (max 500 chars) and writes the hook, scenes and subtitles |
| **Animation Strategies** | Strong hook, twist ending, endless loop, heartwarming, comedy / meme, ASMR visuals |
| **Character Preview & Revision** | A sample character is drawn first; the user accepts it or writes what to change |
| **One-Image Storyboard** | Ten scenes are drawn on a single storyboard sheet and cut into keyframes in the browser |
| **Scene Video Generation** | Seedance 1.5 Pro image-to-video, 3–7 s per scene, 7 / 10 / 13 scenes |
| **Per-Scene Redo** | Any single scene can be regenerated with a short instruction |
| **Credit Wallet** | Balance and a per-call usage ledger; real provider usage + 20 % is deducted |
| **Multilingual** | UI and generated content in Korean, English (US / India), Hindi, Spanish, Japanese, Indonesian |
| **Auto Editor** | Crossfades, burned-in subtitles, optional BGM and logo, final MP4 render |
| **Advanced Studio** | The original six-stage editor remains available for manual control |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express, Multer |
| **Frontend** | React 19, Vite, lucide-react |
| **Story / Scene Planning** | DeepSeek (JSON mode, fixed system prompts for prefix caching) |
| **Character Image** | Z-Image via Kie AI |
| **Storyboard Image** | Seedream 5.0 Flash image-to-image via Kie AI |
| **Scene Video** | Seedance 1.5 Pro · 480p · no audio via Kie AI |
| **Rendering** | FFmpeg / ffprobe (libass subtitles, xfade) |
| **Storage** | Local JSON project store and media folder |

---

## 🔄 Generation Pipeline

```text
Story (≤500 chars) + Strategy
        │
        ▼
DeepSeek ── character design ──► Z-Image ── sample character ──► accept / revise
        │
        ▼
DeepSeek ── refined story · hook · animation technique · scene plan (3–7 s each)
        │
        ▼
DeepSeek ── image + motion prompts (10 scenes per call)
        │
        ▼
Seedream 5.0 Flash ── 1 storyboard sheet per 10 scenes (character as reference)
        │
        ▼
Browser ── cuts the sheet into 9:16 keyframes
        │
        ▼
Seedance 1.5 Pro ── one 480p clip per scene (4–12 s billing, trimmed to plan)
        │
        ▼
FFmpeg ── crossfades + subtitles (+ BGM / logo) ──► final MP4
```

---

## 💰 Usage-Based Credits

Nothing is prepaid. Every AI call is billed from the provider's **own usage report** — DeepSeek token counts and Kie AI `creditsConsumed` — and deducted from the wallet the moment it is recorded:

```text
credits = ceil(provider cost in USD × KRW_PER_USD × (1 + MARKUP))      1 credit = ₩1
```

`MARKUP` defaults to **20 %** and can be raised in `.env`, never lowered below 20 %. The math is in `apps/server/pricing.js`.

| Provider call | Provider cost | What the customer pays (+20 %) |
|---|---|---|
| DeepSeek text (story, plan, prompts) | $0.56 / 1M input · $1.68 / 1M output tokens | tokens used × rate × 1.2 |
| Z-Image character image | $0.004 per image | ₩7 |
| Seedream 5.0 Flash storyboard sheet (10 scenes) | $0.0162 per sheet | ₩28 |
| Seedance 1.5 Pro scene video (480p) | $0.00875 per second, 4–12 s per clip | ≈ ₩14.7 per second |

A typical finished video (scenes averaging 5 s) uses about **₩580 (7 scenes) – ₩1,060 (13 scenes)** of credits, plus any redos.

Safety rules:

- Before a step starts, the balance must cover its **worst-case** usage (longest clips, DeepSeek at its output cap); the UI shows these as "up to" amounts. Only real usage is deducted.
- A call the provider did not bill costs nothing, so there are no refunds to manage.
- Kie task IDs are saved the moment they are created, so a timeout or server restart resumes the same task instead of paying twice.
- Characters and storyboards are locked once scene videos exist.
- The bill lists every AI call (tokens or provider credits, KRW charged) per project.

---

## 🚀 Getting Started

Requirements: Node.js 20+ (22 recommended), npm, and FFmpeg + ffprobe on `PATH` for the final MP4.

```bash
npm install
cp .env.example .env    # PowerShell: Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`.

Required keys in `.env`:

```env
DEEPSEEK_API_KEY=...
KIE_API_KEY=...          # https://kie.ai/api-key
```

Optional billing knobs: `KRW_PER_USD`, `MARKUP` (≥ 0.2), `DEEPSEEK_USD_PER_M_IN`, `DEEPSEEK_USD_PER_M_OUT`. Set `WALLET_DEV_TOPUP=0` once a payment gateway credits the wallet (this disables the test top-up buttons).

Tests:

```bash
npm test
npm run build
```

---

## 🗂️ Project Structure

```text
extriver-shorts-studio/
├── apps/
│   ├── server/
│   │   ├── server.js        # REST API, jobs, simple-mode flow, wallet & billing
│   │   ├── services.js      # DeepSeek, Kie AI (Z-Image, Seedream, Seedance), spend metering
│   │   ├── prompts.js       # Strategies, character types, cache-friendly system prompts
│   │   ├── pricing.js       # Provider rates, credits = cost + markup, worst-case estimates
│   │   ├── i18n.js          # Server messages and content languages
│   │   ├── editor.js        # FFmpeg render: crossfade, subtitles, BGM, logo
│   │   ├── paths.js
│   │   └── tests/
│   └── web/
│       └── src/
│           ├── Launcher.jsx # 5-step launcher, progress, wallet
│           ├── i18n.js      # UI translations, locale & currency display
│           ├── App.jsx      # Advanced six-stage studio
│           └── main.jsx
├── .env.example
└── package.json
```

---

## 🎯 Project Objective

Make short-form animation production simple enough for anyone to finish a video in a few clicks, while keeping unit economics safe: the cheapest viable models, as few paid calls as possible, and every call billed at its real cost + 20 %.

---

## ⚠️ Limitations

- **No real payment gateway yet.** The wallet is a local ledger with test top-ups; a PG webhook should credit it.
- **Single wallet.** There is no login or per-customer account; do not expose the server to the internet as is.
- **480p video.** Seedance clips are 480p and upscaled to 720 × 1280 in the final render.
- **Provider prices** were taken from Kie AI's public pages (Oct 2026); Z-Image is listed "from $0.004". Verify against recorded spend before launch.
- **Storyboard cutting** assumes the model drew an even 5 × 2 grid; a skewed grid gives slightly off-center keyframes.
- **Character consistency** relies on a shared reference image and style text, not model fine-tuning.
- **FFmpeg** is required for the final MP4; without it, the scene clips are produced but not joined.
- Generated content must respect each provider's usage terms; the logo overlay must not hide required AI or source labels.
