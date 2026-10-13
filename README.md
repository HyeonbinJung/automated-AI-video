<div align="center">

# 🎬 Extriver Shorts Studio

**Automated AI Short-Form Animation Platform — from one story to a finished vertical video**

<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" height="26">
<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" height="26">
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" height="26">
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" height="26">
<img src="https://img.shields.io/badge/DeepSeek-4D6BFE?style=for-the-badge" height="26">
<img src="https://img.shields.io/badge/Seedance%201.5%20Pro-1F2937?style=for-the-badge" height="26">
<img src="https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" height="26">

[Overview](#-overview) · [Features](#-key-features) · [Tech Stack](#-tech-stack) · [Pipeline](#-generation-pipeline) · [Pricing](#-pricing--margin-model) · [Getting Started](#-getting-started) · [Structure](#%EF%B8%8F-project-structure) · [Limitations](#-limitations)

</div>

---

## 📌 Overview

Extriver Shorts Studio turns a short written story into a vertical (9:16) animated short. The user answers five questions — **story → animation strategy → character → number of scenes → Launch** — and the platform refines the story, designs a consistent character, draws a storyboard, animates every scene and joins them into one MP4.

The pipeline is built around the cheapest usable models and a **prepaid, never-lose pricing model**: every paid step is charged before it runs, at a price computed from its worst-case provider cost.

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
| **Prepaid Wallet** | Balance, bill ledger, automatic refunds when a step fails before any AI cost |
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

## 💰 Pricing & Margin Model

Every paid step is **prepaid** from the wallet. Prices are derived in `apps/server/pricing.js` from the **worst-case** cost of each step, so a sale cannot lose money:

- longest allowed clips (total ≤ scenes × 5 s, 3 s scenes billed as 4 s)
- DeepSeek at its maximum output tokens, billed as cache-miss input
- +10 % provider price buffer and +10 % exchange-rate buffer
- 10 % VAT and 3.3 % card fee removed before the margin is measured
- target operating margin: **20 %**

| Item | Price (KRW, VAT incl.) | Worst-case cost | Worst-case margin |
|---|---|---|---|
| Create / redo character | ₩100 | ₩14 | 81 % |
| 7-scene package (storyboard + all videos) | ₩1,000 | ₩630 | 27 % |
| 10-scene package | ₩1,300 | ₩869 | 23 % |
| 13-scene package | ₩1,700 | ₩1,163 | 21 % |
| Redo storyboard | ₩100 – ₩200 | ₩52 – ₩96 | 37 – 44 % |
| Redo one scene | ₩200 | ₩119 | 31 % |

A complete video costs the customer **₩1,100 (7 scenes) – ₩1,800 (13 scenes)** before optional redos.

Safety rules:

- A failed step is refunded **only if the providers billed nothing** (DeepSeek token usage and Kie `creditsConsumed` are recorded per project).
- A failed scene that cost nothing keeps its prepaid credit and can be retried for free; a failed scene that was billed must be redone as a paid scene.
- Kie task IDs are saved the moment they are created, so a timeout or server restart resumes the same task instead of paying twice.
- Characters and storyboards are locked once scene videos exist.

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

Optional pricing knobs: `KRW_PER_USD`, `FX_BUFFER`, `COST_BUFFER`, `TARGET_MARGIN`, `PG_FEE`, `VAT`. Set `WALLET_DEV_TOPUP=0` once a payment gateway credits the wallet (this disables the test top-up buttons).

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
│   │   ├── pricing.js       # Worst-case cost model and customer prices
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

Make short-form animation production simple enough for anyone to finish a video in a few clicks, while keeping unit economics safe: the cheapest viable models, as few paid calls as possible, and prices that cover the worst case.

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
