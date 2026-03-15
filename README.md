<p align="center">
  <img src="src-tauri/icons/128x128.png" width="128" height="128" alt="ReadyPC Logo">
</p>

<h1 align="center">ReadyPC</h1>
<p align="center">
  <strong>Windows optimization for gaming, speed, and peace of mind.</strong>
</p>

<p align="center">
  <a href="https://github.com/Gloom-Team/NexaLauncher-Cracked/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/rust-1.70+-orange.svg" alt="Rust"></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri-v2-24C8DB.svg" alt="Tauri"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18-61DAFB.svg" alt="React"></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## What is ReadyPC?

**ReadyPC** is a free, open-source Windows optimizer that makes your PC faster, quieter, and less annoying—without the hype. No fake FPS claims. No sketchy registry hacks. Just honest, well-documented tweaks with **full undo capability** and a transparent change log.

Perfect for gamers, power users, and anyone tired of Windows bloat.

| | |
|---|---|
| **Safe** | Every tweak is reversible. Full backup before any change. |
| **Transparent** | Plain-English explanations, risk levels, and impact estimates. |
| **Private** | All data stays on your machine. Nothing is sent anywhere. |
| **Lightweight** | Built with Rust + Tauri. No Electron bloat. |

---

## Quick Start

```bash
pnpm install
pnpm tauri dev
```

**Prerequisites:** [Rust](https://rustup.rs/) 1.70+ · [Node.js](https://nodejs.org/) 18+ · [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

---

## Features

### One-Click Profiles

Switch modes instantly. Each profile applies a curated set of tweaks for your use case.

| Profile | Best For | What It Does |
|---------|----------|--------------|
| **Gaming Mode** | Competitive gaming, streaming | Disables overlays, Game Bar, background apps, sets high-performance power |
| **Performance Mode** | General speed boost | Gaming + service optimization, temp cleanup, startup reduction |
| **Quiet / Focus Mode** | Work, study, focus | Silences notifications, removes nags, disables telemetry and ads |
| **Low-End PC Mode** | Budget hardware | Aggressive optimization: all visual effects off, services trimmed |

### Safe Tweak Engine

Every tweak in ReadyPC shows:

- **What it does** — plain English, no jargon
- **Why it helps** — real technical reasoning
- **Risk level** — Safe, Moderate, or Advanced
- **Impact estimate** — honest assessment
- **Reversibility** — one-click undo

### 45+ Tweaks Across 7 Categories

| Category | Count | Examples |
|----------|-------|----------|
| Gaming | 8 | Game Bar, Game DVR, HAGS, mouse acceleration, Nagle's algorithm |
| Annoyance Removal | 15 | Tips/nags, web search, Widgets, Copilot, Sticky Keys, ads, telemetry |
| Performance | 10 | Background apps, SysMain, search indexing, processor scheduling |
| Visual Effects | 6 | Transparency, animations, shadows, Aero Peek |
| Startup | 1 | Startup delay removal |
| Cleanup | 2 | Temp files, prefetch cache |
| Power | 2 | High Performance, Ultimate Performance |

### Benchmark-Lite

Take before/after snapshots to measure the impact:

- Startup app count
- RAM and CPU usage at idle
- Background process count
- Power plan detection
- Side-by-side comparison

### Full Change Log

Every modification is logged with timestamps. Export as JSON. Undo individual tweaks or revert everything at once.

---

## Installation

### Build from Source

```bash
# Clone the repository
git clone https://github.com/Gloom-Team/NexaLauncher-Cracked.git
cd NexaLauncher-Cracked

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production (output: src-tauri/target/release/bundle/)
pnpm tauri build
```

### Admin Privileges

ReadyPC requests admin elevation at startup because most tweaks modify:

- `HKEY_LOCAL_MACHINE` registry keys
- Windows services
- Power plans

If you decline the UAC prompt, tweaks that only modify `HKEY_CURRENT_USER` will still work.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Rust (Tauri v2) — tweak logic, registry, system info, backup/restore |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide icons |
| **Build** | Vite, Tauri CLI |

---

## How It Works

1. **Tweaks** are defined as data structures (registry paths, service names, commands).
2. Before applying any tweak, the **Backup System** snapshots current values to `%APPDATA%/ReadyPC/`.
3. The **Executor** applies changes (registry edits, service configs, power plans).
4. The **Change Logger** records every action with timestamps.
5. **Undo** restores original values from the backup.

All data is stored locally. Nothing is sent anywhere.

---

## Project Structure

```
ReadyPC/
├── src-tauri/                 # Rust backend
│   └── src/
│       ├── engine/            # Safe Tweak Engine (executor, backup, logger)
│       ├── tweaks/            # All tweak definitions
│       ├── profiles/          # One-click profile presets
│       ├── system/            # System info, benchmark-lite
│       ├── commands/          # Tauri IPC handlers
│       └── utils/             # Admin elevation, Windows API helpers
└── src/                       # React frontend
    ├── pages/                 # Dashboard, Profiles, Tweaks, etc.
    ├── components/            # UI components
    ├── hooks/                 # React hooks
    └── lib/                   # Types, Tauri invoke wrappers
```

---

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.

---

## License

[MIT](LICENSE)

---

<p align="center">
  <strong>ReadyPC</strong> — Optimize Windows. Stay in control.
</p>
