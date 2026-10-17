# Flynx Expressive: Floating Bubble Browser & Reader

An interactive simulation and playground reproducing the beloved Flynx floating background-loading browser, reimagined with authentic Google Messages bubble spring physics, Material You dynamic color theming, magnetic bottom dismiss target, and a distraction-free reader mode.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying preferences confirmed in Phase 1 govern the product direction:
> - **Primary Experience**: Interactive floating browser simulation with Google Messages bubble physics.
> - **Design System**: Material You Expressive with dynamic color palettes, rounded pill containers, and elevation levels.
> - **Content Capabilities**: Dual-mode viewport supporting both clean distraction-free Reader Mode (with font scaling, sepia/dark themes, simulated TTS) and a responsive Web Browsing preview.

- **Confirmed Decision 1**: Interactive Google Messages physics simulation (chained drag physics, `0.92x` compression on press down, low-bounciness spring edge-snapping, bottom magnetic dismiss target with haptic scaling).
- **Confirmed Decision 2**: Multi-tab management reproducing Flynx's core value: background link queueing, tab badge counters, and an expandable modal overlay with tab switcher.
- **Confirmed Decision 3**: Full simulated phone environment with desktop responsiveness: an interactive device canvas with sample web articles and external link triggers, allowing users to experience the floating overlay over active apps.

---

## 1. Overview & Core Concept

### What It Does
Flynx Expressive provides a tactile, interactive browser simulation where users can open web links in floating background bubbles. Just like Android chat heads / Google Messages bubbles, these bubbles sit unobtrusively at the screen edge, display background loading status rings, can be flung across the display, compress when pressed, snap to screen bezels with spring physics, or get pulled into a magnetic "✕" dismiss target at the bottom.

Tapping the bubble expands a Material You floating browser drawer with:
1. **Reader Mode**: Distraction-free article extraction with theme switching (Light, Sepia, AMOLED Dark), typography scaling, and an audio player (Text-to-Speech simulation).
2. **Web Browser View**: Full-fidelity responsive web viewer with address bar, refresh/share controls, and security badges.
3. **Multi-Tab Drawer**: Switch between active floating tabs, spawn test links, or dismiss individual sessions.

### Target Audience & Use Case
Mobile UX enthusiasts, Android power users, and developers who appreciate ergonomic multitasking and want to experience or tune Google Messages-style floating gesture physics in a modern web environment.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Background Link Dispatch**: The user clicks any link in a sample newsfeed or enters a custom URL. A floating bubble spawns at the screen edge with a smooth spring entry and a spinning progress ring while "loading".
2. **Tactile Bubble Interaction**:
   - **Press Down**: Compresses smoothly to `0.92x` scale.
   - **Dragging**: Follows the pointer with fluid velocity tracking. When dragged toward the bottom-center, the **Magnetic Dismiss Target** appears, expands (`1.35x`), and magnetically snaps the bubble into place.
   - **Release / Fling**: If released over the dismiss target, it vaporizes with a scale/fade animation. If released anywhere else, it snaps smoothly to the nearest edge using damped spring physics.
3. **Bubble Expansion & Reading**:
   - Tapping an idle bubble opens the floating browser overlay with a fluid container expansion.
   - Users can toggle between **Reader Mode** and **Web View**, adjust text size, switch between Sepia, AMOLED Black, and Clean Light palettes, and hit **Listen** to launch the text-to-speech reading player.
4. **Physics & Settings Tuning**: A slide-out panel lets users inspect and tweak spring stiffness, damping, bubble scale, and snap margins in real time.

### Visual Identity & Theme
- **Aesthetic Direction**: Google Material 3 Expressive (Material You).
- **Color Palette**:
  - Dominant Neutral: M3 Surface Container (`#F7F9FC` light, `#121316` dark)
  - Primary Accent: Dynamic Indigo / Cerulean (`#1A73E8` light, `#8AB4F8` dark)
  - Secondary Accent: Coral Rose (`#E8715D`) for dismiss highlights
  - Reader Themes: Crisp Light (`#FFFFFF`), Warm Editorial Sepia (`#FBF0D9` text `#5F4B32`), AMOLED Charcoal (`#0B0E14`)
