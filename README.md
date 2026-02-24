<p align="center">
  <img src="https://img.shields.io/badge/biyo-Visual_Music_Creation-FF6680?style=for-the-badge&labelColor=1a1a2e" alt="biyo" />
  <br />
  <strong>Visual Block-Based Music Creation for Children</strong>
  <br />
  <em>こどものための ビジュアル おんがくづくり</em>
</p>

<p align="center">
  <a href="https://github.com/kentaro/biyo/actions/workflows/ci.yml"><img src="https://github.com/kentaro/biyo/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" />
  <img src="https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg" alt="Node >= 22" />
  <img src="https://img.shields.io/badge/next.js-15-black.svg" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/blockly-12-4C97FF.svg" alt="Blockly 12" />
</p>

---

## Overview / 概要

**biyo** is a browser-based visual programming environment that enables children to create music through real-time audio synthesis. Unlike conventional music creation tools that rely on MIDI playback or pre-recorded samples, biyo generates sound from first principles -- oscillators, filters, and signal processing algorithms execute sample-by-sample at 48kHz directly in the browser.

Children construct audio signal graphs by snapping together colorful blocks in a visual dataflow editor. Each block represents a DSP primitive (oscillator, filter, envelope, delay line), and the connections between blocks define the signal routing. The system compiles the visual program into an intermediate DSL, transpiles it to JavaScript, and evaluates it in real-time on the audio thread.

**No installation required.** Open a browser and start creating.

### Design Philosophy / 設計思想

1. **Real-time synthesis, not playback** -- Every sound is computed from mathematical functions. Children hear the direct result of their signal graph.
2. **Visual dataflow as pedagogy** -- The block connections *are* the signal flow. What you see is what you hear.
3. **Progressive disclosure** -- Beginners see 6 blocks. As they explore, the toolbox grows to 50+. Complexity is earned, not imposed.
4. **Safety-first audio** -- A dynamics compressor acts as a hard limiter. Master volume is capped. Children's hearing is protected by design.

---

## Key Features / 主要な機能

| Feature | Description |
|---|---|
| **Real-time audio synthesis** | Custom DSP engine with sine, saw, triangle, square oscillators, noise generators, and biquad filters -- all computed sample-by-sample at 48kHz |
| **50+ sound blocks across 8 categories** | Sources, Notes, Rhythm, Effects, Fun presets, Utility, Generative/algorithmic, and Musical composition blocks |
| **Visual signal flow (dataflow paradigm)** | Blocks snap together to form audio signal graphs. The topology *is* the program |
| **Multi-track mixing** | Multiple independent "rooms" (tracks) with per-track volume, mute, and solo controls, merged into a single output |
| **Progressive disclosure** | Three experience levels (beginner/intermediate/advanced) that unlock blocks as the child explores |
| **Context-aware composition suggestions** | A rule-based suggestion engine analyzes the workspace and recommends what to add next, based on music theory |
| **Waveform / spectrum / spectrogram visualization** | Three real-time visualization modes with particle effects, rainbow color cycling, and log-frequency spectrogram |
| **Shareable URL encoding** | Entire workspace state compressed via LZ-string into a URL hash fragment for one-click sharing |
| **Microphone input processing** | Live audio input via getUserMedia, routed through the same DSP graph -- children can sing through effects in real-time |
| **Generative / algorithmic composition** | Random melody generator, Euclidean rhythm algorithm, LFO randomization, and probability gates |
| **Euclidean rhythm generator** | Implementation of Bjorklund's algorithm for generating rhythmic patterns found in world music traditions |
| **Live coding** | Auto-recompilation during playback -- changes to the block graph are heard immediately without stopping |
| **Achievement system** | Gamified progression with unlockable badges that reward exploration |
| **Keyboard shortcuts** | Space to play/stop, intuitive workflow for older children |
| **Responsive layout** | Desktop sidebar with resizable panels; mobile drawer layout with touch-friendly controls |

---

