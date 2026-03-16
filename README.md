<p align="center">
  <img src="src-tauri/icons/128x128.png" width="128" height="128" alt="ReadyPC logo">
</p>

<h1 align="center">ReadyPC</h1>

<p align="center">
  <strong>Free open-source Windows optimizer for gaming, performance, privacy, and fewer annoyances.</strong>
</p>

<p align="center">
  Built with Rust, Tauri, React, and TypeScript for a fast, lightweight desktop experience.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-1.70%2B-orange.svg" alt="Rust 1.70+"></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri-v2-24C8DB.svg" alt="Tauri v2"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18-61DAFB.svg" alt="React 18"></a>
</p>

<p align="center">
  <a href="#download">Download</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#contributing">Contributing</a>
</p>

---


## Download

Get the latest build from the **Releases** page:

**[Download ReadyPC from Releases](https://github.com/Gloom-Team/NexaLauncher-Cracked/releases/tag/Releases)**

If you are building from source, follow the installation steps below.

---
## ReadyPC: Open-Source Windows Optimizer

**ReadyPC** is a free, open-source **Windows optimizer** designed to improve **gaming performance**, system responsiveness, privacy, and everyday usability without fake promises or risky “magic boost” claims.

Instead of sketchy one-click cleaners or undocumented registry hacks, ReadyPC gives you **safe, reversible Windows tweaks** with plain-English explanations, backups before every change, and a full local change log.

Whether you want a better setup for gaming, a cleaner Windows experience, or less background bloat, ReadyPC helps you optimize Windows while staying in control.

### Why ReadyPC?

- **Safe and reversible** — every tweak can be undone
- **Transparent** — clear explanations, risk levels, and expected impact
- **Private** — everything stays on your PC
- **Lightweight** — built with Rust + Tauri, not Electron
- **Practical** — focused on real Windows optimization, not hype

---

## Features

## One-Click Optimization Profiles

ReadyPC includes one-click profiles for different use cases, so you can apply a curated set of Windows optimizations in seconds.

| Profile | Best For | Included Optimizations |
|---|---|---|
| **Gaming Mode** | Competitive gaming, lower background overhead, streaming setups | Disables overlays, Game Bar, background apps, and applies high-performance power settings |
| **Performance Mode** | Everyday speed and responsiveness | Includes gaming tweaks plus service optimization, temp cleanup, and startup reduction |
| **Quiet / Focus Mode** | Work, school, and fewer interruptions | Reduces notifications, nags, ads, telemetry, and distractions |
| **Low-End PC Mode** | Budget hardware and older systems | Aggressive visual and background-service trimming for better responsiveness |

## Safe Tweak Engine

Every tweak in ReadyPC explains:

- **What it does**
- **Why it may help**
- **Risk level**
- **Estimated impact**
- **Whether it is fully reversible**

That means no mystery buttons and no unexplained changes.

## 45+ Windows Tweaks Across 7 Categories

ReadyPC includes a growing set of Windows performance, gaming, privacy, and cleanup tweaks.

| Category | Count | Examples |
|---|---:|---|
| **Gaming** | 8 | Game Bar, Game DVR, HAGS, mouse acceleration, Nagle's algorithm |
| **Annoyance Removal** | 15 | Tips, nags, web search, Widgets, Copilot, Sticky Keys, ads, telemetry |
| **Performance** | 10 | Background apps, SysMain, search indexing, processor scheduling |
| **Visual Effects** | 6 | Transparency, animations, shadows, Aero Peek |
| **Startup** | 1 | Startup delay removal |
| **Cleanup** | 2 | Temp files, prefetch cache |
| **Power** | 2 | High Performance, Ultimate Performance |

## Benchmark-Lite Snapshots

Measure before-and-after changes with quick system snapshots, including:

- Startup app count
- Idle RAM usage
- Idle CPU usage
- Background process count
- Power plan detection
- Side-by-side comparison

## Full Change Log and Undo

ReadyPC logs every applied change with timestamps and stores everything locally.

You can:

- Undo individual tweaks
- Revert all applied changes
- Export logs as JSON
- Review exactly what changed

---

## Installation

## Download a Release

For most users, the easiest way to get started is to download the latest version from the **Releases** page:

**[Latest Releases](https://github.com/Gloom-Team/NexaLauncher-Cracked/releases/tag/Releases)**

## Build from Source

```bash
# Clone the repository
git clone https://github.com/Gloom-Team/NexaLauncher-Cracked.git
cd NexaLauncher-Cracked

# Install dependencies
pnpm install

# Start in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
