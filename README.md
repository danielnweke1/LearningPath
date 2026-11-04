# LearningPath 🧭

> **Adaptive Study Roadmaps Anchored in Vetted Video Lectures.**  
> Transform any learning goal into a structured, chronological masterclass — powered by **GPT-4o** and the **YouTube Data API v3**.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat&logo=openai)](https://openai.com/)
[![YouTube API](https://img.shields.io/badge/YouTube-Data_API_v3-FF0000?style=flat&logo=youtube)](https://developers.google.com/youtube/v3)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 What is LearningPath?

Self-directed online learning is often fragmented: scattered YouTube tutorials, lack of prerequisite order, and zero theoretical depth.

**LearningPath** solves this by generating **pedagogically rigorous, weekly study roadmaps** tailored to your exact goal, background, and weekly time budget:

1. 📐 **First-Principles Sequencing**: Every skill is arranged by strict prerequisite dependencies — from core mental models to hands-on milestone projects.
2. 🎥 **Zero Hallucinated Links**: Every session is anchored to real, highly-rated YouTube video lectures scored for duration fit, recency, and concept overlap.
3. 🧠 **GPT-4o Theoretical Treatises**: Deep theoretical notes, mental models, code blueprints, and interactive checkpoint quizzes for every session.
4. 📌 **Synchronized Video Dock**: A sticky video player that tracks your focal reading position down the timeline in real time.
5. 🔄 **Adaptive Surgical Replanning**: Mark any session *"Too easy"*, *"Too hard"*, or *"I'm stuck"* to trigger a dynamic JSON patch that recalibrates future weeks without losing completed work.

---

## 🚀 Quick Start Guide

Follow these simple steps to run LearningPath locally on your machine:

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher, v20+ recommended)
- **npm** (v9.0.0 or higher) or **pnpm** / **yarn**

### 2. Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-username/LearningPath.git

# Enter project directory
cd LearningPath

# Install dependencies
npm install
```

### 3. Configure Environment Variables

Create your local `.env.local` file from the provided template:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your API keys:

```env
# 1. OpenAI API Key for GPT-4o curriculum generation & theoretical treatises
OPENAI_API_KEY=your_openai_api_key_here

# 2. YouTube Data API v3 Key for live search and video ranking
YOUTUBE_API_KEY=your_youtube_api_key_here
```

> **Note**: Even without API keys, LearningPath runs smoothly with pre-computed instant demos (Cloud Security, Python Data Analysis, AI Engineering) and local synthesis fallbacks.

### 4. Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 How to Get Your API Keys

<details>
<summary><strong>1. OpenAI API Key (GPT-4o)</strong></summary>

1. Visit [platform.openai.com](https://platform.openai.com/).
2. Sign in or create an account.
3. Navigate to **API Keys** under the Dashboard settings.
4. Click **Create new secret key**, give it a name (e.g. `LearningPath`), and copy the key into `OPENAI_API_KEY` in `.env.local`.
5. Ensure your OpenAI account has billing credits enabled.

</details>

<details>
<summary><strong>2. Google YouTube Data API v3 Key</strong></summary>

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing project.
3. In the search bar, search for **YouTube Data API v3** and click **Enable**.
4. Go to **APIs & Services** > **Credentials**.
5. Click **Create Credentials** > **API Key**.
6. Copy the generated key into `YOUTUBE_API_KEY` in `.env.local`.

</details>

---

## 🎯 Key Features

### 1. Clean, Modern Homepage & Quick-Start Tracks
- **Instant Search Bar**: Type any topic (e.g., *SQL & Relational Databases*, *Acoustic Guitar*, *Next.js 15*, *Conversational Spanish*).
- **Popular Tracks**: One-click quick-start pills for popular disciplines.
- **Active Study Banner**: Automatically detects an existing roadmap in `localStorage` and lets you resume with 1 click.

### 2. Interactive Study Timeline & Synchronized Video Dock
- **Focal Scroll-Spy**: The right-side Video Dock smoothly tracks the session you are currently reading without jitter or premature snapping.
- **Collapsible Video Player**: Watch embeddable lectures inline, switch to vetted alternate picks, or minimize the player to focus on reading.
- **Breadcrumb Navigation**: Clear `Phase / Week / Session` badges so you always know where you are.

### 3. Theory Treatise & Checkpoint Quizzes
- **GPT-4o First-Principles Notes**: In-depth explanations, architectural invariants, and real-world analogies.
- **Code Blueprints**: Syntax-highlighted code blocks with 1-click clipboard copy.
- **Interactive Checkpoints**: Multiple-choice comprehension quizzes with instant feedback and explanations.

### 4. Data Portability & Sync
- **No-Auth Browser Persistence**: Roadmaps and session progress are saved automatically in `localStorage`.
- **Calendar Export**: Export your weekly sessions as an RFC 5545 `.ics` file to import into Google Calendar, Apple Calendar, or Outlook.
- **Typeset PDF Export**: Download a print-ready PDF syllabus of your complete curriculum.
- **JSON Backup**: Export and re-import raw roadmap files across devices.

---

## ⌨️ Keyboard Shortcuts

LearningPath is designed for keyboard-first navigation:

| Key | Action |
| :--- | :--- |
| <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Command Palette (jump to any week or session) |
| <kbd>j</kbd> / <kbd>↓</kbd> | Move selection to next session |
| <kbd>k</kbd> / <kbd>↑</kbd> | Move selection to previous session |
| <kbd>x</kbd> | Toggle session complete / incomplete |
| <kbd>?</kbd> | Open Keyboard Shortcuts cheat sheet |
| <kbd>Esc</kbd> | Close overlays, modals, and drawers |

---

## 📁 Project Structure

```text
LearningPath/
├── data/
│   └── demos/                    # Pre-computed offline demo JSON snapshots
├── prompts/                      # Versioned system prompts for GPT-4o
│   ├── stage_a_plan_v1.md        # Curriculum architecture prompt
│   ├── stage_c_video_selection_v1.md # Video ranking prompt
│   ├── stage_d_checkpoints_v1.md # Checkpoint quiz prompt
│   ├── diagnostic_v1.md          # Diagnostic skill level tester
│   ├── discourse_v1.md           # Theoretical treatise generator
│   └── replan_v1.md              # Adaptive replanning engine
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── plan/checkpoints/ # Checkpoint evaluation API
│   │   │   ├── plan/diagnostic/  # Skill assessment API
│   │   │   ├── plan/discourse/   # Theoretical treatise API (GPT-4o)
│   │   │   ├── plan/generate/    # Primary curriculum & video matching API
│   │   │   └── plan/replan/      # Adaptive replanning diff API
│   │   ├── globals.css           # Design tokens, fonts, and dark mode styles
│   │   ├── layout.tsx            # Root layout with Geist & Newsreader fonts
│   │   └── page.tsx              # App router (Home ↔ Builder ↔ Roadmap)
│   ├── components/
│   │   ├── HomePage.tsx          # Clean landing homepage with quick-start tracks
│   │   ├── LandingIntake.tsx     # Custom roadmap pacing & configuration builder
│   │   ├── PlanRoadmap.tsx       # 3-Zone timeline & synchronized scroll-spy
│   │   ├── SessionDetail.tsx     # Video dock, theory treatise & quizzes
│   │   ├── Header.tsx            # Persistent progress & navigation header
│   │   ├── CommandPalette.tsx    # Cmd+K quick search
│   │   ├── DiagnosticModal.tsx   # Interactive skill level diagnostic
│   │   ├── ExportModal.tsx       # PDF, Calendar (.ics), and JSON exporter
│   │   ├── ReplanDiffModal.tsx   # Adaptive replanning visual diff modal
│   │   └── ThemeToggle.tsx       # Light & dark mode toggle
│   ├── lib/
│   │   ├── curriculum-synthesizer.ts # Dynamic domain matrix & fallback synthesizer
│   │   ├── openai.ts             # GPT-4o API integration & schema validation
│   │   ├── youtube.ts            # YouTube Data API client & relevance scorer
│   │   ├── storage.ts            # LocalStorage persistence layer
│   │   ├── ics.ts                # RFC 5545 iCalendar sync
│   │   └── pdf.ts                # Typeset PDF generator (jsPDF)
│   └── types/
│       └── plan.ts               # TypeScript interfaces & Zod validation schemas
├── .env.example                  # Environment variable template
└── package.json
```

```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