- **Typography**: Plus Jakarta Sans for UI chrome, Source Serif 4 / Merriweather for reader prose, JetBrains Mono for tabular metrics and physics values.
- **Micro-Interactions**: Damped spring animations (`stiffness: 260, damping: 22`), magnetic pull curves, smooth pill tabs, and elevation transitions.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Physics Engine Selection
- **Chosen Approach**: Built-in Framer Motion (`motion/react`) spring physics and pan gestures.
- **Why**: Native support for spring damping, velocity transfer, layout animations, and gesture drag constraints without heavy third-party canvas dependencies.
- **Trade-off**: Requires careful coordinate math for the magnetic target intersection, but provides 60fps compositor smoothness.

### Decision 2: Simulation Environment vs Standalone Overlay
- **Chosen Approach**: A dual-view interface with an interactive host smartphone preview frame on the right and a real-time physics control panel & link launcher on the left, plus a "Full Screen" mode.
- **Why**: Allows users to test the bubble floating *over* simulated background apps (like Reddit, Twitter/X, and News feeds) exactly as Flynx works on Android, while providing developer controls.

### Decision 3: Reader Extraction & TTS Simulation
- **Chosen Approach**: Curated rich articles with genuine prose, imagery, and Web Speech API (with fallback simulated synthesizer) for the "Listen to Article" feature.
- **Why**: Delivers an immediate, functioning audio reading experience without external paid API keys.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App State Container                             │
│  - tabs: TabSession[] (id, url, title, icon, content, progress, isRead)│
│  - activeTabId: string | null                                          │
│  - bubblePosition: { x, y } & snapState: 'left' | 'right'              │
│  - readerSettings: { theme, fontSize, fontFace, ttsPlaying, ttsRate }   │
│  - physicsSettings: { stiffness, damping, magneticThreshold }          │
└───────────────┬────────────────────────────────────────┬───────────────┘
                │                                        │
                ▼                                        ▼
┌──────────────────────────────┐        ┌────────────────────────────────┐
│   Host Device / Canvas View  │        │   Physics & Controls Sidebar   │
│  ┌────────────────────────┐  │        │  - Link Launcher & Spawner     │
│  │ Background Mock App    │  │        │  - Physics Parameter Sliders   │
│  │ (Feed / Article Host)  │  │        │  - Google Messages Theme Toggles│
│  └───────────┬────────────┘  │        │  - Architecture & Log Inspector│
│              │               │        └────────────────────────────────┘
│  ┌───────────▼────────────┐  │
│  │ Google Messages Bubble │  │
│  │ - 60dp Circular Card   │  │
│  │ - Unread Badge Count   │  │
│  │ - Pan / Spring Snapping│  │
│  └───────────┬────────────┘  │
│              │ (Drag State)  │
│  ┌───────────▼────────────┐  │
│  │ Magnetic Dismiss Target│  │
│  │ - Dynamic Scale & Haptic│ │
│  └───────────┬────────────┘  │
│              │ (Click State) │
│  ┌───────────▼────────────┐  │
│  │ Floating Browser Modal │  │
│  │ - Reader Mode (Sepia)  │  │
│  │ - Web Browser View     │  │
│  │ - Multi-Tab Switcher   │  │
│  │ - Text-to-Speech Player│  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### State & Interaction Mapping
- `useBubblePhysics`: Calculates drag offset, velocity, nearest edge coordinates, and Euclidean distance to the magnetic dismiss target.
- `TabSessionManager`: Tracks open tabs, active tab selection, loading progress animation, and memory limits (max 5 concurrent sessions).
- `SpeechSynthesizer`: Controls Web Speech API `SpeechSynthesisUtterance` with play, pause, seek, and rate adjustments.
