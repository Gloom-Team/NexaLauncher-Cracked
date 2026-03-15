# ReadyPC

**Optimize Windows for gaming, speed, and less annoyance.**

ReadyPC is an open-source Windows optimizer that applies safe, reversible tweaks to make your PC faster and less annoying. No fake FPS claims, no sketchy registry hacks — just honest, well-documented changes with full undo capability.

## Features

### One-Click Profiles
- **Gaming Mode** — Disables overlays, background apps, keyboard interruptions, and sets high performance power
- **Performance Mode** — Everything in Gaming plus service optimization, temp cleanup, and startup reduction
- **Quiet / Focus Mode** — Silences notifications, removes nags, disables telemetry noise and promotional content
- **Low-End PC Mode** — Aggressive optimization for budget hardware: all visual effects off, all services trimmed

### Safe Tweak Engine
Every single tweak shows:
- **What it does** — plain English explanation
- **Why it helps** — real technical reasoning
- **Risk level** — Safe, Moderate, or Advanced
- **Impact estimate** — honest assessment of the effect
- **Reversibility** — one click to undo

### 45+ Tweaks Across 7 Categories
| Category | Count | Examples |
|----------|-------|---------|
| Gaming | 8 | Game Bar, Game DVR, HAGS, mouse acceleration, Nagle's algorithm |
| Annoyance Removal | 15 | Tips/nags, web search, Widgets, Copilot, Sticky Keys, ads, telemetry |
| Performance | 10 | Background apps, SysMain, search indexing, processor scheduling |
| Visual Effects | 6 | Transparency, animations, shadows, Aero Peek |
| Startup | 1 | Startup delay removal |
| Cleanup | 2 | Temp files, prefetch cache |
| Power | 2 | High Performance, Ultimate Performance |

### Benchmark-Lite
Take system snapshots before and after optimization:
- Startup app count
- RAM usage at idle
- CPU usage at idle
- Background process count
- Power plan detection
- Before/after comparison

### Full Change Log
Every modification is logged with timestamps. Export your changes as JSON. Undo individual tweaks or everything at once.

## Tech Stack

- **Backend**: Rust (Tauri v2) — all tweak logic, registry operations, system info, backup/restore
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Lucide icons
- **Build**: Vite + Tauri CLI

## Prerequisites

- [Rust](https://rustup.rs/) (1.70+)
- [Node.js](https://nodejs.org/) (18+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

## Development

```bash
# Install frontend dependencies
pnpm install

# Run in development mode (launches both Vite dev server and Tauri window)
pnpm tauri dev

# Build for production
pnpm tauri build
```

The production build outputs to `src-tauri/target/release/bundle/`.

## Project Structure

```
ReadyPC/
  src-tauri/              # Rust backend
    src/
      engine/             # Safe Tweak Engine (executor, backup, logger)
      tweaks/             # All tweak definitions (gaming, annoyances, performance, etc.)
      profiles/           # One-click profile presets
      system/             # System info, process enumeration, benchmark-lite
      commands/           # Tauri IPC command handlers
      utils/              # Admin elevation, Windows API helpers
  src/                    # React frontend
    pages/                # Dashboard, Profiles, Tweaks, Annoyances, SystemInfo, ChangeLog
    components/           # UI components (layout, tweaks, profiles, system, common)
    hooks/                # React hooks for data fetching
    lib/                  # TypeScript types and Tauri invoke wrappers
```

## How It Works

1. **Tweaks** are defined as data structures with registry paths, service names, or commands
2. Before applying any tweak, the **Backup System** snapshots current values to `%APPDATA%/ReadyPC/`
3. The **Executor** applies changes (registry edits, service configs, power plans)
4. The **Change Logger** records every action with timestamps
5. **Undo** restores original values from the backup

All data is stored locally. Nothing is sent anywhere.

## Admin Privileges

ReadyPC requests admin elevation at startup because most tweaks modify:
- `HKEY_LOCAL_MACHINE` registry keys
- Windows services
- Power plans

If you decline the UAC prompt, tweaks that only modify `HKEY_CURRENT_USER` will still work.

## License

MIT