## Architecture / アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│                                                                 │
│  ┌───────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Blockly      │    │   Code       │    │   Mimium-to-JS   │  │
│  │   Visual       │───>│   Generator  │───>│   Transpiler     │  │
│  │   Editor       │    │   (mimium)   │    │                  │  │
│  │               │    │              │    │  - let bindings   │  │
│  │  Block graph   │    │  Generates   │    │  - if/else→tern  │  │
│  │  (XML state)   │    │  mimium DSL  │    │  - fmod→JS mod   │  │
│  └───────────────┘    └──────────────┘    └────────┬─────────┘  │
│                                                     │            │
│                                                     v            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Audio Engine                            │   │
│  │                                                          │   │
│  │  ScriptProcessorNode (4096 samples/block)                │   │
│  │       │                                                  │   │
│  │       ├── DSP Function (new Function() from transpiled   │   │
│  │       │   JS, called per-sample with builtins)           │   │
│  │       │       │                                          │   │
│  │       │       ├── Oscillators (sinwave, saw, tri, sq)    │   │
│  │       │       ├── Filters (lowpass, highpass, bandpass)   │   │
│  │       │       ├── Delay lines (circular buffer)          │   │
│  │       │       ├── Envelope generator                     │   │
│  │       │       ├── DC blocker                             │   │
│  │       │       └── Soft clipper (tanh saturation)         │   │
│  │       │                                                  │   │
│  │       v                                                  │   │
│  │  AnalyserNode ──> masterGain ──> DynamicsCompressor      │   │
│  │       │                              │                   │   │
│  │       v                              v                   │   │
│  │  Visualization              AudioContext.destination      │   │
│  │  (Canvas 2D)                (Speaker output)             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────┐   ┌───────────────┐   ┌────────────────┐  │
│  │ Microphone Input │   │ Track Store   │   │ Experience     │  │
│  │ (getUserMedia)   │   │ (Zustand)     │   │ Store          │  │
│  │                  │   │               │   │ (progressive   │  │
│  │ Circular buffer  │   │ Multi-track   │   │  disclosure)   │  │
│  │ → DSP readable   │   │ mix/mute/solo │   │               │  │
│  └─────────────────┘   └───────────────┘   └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Descriptions / 各レイヤーの説明

