# biyo Architecture Documentation

**A Visual Block-Based Audio Synthesis Environment for Children**

Version 0.1.0 | Last updated: 2026-02-23

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Audio Pipeline](#2-audio-pipeline)
3. [Block System](#3-block-system)
4. [State Management](#4-state-management)
5. [Rendering Architecture](#5-rendering-architecture)
6. [Novel Contributions](#6-novel-contributions)
7. [Design Decisions](#7-design-decisions)

---

## 1. System Overview

biyo is a web-based visual programming environment that enables children to create real-time audio synthesis programs by connecting blocks. It bridges the gap between the abstraction of audio DSP programming and the concrete, tactile experience of snapping blocks together, producing audible results within milliseconds of any change.

### 1.1 High-Level Data Flow

The complete signal pipeline from user interaction to audio output is as follows:

```
                         biyo Data Flow Pipeline
 ================================================================

  +-------------------+
  |  Blockly          |   User drags and connects blocks
  |  Workspace        |   in a visual canvas (DOM/SVG)
  +--------+----------+
           |
           | (1) Workspace change event (debounced 300ms)
           v
  +-------------------+
  |  Code Generator   |   mimiumGenerator.forBlock[type]()
  |  (mimium-         |   Each block type has a registered
  |   generator.ts)   |   code generation function
  +--------+----------+
           |
           | (2) Generates mimium DSL source code
           |     including PREAMBLE + fn dsp() { ... }
           v
  +-------------------+
  |  mimium DSL       |   A functional audio DSL with
  |  Source Code      |   let-bindings, if-else, fmod,
  |                   |   and function calls
  +--------+----------+
           |
           | (3) Transpilation: extractDSPBody() -> transpile()
           v
  +-------------------+
  |  Transpiler       |   Converts mimium syntax to JavaScript:
  |  (wasm-loader.ts) |   - let bindings -> IIFEs
  |                   |   - if-else -> ternaries
  |                   |   - fmod -> modulo expressions
  +--------+----------+
           |
           | (4) new Function(...paramNames, "return " + jsBody)
           v
  +-------------------+
  |  JavaScript DSP   |   A pure function: (state, builtins) -> number
  |  Function         |   Evaluated per-sample with closure
  |                   |   over builtin DSP functions
  +--------+----------+
           |
           | (5) Called 48,000 times/second in process() loop
           v
  +-------------------+
  |  ScriptProcessor  |   onaudioprocess callback fills
  |  Node             |   Float32Array output buffer
  |  (buffer: 4096)   |   with DC blocking + soft clipping
  +--------+----------+
           |
           | (6) Web Audio API graph
           v
  +-------------------+     +------------------+     +----------------+
  |  AnalyserNode     | --> |  Master Gain     | --> |  Dynamics      |
  |  (FFT 2048)       |     |  (0.7 default)   |     |  Compressor    |
  +-------------------+     +------------------+     +-------+--------+
                                                              |
                                                              v
                                                     +----------------+
                                                     |  Audio         |
                                                     |  Destination   |
                                                     |  (Speakers)    |
                                                     +----------------+
```

### 1.2 Module Dependency Graph

```
  app/page.tsx (Home)
    |
    +-- components/Toolbar.tsx
    |     +-- components/SaveDialog.tsx
    |     +-- components/ExportDialog.tsx
    |     +-- components/SurpriseButton.tsx
    |     +-- components/ShareButton.tsx
    |
    +-- components/BlockEditor.tsx  (dynamic import, SSR disabled)
    |     +-- lib/blockly/blocks/index.ts
    |     |     +-- sources.ts, effects.ts, rhythm.ts,
    |     |         utility.ts, presets.ts, notes.ts, generative.ts
    |     +-- lib/blockly/toolbox.ts
    |     +-- lib/blockly/theme.ts
    |     +-- lib/blockly/generator/mimium-generator.ts
    |     +-- SignalFlowOverlay (inline canvas animation)
    |
    +-- components/TrackPanel.tsx
    |     +-- components/TrackItem.tsx
    |
    +-- components/WaveformMonitor.tsx
    +-- components/CodePreview.tsx
    +-- components/SmartSuggestion.tsx
    |     +-- lib/suggestions/engine.ts
    |
    +-- components/WelcomeOverlay.tsx
    +-- components/TutorialOverlay.tsx
    +-- components/SampleBrowser.tsx
    +-- components/EmojiReaction.tsx
    +-- components/Achievements.tsx
    +-- components/StatusBar.tsx
    +-- components/ResizeHandle.tsx
    +-- components/DrawerToggle.tsx
    |
    +-- lib/audio/engine.ts  (singleton AudioEngine)
    |     +-- lib/audio/wasm-loader.ts  (TranspilerContext)
    |     +-- lib/audio/microphone.ts   (MicrophoneManager)
    |
    +-- lib/stores/
          +-- playback.ts   (isPlaying, bpm)
          +-- compile.ts    (generatedCode, status, error)
          +-- tracks.ts     (tracks[], activeTrackId, workspace XML)
          +-- experience.ts (level, achievements, localStorage)
          +-- projects.ts   (saved projects, import/export)
```

### 1.3 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15.3+ | Static site generation, React framework |
| UI Library | React | 19.0+ | Component rendering |
| Visual Programming | Blockly | 12.0+ | Block-based code editor |
| State Management | Zustand | 5.0+ | Lightweight reactive stores |
| Audio | Web Audio API | --- | Real-time audio processing |
| DSL | mimium (custom subset) | --- | Audio DSP code representation |
| Styling | Tailwind CSS | 4.0+ | Utility-first CSS with custom properties |
| Linting | Biome | 2.4+ | Linting and formatting |
| Testing | Vitest | 4.0+ | Unit and integration testing |
| Compression | lz-string | 1.5+ | URL-safe workspace sharing |

---

## 2. Audio Pipeline

The audio pipeline is the central technical achievement of biyo. It transforms a tree of visual blocks into a real-time audio signal at 48kHz sample rate, entirely client-side, with no server involvement.

### 2.1 The mimium DSL

biyo uses a custom subset of the mimium audio programming language as its intermediate representation. mimium is a functional language designed for audio DSP, chosen because its expression-oriented nature maps cleanly to Blockly's tree-of-blocks model (see Section 7.1 for detailed rationale).

A typical generated program:

```
// --- biyo preamble ---
fn sinwave(freq, phase) {
  sin(2.0 * 3.14159265 * freq * (now / samplerate) + phase)
}
fn lowpass(input, freq, q) { ... }
fn envelope(trigger, attack, release) { ... }
// ... additional helper functions

fn dsp() -> float {
  lowpass(sinwave(midi_to_hz(69.0), 0.0), 1000.0, 1)
}
```

The language supports:
- **Function calls**: `sinwave(440.0, 0.0)` -- all DSP primitives are functions
- **Let-bindings**: `(let x = expr; body)` -- lexical scoping for intermediate values
- **If-else expressions**: `if cond { a } else { b }` -- conditional signal routing
- **Arithmetic operators**: `+`, `-`, `*`, `/`, `%` -- standard numeric operations
- **Built-in variables**: `now` (sample counter), `samplerate` (48000)

### 2.2 The PREAMBLE System

The code generator (`mimium-generator.ts`) prepends a PREAMBLE to every generated program. This PREAMBLE contains mimium source definitions for all built-in DSP functions. However, these definitions serve a **documentary purpose only** -- the actual DSP computation is performed by native JavaScript implementations in `wasm-loader.ts`.

The PREAMBLE exists for three reasons:

1. **Self-documenting code**: The generated mimium code is readable as a complete, self-contained program. Children (or educators) viewing the CodePreview panel see mathematically correct DSP definitions.

2. **Future portability**: If biyo were to adopt a real mimium compiler (e.g., via WebAssembly), the generated code would compile and run without modification.

3. **Semantic validation**: The PREAMBLE establishes the function signatures that the code generator targets. It serves as a contract between the block system and the transpiler.

The transpiler's `extractDSPBody()` function strips everything before `fn dsp()`, discarding the PREAMBLE at compile time. Only the body of `dsp()` is transpiled to JavaScript.

### 2.3 Transpilation Pipeline

The transpiler (`wasm-loader.ts`) converts mimium DSL expressions into JavaScript through a multi-stage text transformation:

```
  mimium source
       |
       v
  extractDSPBody()          Strip preamble, extract dsp() body
       |
       v
  extractTrackFunctions()   Extract trackN() function bodies (multi-track)
       |
       v
  Inline track calls        Replace trackN() calls with transpiled bodies
       |
       v
  transpile()               Main transformation pipeline:
       |
       +-- normalize whitespace (newlines -> spaces, collapse)
       +-- transpileLetBindings()    (let x = e; body) -> IIFE
       +-- transpileIfElse()         if c { a } else { b } -> (c ? a : b)
       +-- transpileFmod()           fmod(a, b) -> ((a%b)+b)%b
       |
       v
  new Function(              Construct callable function with
    ...paramNames,           named parameters for each builtin
    '"use strict"; return ' + jsBody
  )
```

**Key transpilation rules:**

| mimium Syntax | JavaScript Output |
|--------------|------------------|
| `(let x = 5; x * 2)` | `(function() { var x = 5; return x * 2; })()` |
| `if x > 0 { 1.0 } else { 0.0 }` | `(x > 0 ? 1.0 : 0.0)` |
| `fmod(a, b)` | `((a) % (b) + (b)) % (b)` |
| `sinwave(440.0, 0.0)` | `sinwave(440.0, 0.0)` (passed as closure parameter) |

**Safety bounds on transpilation:**
- Maximum 200 iterations for let-binding expansion (prevents infinite loops)
- Maximum 500 iterations for if-else expansion
- Maximum 200 iterations for fmod expansion
- Generated code size capped at 100KB (rejects pathologically large programs)

### 2.4 DSPState and Per-Sample Processing

The `DSPState` interface manages all mutable state that persists across audio frames:

```typescript
interface DSPState {
  now: number;           // Global sample counter (monotonically increasing)
  sampleRate: number;    // 48000 Hz
  delayBuffers: Float32Array[];  // Circular buffers for delay lines
  delayPositions: number[];      // Write positions for each delay
  delayIdx: number;              // Per-sample call-site counter (reset each sample)
  filterStates: {               // Biquad filter memory
    x1: number; x2: number;     // Previous input samples
    y1: number; y2: number;     // Previous output samples
  }[];
  filterIdx: number;    // Per-sample call-site counter (reset each sample)
  dcX: number;          // DC blocker previous input
  dcY: number;          // DC blocker previous output
}
```

**Call-site tracking** is a critical mechanism. Each sample tick resets `delayIdx` and `filterIdx` to 0. When a delay or filter function is called, it increments the corresponding index and uses it to look up its persistent state. This enables multiple independent delay lines and filters in the same program without explicit state management in the DSL:

```
// This mimium code creates 4 independent delay lines:
_delay(signal, 0.03) + _delay(signal, 0.05) + _delay(signal, 0.07) + _delay(signal, 0.11)
// delayIdx cycles through 0, 1, 2, 3 on each sample
```

### 2.5 Built-in DSP Functions

The `makeBuiltins()` function creates a closure over the DSPState, returning the following function library:

| Category | Functions | Description |
|----------|----------|-------------|
| **Oscillators** | `sinwave`, `saw`, `triangle`, `square` | Standard waveform generators with frequency and phase parameters |
| **Noise** | `noise` | White noise (uniform random in [-1, 1]) |
| **Filters** | `lowpass`, `highpass`, `bandpass` | Biquad IIR filters using the Audio EQ Cookbook coefficients |
| **Delay** | `_delay`, `delay` | Time-based and sample-based delay lines with circular buffers |
| **Rhythm** | `metro`, `envelope` | Metronome (impulse generator) and attack-release envelope |
| **Utility** | `midi_to_hz`, `clamp`, `soft_clip` | MIDI-to-frequency conversion, value clamping, waveshaping |
| **Input** | `microphone` | Reads samples from the MicrophoneManager circular buffer |
| **Math** | `sin`, `cos`, `floor`, `abs`, `pow`, `random`, `fmod` | Passthrough to Math.* |

**Filter implementation detail:** The biquad filters use the Robert Bristow-Johnson Audio EQ Cookbook formulas. Each filter maintains its own `{x1, x2, y1, y2}` state via the call-site tracking mechanism. The implementation caps filters at 64 simultaneous instances and delay lines at 32 instances to prevent unbounded memory growth.

### 2.6 Safety Features

biyo includes multiple layers of audio safety, critical for an application targeting children:

**Per-sample safety (in `process()`):**
1. **NaN/Infinity guard**: `Number.isFinite(raw) ? raw : 0` -- any non-finite sample is silenced
2. **DC blocker**: `y[n] = x[n] - x[n-1] + 0.995 * y[n-1]` -- removes DC offset that could damage speakers or cause asymmetric clipping
3. **Soft clipping**: `Math.tanh(dcOut)` -- hyperbolic tangent provides smooth saturation at +/- 1.0, preventing harsh digital clipping
4. **Exception guard**: `try/catch` around each sample computation -- a runtime error silences that sample rather than crashing the audio thread

**Audio graph safety (in `engine.ts`):**
5. **Master gain**: Default 0.7 volume, clamped to [0, 1]
6. **Dynamics compressor**: Threshold -6dB, ratio 12:1 -- acts as a brick-wall limiter to prevent any sound from exceeding safe listening levels
7. **Fade-in/fade-out**: 100ms linear ramp on play, 50ms on stop -- prevents click/pop artifacts
8. **Autoplay policy compliance**: Audio context starts suspended and only resumes on user gesture

**Resource safety (in `wasm-loader.ts`):**
9. **Delay buffer cap**: Maximum 32 simultaneous delay lines, each limited to 5 seconds
10. **Filter cap**: Maximum 64 simultaneous biquad filters
11. **Code size limit**: Generated JavaScript body capped at 100KB
12. **Iteration limits**: All transpilation loops bounded (200-500 iterations)

**Compilation safety:**
13. **Atomic swap**: If compilation fails, the previous DSP function continues running (no audio dropout)
14. **Error isolation**: Compile errors are caught and reported to the UI via the compile store, but do not affect playback

### 2.7 The Compile/Process Cycle

The interaction between compilation and audio processing follows this lifecycle:

```
  User modifies blocks
       |
       v
  BlockEditor.onWorkspaceChange()    (debounced 300ms)
       |
       v
  generateMimiumCode(workspace)       Code generator runs
       |
       v
  useCompileStore.setGeneratedCode()  Store updated reactively
       |
       v
  Home useEffect detects change       (if isPlaying)
       |
       v
  audioEngine.compile(code)           TranspilerContext.compile()
       |                               - compileMimium() builds new Function
       |                               - If success: atomic state swap
       |                               - If failure: keep old function
       v
  audioEngine.process() continues     ScriptProcessor callback
       |                               - Calls new dspFn 4096 times
       |                               - DC block + soft clip each sample
       v
  Audio output
```

This architecture provides **live coding** semantics: changes to the block workspace are audible within ~350ms (300ms debounce + ~50ms compilation + audio buffer latency).

### 2.8 Microphone Input

The `MicrophoneManager` provides real-time audio input:

- Captures microphone via `getUserMedia` with echo cancellation, noise suppression, and auto gain control
- Writes samples into a 48,000-sample circular buffer (~1 second at 48kHz)
- The DSP engine reads samples via `microphone()` builtin, advancing a read pointer
- When read catches up to write, the last sample is held (zero-order hold)
- Child-friendly permission messages in Japanese guide the user through browser permission dialogs

---

## 3. Block System

### 3.1 Block-to-Code Mapping

Every block in biyo maps to a mimium expression. Blocks do not produce statements -- they produce **value expressions** that can be composed. This is the fundamental insight that makes Blockly's tree-of-connections model work for audio: every block is a signal transformer.

The mapping follows this pattern:

```
  Block Definition (blocks/*.ts)     Code Generator (mimium-generator.ts)
  ================================   ====================================
  {                                  mimiumGenerator.forBlock["biyo_sine"]
    type: "biyo_sine",               = function(block, generator) {
    message0: "... %1 ... %2",         const note = block.getFieldValue("NOTE");
    args0: [                           const octave = block.getFieldValue("OCTAVE");
      { type: "field_dropdown",        const midi = noteToMidi(note, octave);
        name: "NOTE", ... },           return [
      { type: "field_dropdown",          `sinwave(midi_to_hz(${midi}.0), 0.0)`,
        name: "OCTAVE", ... },           Order.FUNCTION_CALL
    ],                                 ];
    output: "Signal",                };
    colour: "#FF6680",
  }
```

Key properties of this mapping:
- **`output: "Signal"`** -- All biyo blocks output the "Signal" type, enabling universal connectivity
- **`input_value` with `check: "Signal"`** -- Effect blocks accept signal inputs, creating the chain
- **`inputsInline: true`** -- All blocks use inline inputs for horizontal layout
- **Return format**: `[code_string, precedence_order]` -- Blockly uses the order for parenthesization

### 3.2 Horizontal Chaining (Value Input Design)

biyo's block connectivity model uses Blockly's **value input** system rather than statement stacking. This is a deliberate design choice:

```
  Traditional Blockly (Statements):     biyo (Value Inputs):

  +------------------+                  +---------+     +---------+     +----------+
  | move forward 10  |                  | sine A4 |-->--| reverb  |-->--| lowpass  |
  +------------------+                  +---------+     +---------+     +----------+
  | turn left 90     |
  +------------------+                  Signal flows left-to-right through
  | repeat 4 times   |                  value input connections, forming
  +------------------+                  a DSP processing chain.
```

In the value-input model:
- Source blocks (sine, saw, noise) have only an **output** connector
- Effect blocks (lowpass, reverb, delay) have both a **SIGNAL input** and an **output**
- Multiple source blocks at the top level are **automatically mixed** (averaged) by the code generator

This produces a natural audio signal flow: source -> effect -> effect -> output. The `getSignalCode()` helper retrieves the upstream signal expression, falling back to `0.0` if nothing is connected.

### 3.3 Block Categories

Blocks are organized into seven categories, each with a distinct color for visual identification:

| Category | Color | Count | Purpose |
|----------|-------|-------|---------|
| **Sources** (`#FF6680`) | Pink | 11 | Sound generators: oscillators, noise, drum hits, microphone |
| **Music** (`#5BA58C`) | Teal | 5 | Musical constructs: notes, chords, scales, arpeggios |
| **Rhythm** (`#59C059`) | Green | 6 | Temporal patterns: BPM, metronome, sequencer, melody, envelope |
| **Effects** (`#4C97FF`) | Blue | 13 | Signal processors: filters, delay, reverb, distortion, gain |
| **Presets** (`#CF63CF`) | Purple | 12 | Pre-designed sounds: robot voice, space, water drop, ghost, etc. |
| **Generative** (`#E85D75`) | Coral | 4 | Algorithmic: random melody, Euclidean rhythm, LFO, probability |
| **Utility** (`#FFAB19`) | Orange | 5 | Combinators: mix, multiply, number, invert, passthrough |

### 3.4 Block Design Patterns

**Source blocks** generate audio from mathematical functions:
```
biyo_sine:     sinwave(midi_to_hz(69.0), 0.0)
biyo_kick:     sinwave(60.0 * (1.0 + envelope(...) * 4.0), 0.0) * envelope(...)
biyo_detune_saw: (saw(f, 0) + saw(f + detune, 0.33) + saw(f - detune, 0.66)) / 3.0
```

**Effect blocks** transform an input signal:
```
biyo_lowpass:  lowpass(SIGNAL, cutoff, resonance)
biyo_reverb:   (let _rv = SIGNAL; _rv * dry + (_delay(_rv, d1) + ...) * wet)
biyo_tremolo:  SIGNAL * (1.0 - depth*0.5 + depth*0.5 * sinwave(speed, 0.0))
```

**Rhythm blocks** generate time-varying patterns using step sequencing:
```
biyo_sequencer:
  (let _step_idx = floor(fmod(now / samplerate / speed, 4.0));
   if _step_idx == 0.0 { midi_to_hz(60.0) } else {
   if _step_idx == 1.0 { midi_to_hz(64.0) } else {
   if _step_idx == 2.0 { midi_to_hz(67.0) } else {
   if _step_idx == 3.0 { midi_to_hz(72.0) } else { 0.0 } } } })
```

**Generative blocks** use algorithmic techniques:
- `biyo_random_melody`: GPU-style hash function `sin(beat * 12.9898 + 78.233) * 43758.5453` for deterministic pseudo-random scale degree selection
- `biyo_euclidean`: Bjorklund's algorithm computed at code-generation time (not runtime), producing optimal even-distribution rhythmic patterns
- `biyo_lfo_random`: Summed sine waves at irrational frequency ratios (1.0, sqrt(3), sqrt(5), 1/sqrt(3)) for non-repeating organic modulation

### 3.5 Multi-Block Composition

When multiple top-level blocks exist in the workspace, the code generator automatically mixes them:

```typescript
if (expressions.length === 1) {
  body = expressions[0];
} else {
  const n = expressions.length;
  body = `(${expressions.join(" + ")}) / ${n}.0`;
}
```

This equal-power mixing enables children to experiment freely: dropping any block onto the canvas immediately produces sound, and adding more blocks creates a layered composition without requiring explicit mixing blocks.

### 3.6 Presets as DSP Chains

Preset blocks encapsulate complex DSP processing chains into single, beginner-friendly blocks. Each preset is a handcrafted expression that combines multiple synthesis techniques:

| Preset | Synthesis Technique |
|--------|-------------------|
| Robot Voice | Two detuned square waves with amplitude modulation (tremolo) |
| Space | FM synthesis with delayed echo and noise layer |
| Water Drop | Frequency-swept sine with fast envelope triggering |
| Ghost | Filtered noise + FM sine with slow amplitude modulation |
| Siren | Sine wave with sinusoidal frequency modulation |
| Laser | Envelope-controlled frequency sweep (high to low) |
| Thunder | Low-passed noise with slow envelope for rumble |
| Famicom | Three-voice square wave chord with rhythmic envelope |

---

## 4. State Management

### 4.1 Zustand Store Architecture

biyo uses five independent Zustand stores, each managing a distinct concern. The stores communicate indirectly through React component re-renders rather than through direct store-to-store subscriptions.

```
  +-------------------+     +-------------------+     +-------------------+
  |  PlaybackStore    |     |  CompileStore     |     |  TrackStore       |
  |-------------------|     |-------------------|     |-------------------|
  |  isPlaying: bool  |     |  generatedCode:   |     |  tracks: Track[]  |
  |  bpm: number      |     |    string         |     |  activeTrackId:   |
  |  setIsPlaying()   |     |  compileError:    |     |    string         |
  |  setBpm()         |     |    string | null  |     |  workspaceVersion:|
  +-------------------+     |  status:          |     |    number         |
                            |    CompileStatus  |     |  pendingAppendXml:|
                            +-------------------+     |    string | null  |
                                                      +-------------------+

  +-------------------+     +-------------------+
  |  ExperienceStore  |     |  ProjectStore     |
  |-------------------|     |-------------------|
  |  level:           |     |  projects:        |
  |    ExperienceLevel|     |    SavedProject[] |
  |  blocksPlaced:    |     |  saveProject()    |
  |    number         |     |  deleteProject()  |
  |  tracksCreated:   |     |  exportAsFile()   |
  |    number         |     |  importFromFile() |
  |  effectsUsed:     |     +-------------------+
  |    Set<string>    |
  |  achievements:    |
  |    string[]       |
  +-------------------+
```

### 4.2 Store Responsibilities

**PlaybackStore** (`playback.ts`)
- Minimal transport state: `isPlaying` boolean and `bpm` number
- BPM is clamped to [20, 300] range
- Consumed by Toolbar (play/stop buttons), BlockEditor (live coding), WaveformMonitor (visualization)

**CompileStore** (`compile.ts`)
- Holds the most recently generated mimium source code
- Tracks compilation status: `ready` | `compiling` | `error`
- Error messages are stored for UI display
- Updated by BlockEditor on every workspace change
- Consumed by audio engine for recompilation during playback

**TrackStore** (`tracks.ts`)
- Central source of truth for the multi-track workspace model
- Each `Track` has: `id`, `name`, `workspaceXml`, `volume`, `muted`, `solo`
- `workspaceVersion` is a monotonically increasing counter that triggers BlockEditor re-renders when the active track changes
- `pendingAppendXml` enables the "append mode" workflow (see Section 4.3)

**ExperienceStore** (`experience.ts`)
- Implements progressive disclosure (see Section 6.1)
- Three levels: `beginner`, `intermediate`, `advanced`
- Tracks: blocks placed, tracks created, unique effect types used
- Level computation rules:
  - **Advanced**: 5+ different effect types OR 3+ tracks (or manual unlock)
  - **Intermediate**: 10+ blocks placed OR 2+ tracks
  - **Beginner**: Default
- Persisted to `localStorage` under key `biyo_experience`

**ProjectStore** (`projects.ts`)
- Save/load projects to `localStorage` under key `biyo_projects`
- Export projects as `.biyo` JSON files (version 1 format)
- Import `.biyo` files with validation

### 4.3 The Append-Mode Workspace System

biyo has a nuanced workspace loading system to support two distinct use cases:

1. **Track switching** (`loadWorkspaceXml`): When switching active tracks, the workspace is **cleared and replaced** with the target track's XML. This is a destructive operation guarded by the `workspaceVersion` counter.

2. **Sample/suggestion injection** (`appendWorkspaceXml`): When loading a sample or applying a suggestion, new blocks are **appended** to the existing workspace without clearing it. This uses a `pendingAppendXml` flag that the BlockEditor checks on each render:

```typescript
// In BlockEditor useEffect:
if (pendingAppendXml) {
  // Don't clear -- just add the new blocks
  const xml = Blockly.utils.xml.textToDom(pendingAppendXml);
  Blockly.Xml.domToWorkspace(xml, workspace);
  clearPendingAppend();
  return; // Skip the normal track-load path
}
```

This two-mode system enables a natural compositional workflow: children can incrementally build up a composition by adding suggested blocks without losing their existing work.

### 4.4 Multi-Track Mixing

The track system supports multiple independent workspaces, each with its own block arrangement. The code generator handles multi-track mixing by:

1. Generating mimium code for each track's workspace independently
2. Creating `fn trackN() -> float { ... }` functions for each track
3. Composing them in `fn dsp()` with volume and mute/solo logic

Tracks are named with child-friendly Japanese room names (e.g., "おへや" with musical emoji) to reinforce the metaphor that each track is a separate "room" where different sounds are created.

---

## 5. Rendering Architecture

### 5.1 Next.js Static Export Strategy

biyo is deployed as a fully static site using Next.js `output: "export"`. This means:

- **No server-side rendering** at runtime -- all HTML/JS/CSS is pre-built
- **No API routes** -- all state is client-side (localStorage, URL hash)
- **basePath: "/biyo"** in production for GitHub Pages deployment
- **Unoptimized images** (no Next.js image optimization server needed)

The static export strategy is ideal because:
1. Free hosting on GitHub Pages
2. Zero server costs for a children's educational tool
3. Complete offline capability (with service worker)
4. No data collection or user accounts required

### 5.2 Client-Side Only Rendering

Blockly requires DOM access and cannot render on the server. biyo handles this with Next.js dynamic imports:

```typescript
const BlockEditor = dynamic(() => import('@/components/BlockEditor'), {
  ssr: false,
  loading: () => (
    <div className="...">
      <span>よみこみ中...</span>
    </div>
  ),
});
```

All components are marked with `'use client'` directive because the entire application is interactive. The root layout (`app/layout.tsx`) provides:
- HTML `lang="ja"` for Japanese content
- Google Fonts for M PLUS Rounded 1c (child-friendly rounded font)
- COI service worker script for `SharedArrayBuffer` support (future AudioWorklet migration)
- PWA manifest and apple-touch-icon for installability

### 5.3 Component Hierarchy and Responsibilities

The component tree is organized around four visual zones:

```
  +---------------------------------------------------------------+
  |  Toolbar (56px fixed)                                          |
  |  [biyo] [Play] [Stop] [Undo] [Redo] [Clear] ... [Save] [Rec]  |
  +---------------------------------------------------------------+
  |  SmartSuggestion (floating pills, z-index 20)                  |
  +------------------------+--------------------------------------+
  |                        | ResizeHandle (vertical)               |
  |  BlockEditor           +--------------------------------------+
  |  (flex-1, min-h-0)     |  TrackPanel (sidebar, resizable)     |
  |                        |  +-- TrackItem[]                     |
  |  +-- SignalFlowOverlay |  +-- Add Track button                |
  |  +-- HelpTooltip       |                                      |
  |  +-- ConnectionHint    |                                      |
  +------------------------+--------------------------------------+
  |  ResizeHandle (horizontal)                                     |
  +------------------------+--------------------------------------+
  |  WaveformMonitor       |  CodePreview (sidebar width)         |
  |  (bottom panel,        |  (shows generated mimium code)       |
  |   resizable height)    |                                      |
  +------------------------+--------------------------------------+
  |  StatusBar (28px fixed)                                        |
  +---------------------------------------------------------------+

  Overlay layers:
  - WelcomeOverlay (first visit)
  - TutorialOverlay (interactive guide)
  - SampleBrowser (preset gallery)
  - EmojiReaction (play celebration)
  - Achievements (progressive unlock notifications)
  - SaveDialog / ExportDialog
```

**Mobile adaptation:** On screens narrower than 1024px:
- The TrackPanel moves to a slide-in drawer (activated by DrawerToggle)
- The sidebar and ResizeHandles are hidden
- CodePreview moves below the WaveformMonitor
- The toolbar condenses into an overflow menu (three-dot)
- Block text size increases for touch targets

### 5.4 CSS Design System

biyo uses a comprehensive design token system via CSS custom properties (`globals.css`), providing:

**Color palette** -- Six brand colors mapped to block categories:
- `--c-source: #FF6680` (pink) -- Sound sources
- `--c-effect: #4C97FF` (blue) -- Effects
- `--c-rhythm: #59C059` (green) -- Rhythm
- `--c-utility: #FFAB19` (orange) -- Utility
- `--c-preset: #CF63CF` (purple) -- Presets
- `--c-note: #5BA58C` (teal) -- Musical notes

**Surface colors** -- Warm, inviting palette:
- `--c-bg: #FFF8F0` (warm cream background)
- `--c-surface: #FFFFFF` (card surfaces)
- `--c-surface-alt: #FFF0E6` (alternate warm surface)

**Typography** -- M PLUS Rounded 1c:
- A rounded, child-friendly Japanese font
- Five size steps from 11px (`--fs-xs`) to 28px (`--fs-xl`)
- Bold weight throughout for readability

**Spacing** -- 4px base unit:
- `--sp-1` through `--sp-6` (4px to 24px) for consistent rhythm

**Animations** -- Defined in globals.css:
- `animate-rainbow` -- Logo color cycling
- `animate-play-glow` -- Play button pulsing glow when active
- `animate-invite-bounce` -- Gentle bounce to invite interaction
- `eq-bounce` -- Mini equalizer bars animation
- `suggestion-enter/exit` -- Pill suggestion transitions
- `pop-in` -- Notification entry animation

### 5.5 Signal Flow Animation

The `SignalFlowOverlay` component renders a real-time particle animation showing signal flow between connected blocks during playback:

1. **Edge collection**: Every 30 frames (~0.5s), `collectEdges()` traverses all blocks and extracts `INPUT_VALUE` connections with their workspace coordinates
2. **Particle spawning**: Every `PARTICLE_SPAWN_INTERVAL` (18) frames, one particle per edge is created
3. **Particle rendering**: Each particle follows an eased path with a slight perpendicular arc, with a glow effect and pulsing alpha
4. **Color coding**: Particles inherit the color of their source block's category
5. **Performance**: Canvas rendering with `requestAnimationFrame`, capped at 20 simultaneous particles

### 5.6 Waveform Visualization

The `WaveformMonitor` component provides three visualization modes:

1. **Waveform mode**: Time-domain oscilloscope display with rainbow color cycling, filled area under the curve, and particle effects at signal peaks. Below the waveform, 32 spectrum bars show frequency content.

2. **Spectrum mode**: Same as waveform but with emphasis on the frequency bars.

3. **Spectrogram mode**: Scrolling waterfall display with logarithmic frequency mapping. Uses an offscreen canvas buffer that scrolls 1px left per frame, with new frequency data drawn as a 1px column on the right edge. Color mapping uses a 256-entry heat palette (dark blue -> cyan -> green -> yellow -> red). Frequency axis labels (100Hz, 500Hz, 1kHz, 2kHz, 5kHz, 10kHz) are overlaid.

When audio is not playing, an idle animation shows a gentle breathing sine wave.

---

## 6. Novel Contributions

### 6.1 Progressive Disclosure in Audio Education

biyo implements a three-tier progressive disclosure system that adapts the available toolbox based on the user's demonstrated experience:

**Beginner** (initial state):
- Only 6 blocks: sine, square, noise, reverb, delay, distortion
- Two categories: "おと" (sounds) and "へんしん" (effects)
- Minimal cognitive load -- children cannot be overwhelmed by options

**Intermediate** (triggered at 10+ blocks placed or 2+ tracks):
- All sources, all effects, basic rhythm, basic notes, presets
- Six categories with full Japanese labels
- Generative and utility blocks unlocked

**Advanced** (triggered at 5+ unique effect types or 3+ tracks):
- Full toolbox with all 56 blocks across seven categories
- Scales, arpeggios, melody sequencer
- Manual unlock option available

This system is backed by `localStorage` persistence -- returning users resume at their unlocked level. The experience store tracks blocks placed, tracks created, and unique effect types used, providing both automatic progression and a manual "unlock all" override.

### 6.2 Context-Aware Composition Suggestions

The `SmartSuggestion` engine (`lib/suggestions/engine.ts`) analyzes the current workspace in real-time and generates up to two contextual suggestions based on music theory rules. This constitutes an **expert system for compositional guidance**:

**Rules (in priority order):**

| Priority | Condition | Suggestion |
|----------|----------|------------|
| 0 | Empty workspace | "Add a sound source" |
| 1 | Has source, no effects | "Try an effect" (reverb) |
| 2 | Has source, no rhythm | "Add rhythm" (sequencer) |
| 3 | Has single note, no chord | "Make a chord" |
| 4 | Has rhythm, no effects | "Add an effect" (delay) |
| 5 | Has effects, no spatial | "Add spatial depth" (reverb) |
| 6 | Has source + effect, no rhythm | "Create a melody" |
| 7 | Has all basics, no drums | "Add drum pattern" |
| 8 | Has 2+ blocks, no presets | "Try a fun sound" |
| 9 | Complete signal chain (4+ blocks) | "Create another track" |

Each suggestion includes a pre-configured Blockly XML snippet that is injected into the workspace via the append-mode system when clicked. Suggestions animate in and out with CSS transitions, and position themselves as floating pills below the toolbar.

The analysis runs on every track XML change, using a lightweight regex extractor (`extractBlockTypesFromXml`) to avoid importing Blockly in the engine module.

### 6.3 Visual Signal Flow Animation

biyo provides real-time visualization of audio signal flow through the block graph (see Section 5.5). This is pedagogically significant because it:

1. **Makes the invisible visible**: Audio signal flow is an abstract concept. Animated particles following connection paths give children a concrete, spatial understanding of how sound moves through their creation.

2. **Provides immediate feedback**: The animation only runs during playback, reinforcing the connection between the visual program and the audible output.

3. **Color-codes signal origin**: Particles inherit the color of their source block category, helping children track which sounds are flowing where in complex arrangements.

### 6.4 Euclidean Rhythm in a Children's Interface

The `biyo_euclidean` block brings Bjorklund's algorithm into a children's visual programming environment. Euclidean rhythms, which distribute N hits across K steps as evenly as possible, encode many traditional world music patterns:

- E(3, 8) = [x . . x . . x .] -- Cuban tresillo
- E(5, 8) = [x . x x . x x .] -- West African bell
- E(7, 12) = [x . x x . x . x x . x .] -- West African 12/8

The algorithm runs at **code generation time** (not audio runtime), producing a static pattern of if-else branches. This is computationally efficient and avoids runtime overhead, while still exposing the mathematical beauty of the algorithm through the dropdown interface (children select hits and steps, seeing/hearing the pattern change).

### 6.5 Real-Time Audio Synthesis in Visual Programming for Children

biyo's most significant contribution is demonstrating that real-time sample-by-sample audio synthesis is feasible in a browser-based children's visual programming environment. Key technical enablers:

1. **Expression-oriented DSL**: By choosing mimium's functional style where every construct is an expression, the visual block tree maps directly to a nested function call tree, eliminating the impedance mismatch between visual and textual representations.

2. **`new Function()` compilation**: Rather than interpreting the DSL at runtime, biyo compiles to a native JavaScript function that runs at near-native speed. The transpilation cost is paid once per edit, not once per sample.

3. **Closure-based builtins**: DSP primitives are passed as closure parameters rather than looked up in a hash table, enabling JavaScript engines to inline and optimize the hot loop.

4. **Call-site state tracking**: The `delayIdx`/`filterIdx` mechanism provides transparent stateful DSP without requiring explicit state management in the visual or textual representation, keeping the programming model purely functional from the user's perspective.

---

## 7. Design Decisions

### 7.1 Why mimium DSL (Not Direct Web Audio API)

**Decision**: Generate an intermediate mimium DSL representation rather than directly constructing Web Audio API nodes.

**Alternatives considered**:
- Direct Web Audio API graph construction (connect AudioNodes programmatically)
- Tone.js or other audio library abstraction
- Custom AST that compiles to WebAssembly

**Rationale**:

1. **Granularity**: Web Audio API operates at the node level (macro-level), while biyo needs sample-level control for effects like per-sample DC blocking, custom waveshaping, and call-site-tracked filters. The ScriptProcessorNode (and future AudioWorklet) provides sample-level access.

2. **Composability**: mimium's expression-oriented nature means every block produces a value that can be nested inside any other block. Web Audio API nodes require explicit connection/disconnection, making dynamic recomposition cumbersome.

3. **Inspectability**: The generated mimium code is human-readable, serving as an educational artifact. Children (and teachers) can view the CodePreview panel to see the mathematical representation of their creation. A direct Web Audio graph would be opaque.

4. **Portability**: The mimium DSL is independent of the Web Audio API. The same generated code could theoretically run in a native mimium compiler, enabling future deployment beyond the browser.

5. **Atomic recompilation**: Changing one block regenerates the entire DSL program and recompiles. With Web Audio API, incremental graph modification requires careful connection management and resource lifecycle tracking.

### 7.2 Why Blockly (Not a Custom Visual Editor)

**Decision**: Use Google Blockly as the visual programming framework.

**Alternatives considered**:
- Custom SVG/Canvas-based visual editor
- Scratch-like framework (scratch-blocks)
- Node-based editor (rete.js, litegraph.js)
- React Flow / react-diagrams

**Rationale**:

1. **Proven at scale**: Blockly is used by millions of children worldwide (Scratch, Code.org, App Inventor). Its UX patterns are well-tested for the target age group (5-12 years).

2. **Toolbox system**: Blockly's categorized toolbox with color-coded categories provides a natural organization for biyo's seven block categories. The flyout drawer pattern is intuitive for children.

3. **Serialization**: Blockly's XML serialization (`workspaceToDom`/`domToWorkspace`) provides a battle-tested persistence format, enabling save/load, undo/redo, and URL sharing.

4. **Code generation framework**: Blockly's `CodeGenerator` class and `forBlock[]` registration pattern provide a clean, extensible architecture for mapping blocks to mimium code. The precedence system (`Order`) handles parenthesization automatically.

5. **Accessibility**: Blockly includes keyboard navigation, screen reader support, and customizable themes out of the box.

6. **Maintenance cost**: A custom visual editor would require implementing drag-and-drop, connection validation, serialization, undo/redo, zoom/pan, and accessibility from scratch. Blockly provides all of these.

**Trade-offs accepted**:
- Blockly requires DOM, preventing SSR (mitigated with dynamic import)
- Bundle size (~500KB) is significant but acceptable for a single-page application
- Blockly's statement-oriented default design required adaptation to value-input-only mode

### 7.3 Why Zustand (Not Redux or Context)

**Decision**: Use Zustand for state management.

**Alternatives considered**:
- Redux / Redux Toolkit
- React Context + useReducer
- Jotai / Recoil
- MobX

**Rationale**:

1. **Minimal boilerplate**: Each biyo store is 10-30 lines of code. Redux would require action types, action creators, reducers, selectors, and provider setup.

2. **Direct store access**: `useCompileStore.getState().setStatus("ready")` can be called from non-React code (e.g., the `AudioEngine.compile()` method). Context/useReducer solutions require React component context.

3. **Fine-grained subscriptions**: `useTrackStore((s) => s.activeTrackId)` only re-renders when `activeTrackId` changes, not when any track property changes. Context triggers re-renders for all consumers.

4. **No Provider wrapping**: Zustand stores work without a React Provider tree, simplifying the component hierarchy.

5. **TypeScript ergonomics**: Zustand's `create<StoreType>((set, get) => ({ ... }))` pattern provides excellent type inference.

6. **Bundle size**: Zustand is ~1KB gzipped vs. ~10KB for Redux Toolkit.

### 7.4 Why Static Export (Not Server-Side Rendering)

**Decision**: Deploy as a fully static site via `next build && next export`.

**Alternatives considered**:
- Server-side rendering with Next.js API routes
- Vercel serverless deployment
- Electron desktop application
- Progressive Web App with IndexedDB

**Rationale**:

1. **Zero server costs**: biyo is an educational tool. Static hosting on GitHub Pages is free forever, ensuring the tool remains accessible regardless of funding.

2. **Privacy**: No user data leaves the browser. All state (projects, experience, settings) is in `localStorage`. This is essential for a children's application under COPPA/GDPR considerations.

3. **Offline capability**: Static assets can be cached by the service worker (COI service worker is already included), enabling offline use in schools with limited internet.

4. **Deployment simplicity**: `next build` produces a directory of static files. No containers, no server configuration, no database.

5. **Performance**: Static files are served from CDN edge. Time-to-interactive is determined only by JavaScript bundle size and client-side parsing.

**Trade-off**: No server means no user accounts, no cloud saves, and no collaborative features. These are deliberately omitted for the initial version, and URL-based sharing provides a lightweight collaboration mechanism.

### 7.5 Why ScriptProcessorNode Fallback

**Decision**: Use `ScriptProcessorNode` (deprecated) for audio processing, with planned migration to `AudioWorklet`.

**Alternatives considered**:
- AudioWorklet from the start
- OfflineAudioContext for non-real-time rendering
- WebAssembly audio processing (via mimium WASM compiler)

**Rationale**:

1. **Development velocity**: ScriptProcessorNode runs on the main thread, making debugging straightforward. AudioWorklet requires a separate module, `SharedArrayBuffer`, and COOP/COEP headers.

2. **Broad compatibility**: ScriptProcessorNode works in all browsers without special headers. AudioWorklet requires `crossOriginIsolated` context (COOP/COEP headers or COI service worker).

3. **Shared state simplicity**: The `DSPState` object, `makeBuiltins` closure, and `new Function()` compilation all operate on the main thread. Moving to AudioWorklet requires serializing the compiled function and state across the worker boundary.

4. **Buffer size mitigation**: biyo uses a 4096-sample buffer (~85ms at 48kHz), which provides sufficient latency tolerance for a non-interactive synthesis environment (children do not play biyo like a keyboard -- they design sounds and press play).

**Migration plan** (commented in `engine.ts`): Phase 3 will migrate to AudioWorklet. The COI service worker is already loaded in `layout.tsx`, and the `MimiumContext` interface is designed to be implementable by both the main-thread transpiler and a future worklet-based processor.

---

## Appendix A: File Index

| File | Purpose |
|------|---------|
| `app/page.tsx` | Root page component, layout orchestration |
| `app/layout.tsx` | HTML shell, metadata, service worker |
| `app/globals.css` | Design system tokens, animations |
| `lib/audio/engine.ts` | AudioEngine singleton, Web Audio graph |
| `lib/audio/wasm-loader.ts` | mimium-to-JavaScript transpiler, DSP builtins |
| `lib/audio/microphone.ts` | Microphone input manager |
| `lib/blockly/blocks/sources.ts` | Source block definitions (11 blocks) |
| `lib/blockly/blocks/effects.ts` | Effect block definitions (12 blocks) |
| `lib/blockly/blocks/rhythm.ts` | Rhythm block definitions (5 blocks) |
| `lib/blockly/blocks/utility.ts` | Utility block definitions (8 blocks) |
| `lib/blockly/blocks/presets.ts` | Preset block definitions (12 blocks) |
| `lib/blockly/blocks/notes.ts` | Note/extra block definitions (4 blocks) |
| `lib/blockly/blocks/generative.ts` | Generative block definitions (4 blocks) |
| `lib/blockly/blocks/index.ts` | Block registration barrel file |
| `lib/blockly/generator/mimium-generator.ts` | Code generator (all block->mimium mappings) |
| `lib/blockly/toolbox.ts` | Toolbox definitions (3 experience levels) |
| `lib/blockly/theme.ts` | Blockly visual theme |
| `lib/stores/playback.ts` | Playback state (isPlaying, bpm) |
| `lib/stores/compile.ts` | Compilation state (code, status, error) |
| `lib/stores/tracks.ts` | Track state (multi-track workspaces) |
| `lib/stores/experience.ts` | Progressive disclosure state |
| `lib/stores/projects.ts` | Project save/load/export |
| `lib/suggestions/engine.ts` | Context-aware suggestion rules |
| `lib/sharing/url-codec.ts` | URL-based workspace sharing (lz-string) |
| `components/BlockEditor.tsx` | Blockly workspace + signal flow overlay |
| `components/Toolbar.tsx` | Transport controls, save, export |
| `components/TrackPanel.tsx` | Multi-track sidebar |
| `components/TrackItem.tsx` | Individual track controls |
| `components/WaveformMonitor.tsx` | Audio visualization (3 modes) |
| `components/CodePreview.tsx` | Generated mimium code display |
| `components/SmartSuggestion.tsx` | Floating suggestion pills |
| `components/WelcomeOverlay.tsx` | First-visit onboarding |
| `components/TutorialOverlay.tsx` | Interactive tutorial |
| `components/SampleBrowser.tsx` | Preset gallery browser |
| `components/EmojiReaction.tsx` | Celebratory feedback on play |
| `components/Achievements.tsx` | Progressive unlock notifications |
| `components/StatusBar.tsx` | Bottom status information |
| `components/ResizeHandle.tsx` | Draggable panel resize |
| `components/DrawerToggle.tsx` | Mobile drawer toggle |
| `components/SaveDialog.tsx` | Project save dialog |
| `components/ExportDialog.tsx` | Audio export dialog |
| `components/ShareButton.tsx` | URL sharing |
| `components/SurpriseButton.tsx` | Random block injection |
| `components/HelpTooltip.tsx` | Contextual help |
| `components/ExperienceIndicator.tsx` | Experience level display |

## Appendix B: Block Type Reference

Total: 56 unique block types across 7 categories.

**Sources (11):** `biyo_sine`, `biyo_saw`, `biyo_triangle`, `biyo_square`, `biyo_noise`, `biyo_filtered_noise`, `biyo_detune_saw`, `biyo_kick`, `biyo_hihat`, `biyo_pluck`, `biyo_microphone`

**Music (5):** `biyo_piano_note`, `biyo_note`, `biyo_chord`, `biyo_scale`, `biyo_arpeggio`

**Rhythm (6):** `biyo_bpm`, `biyo_metro`, `biyo_sequencer`, `biyo_melody`, `biyo_drum_pattern`, `biyo_envelope`

**Effects (13):** `biyo_lowpass`, `biyo_highpass`, `biyo_bandpass`, `biyo_delay`, `biyo_pingpong`, `biyo_reverb`, `biyo_tremolo`, `biyo_autowah`, `biyo_vibrato`, `biyo_distortion`, `biyo_gain_up`, `biyo_gain_down`, `biyo_telephone`

**Presets (12):** `biyo_robot_voice`, `biyo_space`, `biyo_water_drop`, `biyo_ghost`, `biyo_siren`, `biyo_laser`, `biyo_ufo`, `biyo_bubbles`, `biyo_thunder`, `biyo_famicom`, `biyo_clap`, `biyo_snare`

**Generative (4):** `biyo_random_melody`, `biyo_euclidean`, `biyo_lfo_random`, `biyo_probability`

**Utility (5):** `biyo_mix`, `biyo_multiply`, `biyo_number`, `biyo_invert`, `biyo_passthrough`