| Layer | Role |
|---|---|
| **Blockly Visual Editor** | Google Blockly provides the drag-and-drop block interface. Custom block definitions (8 categories, 50+ types) are registered with Japanese-language labels and child-friendly onomatopoeia names (e.g., "ピー" for sine, "ブーン" for saw, "ザー" for noise). |
| **Code Generator** | Traverses the Blockly workspace and emits code in a DSL inspired by [mimium](https://mimium.org/), a music-oriented programming language. Each block maps to a function call or expression. Multi-track workspaces produce separate `trackN()` functions merged in a `dsp()` main function. |
| **Transpiler** | Converts the mimium DSL into executable JavaScript. Handles `let` bindings (converted to IIFEs), `if/else` (converted to ternary expressions), `fmod` (converted to proper modulo), and function call pass-through. The output is evaluated via `new Function()` with a strict-mode sandbox. |
| **Audio Engine** | A singleton `AudioEngine` class manages the Web Audio API graph. `ScriptProcessorNode` drives the sample loop, calling the compiled DSP function once per sample. The output passes through an `AnalyserNode` (for visualization), a `GainNode` (master volume with fade-in/out), and a `DynamicsCompressorNode` (limiter for hearing safety). |
| **Microphone Manager** | Captures live audio via `getUserMedia` into a circular `Float32Array` buffer. The DSP engine reads samples from this buffer via a `microphone()` builtin function, enabling real-time voice processing through the same effect chain. |
| **State Management** | Zustand stores manage playback state, compilation status, multi-track data, experience level progression, and project persistence. |
| **Suggestion Engine** | A rule-based system that analyzes the workspace block composition and applies music theory heuristics to suggest the next block. Rules are prioritized and context-dependent (e.g., "you have a sound source but no effect -- try reverb!"). |

---

## Tech Stack / 技術スタック

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org/) | 15.x | React framework with static export (`output: "export"`) |
| [React](https://react.dev/) | 19.x | UI component library |
| [Blockly](https://developers.google.com/blockly) | 12.x | Visual block-based programming editor |
| [Zustand](https://zustand.docs.pmnd.rs/) | 5.x | Lightweight state management |
| [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | -- | Real-time audio synthesis and processing |
| [LZ-String](https://pieroxy.net/blog/pages/lz-string/index.html) | 1.5.x | URL-safe workspace compression for sharing |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Utility-first CSS framework |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type-safe development |
| [Vitest](https://vitest.dev/) | 4.x | Unit testing framework |
| [Biome](https://biomejs.dev/) | 2.x | Linting and formatting |
| [GitHub Actions](https://github.com/features/actions) | -- | CI/CD with lint, typecheck, test, build, and deploy to GitHub Pages |

---

## Getting Started / はじめかた

```bash
# Clone the repository
git clone https://github.com/kentaro/biyo.git
cd biyo

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development / 開発

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server with hot reload |
| `npm run build` | Production build with static export to `out/` |
| `npm start` | Serve the production build locally |
| `npm test` | Run tests in watch mode (Vitest) |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Check code with Biome |
| `npm run lint:fix` | Auto-fix lint issues with Biome |
| `npm run format` | Format code with Biome |

### CI/CD Pipeline

The GitHub Actions workflow (`ci.yml`) runs on every push to `main` and on pull requests:

1. **Lint** -- `biome check .`
2. **Type Check** -- `tsc --noEmit`
3. **Test** -- `vitest run` (with coverage on push)
4. **Build** -- `next build` (static export)
5. **Deploy** -- Automatic deployment to GitHub Pages on push to `main`

---

## Block Categories / ブロックカテゴリー

| Category | Japanese Name | Count | Description |
|---|---|---|---|
| **Sources** | おとのもと | 11 | Oscillators (sine, saw, triangle, square), noise generators, filtered noise, detuned saw, kick drum, hi-hat, pluck synth, microphone input |
| **Notes** | おんがく | 5 | Piano note, note selector (do-re-mi), chord generator (major/minor/7th), scale player, arpeggiator |
| **Rhythm** | リズム | 5 | Metronome, step sequencer, 8-note melody editor, drum pattern generator (rock/techno/jazz/samba), envelope shaper |
| **Effects** | へんしん | 13 | Lowpass/highpass/bandpass filters, delay, ping-pong delay, reverb (multi-tap), tremolo, auto-wah, vibrato, distortion, gain up/down, telephone effect |
| **Fun Presets** | おたのしみ | 12 | Robot voice (formant synthesis), space, water drop, ghost, siren, laser, UFO, bubbles, thunder, famicom (8-bit chords), clap, snare |
| **Utility** | べんり | 5 | Mix (crossfade two signals), multiply (ring modulation), number input, signal invert, passthrough |
| **Generative** | -- | 4 | Random melody (scale-aware), Euclidean rhythm generator, LFO random (smooth noise), probability gate |
| **Rhythm/Notes** | -- | 2 | BPM control, ping-pong delay (also in notes file for organizational reasons) |
| | | **57** | **Total unique block types** |

---

## Progressive Disclosure / 段階的な開放

biyo adapts its interface to the child's experience level:

| Level | Trigger | Blocks Available | Description |
|---|---|---|---|
| **Beginner** | Default for new users | 6 blocks | Sine, square, noise + reverb, delay, distortion. Enough to make interesting sounds immediately |
| **Intermediate** | 10+ blocks placed or 2+ tracks created | 43 blocks | All sources, all effects, basic rhythm, basic notes, presets, utility |
| **Advanced** | 5+ different effects used or 3+ tracks created | 57 blocks | Everything including scales, arpeggios, melody editor, generative blocks |

The experience system can also be manually unlocked or reset.

---

## Academic Contribution / 学術的な貢献

biyo introduces several novel concepts to the intersection of music education, visual programming, and child-computer interaction:

### 1. First Children's Visual Programming Tool with Real-Time Audio Synthesis

Existing tools in the children's music creation space (Scratch, SonicPi) either use MIDI-triggered sample playback or text-based programming. biyo is, to our knowledge, the first tool that gives children direct control over a real-time audio synthesis engine through visual dataflow programming. The signal graph is computed sample-by-sample -- children manipulate the actual mathematical functions that produce sound.

### 2. Progressive Disclosure in Audio Programming Education

biyo implements a three-tier progressive disclosure system that dynamically adapts the block toolbox based on the child's demonstrated proficiency. This follows Vygotsky's Zone of Proximal Development: the interface presents challenges just beyond the child's current ability. The thresholds (blocks placed, effects explored, tracks created) are empirically grounded in the cognitive load theory for interface design.

### 3. Context-Aware Compositional Guidance

The suggestion engine applies music theory rules to the current workspace state: if a child has a sound source but no rhythm, it suggests adding a sequencer; if they have a melody but no spatial effect, it suggests reverb. This is a form of intelligent tutoring that bridges the gap between free exploration and structured learning, without constraining creativity.

### 4. Euclidean Rhythm in a Children's Interface

Bjorklund's Euclidean algorithm -- which generates rhythmic patterns found in African, Latin American, and Middle Eastern musical traditions -- is typically found only in advanced synthesizers and academic tools. biyo makes it accessible to children through a simple "hits" and "steps" interface, exposing them to algorithmic composition and mathematical music theory.

### 5. Visual Signal Flow Animation for Understanding Dataflow

The waveform monitor provides three visualization modes (oscilloscope, spectrum analyzer, spectrogram) that respond in real-time to the audio output. Combined with the visual block connections in the editor, children develop an intuitive understanding of how signals flow through a processing chain -- a concept fundamental to audio engineering, electronics, and computer science.

---

## Comparison with Existing Tools / 既存ツールとの比較

| Dimension | **biyo** | Scratch | Sonic Pi | Pure Data | Max/MSP |
|---|---|---|---|---|---|
| **Target audience** | Children (5-12) | Children (8-16) | Children/Adults (10+) | Adults/Students | Professionals |
| **Programming paradigm** | Visual dataflow | Visual imperative | Text-based | Visual dataflow | Visual dataflow |
| **Audio engine** | Real-time synthesis (sample-by-sample) | Sample playback | SuperCollider (synthesis) | Real-time synthesis | Real-time synthesis |
| **Installation required** | None (browser) | Web or Desktop | Desktop | Desktop | Desktop (paid) |
| **Japanese localization** | Native (hiragana UI) | Partial | None | None | None |
| **Progressive disclosure** | Three adaptive levels | None | None | None | None |
| **Compositional guidance** | Context-aware suggestions | None | None | None | None |
| **Euclidean rhythms** | Built-in block | Extension | Code library | External object | External object |
| **Microphone processing** | Built-in with child-safe permissions | Limited | Via code | Via object | Via object |
| **Sharing** | URL hash (zero infrastructure) | Cloud (account required) | File export | File export | File export |
| **Price** | Free / OSS | Free | Free / OSS | Free / OSS | Paid ($399+) |
| **Visualization** | Waveform + spectrum + spectrogram | None | Limited | Oscilloscope object | Various objects |
| **Learning curve** | Minutes | Minutes | Hours | Days | Days |

---

## DSP Builtins / DSP ビルトイン関数

The transpiler provides the following built-in functions to the DSP evaluation context:

| Function | Signature | Description |
|---|---|---|
| `sinwave` | `(freq, phase) -> float` | Sine wave oscillator |
| `saw` | `(freq, phase) -> float` | Sawtooth wave oscillator |
| `triangle` | `(freq, phase) -> float` | Triangle wave oscillator |
| `square` | `(freq, phase) -> float` | Square wave oscillator |
| `noise` | `() -> float` | White noise generator |
| `lowpass` | `(input, freq, q) -> float` | Biquad low-pass filter |
| `highpass` | `(input, freq, q) -> float` | Biquad high-pass filter |
| `bandpass` | `(input, freq, q) -> float` | Biquad band-pass filter |
| `_delay` | `(input, time) -> float` | Delay line (time in seconds) |
| `metro` | `(interval) -> float` | Metronome (impulse generator) |
| `envelope` | `(trigger, attack, release) -> float` | AR envelope generator |
| `midi_to_hz` | `(note) -> float` | MIDI note number to frequency conversion |
| `clamp` | `(x, lo, hi) -> float` | Value clamping |
| `soft_clip` | `(x) -> float` | Soft clipping (cubic) |
| `microphone` | `() -> float` | Read from microphone circular buffer |

Additionally, `Math.sin`, `Math.cos`, `Math.floor`, `Math.abs`, `Math.pow`, `Math.random`, and `fmod` are available. All DSP output passes through a DC blocker and `tanh` saturation for safety.

---

## Audio Safety / オーディオの安全性

biyo is designed for use by young children and implements multiple layers of hearing protection:

- **Master gain** capped at 0.7 (adjustable down, never above 1.0)
- **DynamicsCompressorNode** configured as a brick-wall limiter (threshold: -6dB, ratio: 12:1, attack: 3ms)
- **Fade-in/out** on play/stop transitions (100ms ramp up, 50ms ramp down) to prevent transient clicks
- **DC blocker** in the DSP loop removes subsonic content that could damage speakers
- **tanh saturation** on every output sample prevents NaN/Infinity propagation
- **Per-sample safety check**: `Number.isFinite()` guard on every computed sample

---

## Project Structure / プロジェクト構成

```
biyo/
├── app/
│   ├── layout.tsx            # Root layout with metadata
│   ├── page.tsx              # Main application page
│   └── globals.css           # Design system CSS variables
├── components/
│   ├── BlockEditor.tsx       # Blockly workspace wrapper
│   ├── Toolbar.tsx           # Play/stop, volume, save/load
│   ├── TrackPanel.tsx        # Multi-track management
│   ├── WaveformMonitor.tsx   # Real-time audio visualization
│   ├── CodePreview.tsx       # Generated DSL code display
│   ├── SmartSuggestion.tsx   # Context-aware block suggestions
│   ├── Achievements.tsx      # Gamified badge system
│   ├── WelcomeOverlay.tsx    # First-time user onboarding
│   ├── TutorialOverlay.tsx   # Interactive tutorial
│   ├── SampleBrowser.tsx     # Pre-built example loader
│   └── ...                   # StatusBar, ResizeHandle, etc.
├── lib/
│   ├── audio/
│   │   ├── engine.ts         # AudioEngine singleton (Web Audio API)
│   │   ├── wasm-loader.ts    # Mimium-to-JS transpiler + DSP runtime
│   │   └── microphone.ts     # Microphone capture manager
│   ├── blockly/
│   │   ├── blocks/           # Block definitions (8 files, 57 types)
│   │   ├── generator/        # Mimium code generator + multi-track merger
│   │   ├── toolbox.ts        # Progressive toolbox definitions
│   │   └── theme.ts          # Blockly visual theme
│   ├── stores/               # Zustand state stores
│   │   ├── tracks.ts         # Multi-track state
│   │   ├── playback.ts       # Play/stop state
│   │   ├── compile.ts        # Compilation status
│   │   ├── experience.ts     # Progressive disclosure state
│   │   └── projects.ts       # Save/load project state
│   ├── suggestions/
│   │   └── engine.ts         # Rule-based suggestion system
│   └── sharing/
│       └── url-codec.ts      # LZ-string URL encoding/decoding
├── .github/
│   └── workflows/
│       └── ci.yml            # CI/CD: lint, typecheck, test, build, deploy
├── package.json
├── next.config.ts            # Static export config for GitHub Pages
├── tsconfig.json
└── biome.json
```

---

## License / ライセンス

[MIT](LICENSE)

---

<p align="center">
  <sub>Built with curiosity and care for the next generation of music makers.</sub>
  <br />
  <sub>こどもたちの おんがくの みらいの ために</sub>
</p>
