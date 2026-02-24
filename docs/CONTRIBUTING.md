# Contributing to biyo

Thank you for your interest in contributing to **biyo** -- a visual block-based music creation app designed for children. Whether you are fixing a bug, adding a new sound block, improving the UI, or writing documentation, your contribution is welcome.

This guide will help you get up and running quickly.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Adding a New Block](#adding-a-new-block)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Architecture Overview](#architecture-overview)

---

## Development Setup

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 22+ | Required by CI and the project toolchain |
| **npm** | 10+ | Ships with Node 22 |

### Installation

```bash
git clone https://github.com/<owner>/biyo.git
cd biyo
npm ci
```

### Running the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app uses Next.js with hot module replacement, so changes to components and styles are reflected immediately.

### Running tests

```bash
# Watch mode (re-runs on file changes)
npm test

# Single run
npm run test:run

# With coverage report
npm run test:coverage
```

### Other useful commands

```bash
# Lint (check only)
npm run lint

# Lint and auto-fix
npm run lint:fix

# Format code
npm run format

# Type-check
npx tsc --noEmit

# Production build (static export to out/)
npm run build
```

---

## Project Structure

```
biyo/
├── app/                        # Next.js App Router
│   ├── globals.css             # Design system (CSS custom properties)
│   ├── layout.tsx              # Root layout (metadata, fonts, service worker)
│   ├── page.tsx                # Main application page
│   └── not-found.tsx           # 404 page
│
├── components/                 # React components
│   ├── BlockEditor.tsx         # Blockly workspace wrapper (dynamically imported)
│   ├── Toolbar.tsx             # Top bar (play/stop, BPM, share, etc.)
│   ├── TrackPanel.tsx          # Sidebar: track list management
│   ├── TrackItem.tsx           # Individual track row in the sidebar
│   ├── CodePreview.tsx         # Generated mimium code viewer
│   ├── WaveformMonitor.tsx     # Real-time audio waveform display
│   ├── StatusBar.tsx           # Bottom status bar
│   ├── SampleBrowser.tsx       # Browsable sample library dialog
│   ├── WelcomeOverlay.tsx      # First-visit onboarding overlay
│   ├── TutorialOverlay.tsx     # Step-by-step tutorial
│   ├── ShareButton.tsx         # URL sharing functionality
│   ├── ExportDialog.tsx        # Audio export dialog
│   ├── SaveDialog.tsx          # Project save dialog
│   ├── ResizeHandle.tsx        # Draggable panel resize handles
│   ├── DrawerToggle.tsx        # Mobile drawer toggle button
│   ├── HelpTooltip.tsx         # Contextual help tooltips
│   ├── EmojiReaction.tsx       # Emoji particles on play
│   ├── Achievements.tsx        # Gamification: achievement system
│   ├── SmartSuggestion.tsx     # AI-like contextual suggestions
│   ├── ExperienceIndicator.tsx # User experience level indicator
│   └── SurpriseButton.tsx      # Random sound surprise feature
│
├── lib/                        # Core logic (non-React)
│   ├── blockly/
│   │   ├── blocks/             # Block definitions (one file per category)
│   │   │   ├── index.ts        # Re-exports all block categories
│   │   │   ├── sources.ts      # Sound source blocks (sine, saw, noise, kick...)
│   │   │   ├── effects.ts      # Effect blocks (lowpass, reverb, delay...)
│   │   │   ├── rhythm.ts       # Rhythm blocks (metro, sequencer, drum patterns)
│   │   │   ├── notes.ts        # Note/chord blocks (piano, chord, scale)
│   │   │   ├── presets.ts      # Preset sound blocks (robot, siren, laser...)
│   │   │   ├── generative.ts   # Generative blocks (random melody, euclidean)
│   │   │   └── utility.ts      # Utility blocks (mix, multiply, number)
│   │   ├── generator/
│   │   │   ├── mimium-generator.ts  # Code generator: blocks -> mimium DSP code
│   │   │   ├── code-merger.ts       # Merges multiple track outputs
│   │   │   └── __tests__/
│   │   │       └── mimium-generator.test.ts  # Generator tests
│   │   ├── toolbox.ts          # Toolbox definitions (beginner/intermediate/advanced)
│   │   └── theme.ts            # Custom Blockly theme (colors, fonts)
│   │
│   ├── audio/
│   │   ├── engine.ts           # Audio engine: compile, play, stop via mimium WASM
│   │   ├── wasm-loader.ts      # WASM module loader
│   │   ├── microphone.ts       # Microphone input handling
│   │   └── recorder.ts         # Audio recording/export
│   │
│   ├── stores/                 # Zustand state management
│   │   ├── playback.ts         # Play/stop, BPM, waveform data
│   │   ├── compile.ts          # Generated code, compilation status
│   │   ├── tracks.ts           # Multi-track workspace management
│   │   ├── projects.ts         # Project save/load
│   │   ├── experience.ts       # User experience level (beginner/intermediate/advanced)
│   │   └── __tests__/          # Store unit tests
│   │
│   ├── hooks/
│   │   └── useResizableLayout.ts  # Panel resize hook
│   │
│   ├── sharing/
│   │   └── url-codec.ts        # URL-based workspace sharing (LZ-string compression)
│   │
│   ├── suggestions/
│   │   └── engine.ts           # Smart suggestion engine
│   │
│   ├── samples.ts              # 100 sample songs (XML workspace definitions)
│   └── types/
│       └── mimium-web.d.ts     # TypeScript declarations for mimium WASM
│
├── test/
│   └── setup.ts                # Vitest setup (jest-dom matchers)
│
├── scripts/
│   └── generate-icons.mjs      # PWA icon generation script
│
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── icon-192.png            # PWA icon (192x192)
│   ├── icon-512.png            # PWA icon (512x512)
│   └── coi-serviceworker.js    # Cross-origin isolation for SharedArrayBuffer
│
├── .github/
│   └── workflows/
│       └── ci.yml              # CI pipeline (lint, typecheck, test, build, deploy)
│
├── biome.json                  # Biome linter/formatter configuration
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Vitest test runner configuration
├── next.config.ts              # Next.js configuration (static export, GitHub Pages)
├── postcss.config.mjs          # PostCSS configuration (Tailwind CSS v4)
└── package.json                # Dependencies and scripts
```

---

## Code Style

### Biome (linting and formatting)

The project uses [Biome](https://biomejs.dev/) for both linting and formatting. The configuration lives in `biome.json`.

Key settings:

| Setting | Value |
|---------|-------|
| Indent style | **Spaces** (2-space) |
| Line width | **100** characters |
| Quote style | **Single quotes** |
| Trailing commas | **All** |
| Semicolons | **Always** |
| Import organization | **Auto-sorted** |

Before committing, run:

```bash
npm run lint:fix
npm run format
```

Or to check without modifying files:

```bash
npm run lint
```

### TypeScript strict mode

The project uses `"strict": true` in `tsconfig.json`. This means:

- No implicit `any`
- Strict null checks
- Strict function types
- No unused locals/parameters (caught by Biome)

Do not weaken these settings.

### Naming conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Block type names | `biyo_<snake_case>` | `biyo_sine`, `biyo_drum_pattern` |
| UI text (user-facing) | **Japanese** (child-friendly) | `"ピー おと %1 たかさ %2"` |
| Code identifiers | **English** | `getSignalCode`, `noteToMidi` |
| CSS custom properties | `--c-` (color), `--sp-` (spacing), `--r-` (radius), `--fs-` (font size) | `--c-source`, `--sp-4` |
| Component files | **PascalCase** `.tsx` | `BlockEditor.tsx` |
| Non-component modules | **camelCase** or **kebab-case** `.ts` | `mimium-generator.ts` |
| Test files | Co-located in `__tests__/` directory | `__tests__/mimium-generator.test.ts` |
| Store files | **camelCase** `.ts` in `lib/stores/` | `playback.ts` |

### CSS custom properties -- never hardcode colors

All colors, spacing, radii, and font sizes are defined as CSS custom properties in `app/globals.css`. Components must use these tokens rather than hardcoded values.

```tsx
// GOOD
<div className="bg-[var(--c-surface)] text-[var(--c-text)] p-[var(--sp-3)]">

// BAD -- do not do this
<div className="bg-white text-gray-800 p-3">
<div style={{ color: '#333344' }}>
```

Available token prefixes:

- `--c-*` -- Colors (e.g., `--c-bg`, `--c-source`, `--c-text-sub`, `--c-border`)
- `--sp-*` -- Spacing (e.g., `--sp-1` through `--sp-6`, based on 4px increments)
- `--r-*` -- Border radii (e.g., `--r-sm`, `--r-md`, `--r-lg`, `--r-full`)
- `--fs-*` -- Font sizes (e.g., `--fs-xs`, `--fs-sm`, `--fs-md`, `--fs-lg`, `--fs-xl`)
- `--shadow-*` -- Box shadows (e.g., `--shadow-sm`, `--shadow-md`, `--shadow-btn`)
- `--font-*` -- Font families (e.g., `--font-main`, `--font-mono`)

---

## Adding a New Block

This is the most common type of contribution. Follow these steps to add a new block (for example, a hypothetical "chorus" effect):

### Step 1: Define the block

Create or edit the appropriate category file in `lib/blockly/blocks/`.

For an effect block, edit `lib/blockly/blocks/effects.ts`:

```typescript
const biyo_chorus = {
  type: 'biyo_chorus',
  message0: 'コーラス %1 はやさ %2 ふかさ %3',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'SPEED',
      options: [
        ['ゆっくり', '1'],
        ['ふつう', '3'],
        ['はやい', '6'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'DEPTH',
      options: [
        ['すこし', '0.2'],
        ['ふつう', '0.5'],
        ['たくさん', '0.8'],
      ],
    },
  ],
  output: 'Signal',
  colour: '#4C97FF',  // Effect color
  tooltip: 'おとをかさねてあつくするよ！コーラスたいみたい',
  inputsInline: true,
};
```

Key rules for block definitions:

- **`type`** must start with `biyo_` and use snake_case.
- **`message0`** is the user-facing label -- write in simple Japanese (target audience: children).
- **`tooltip`** should be a child-friendly explanation in Japanese.
- **`output: 'Signal'`** for blocks that produce audio signals.
- Use `input_value` with `check: 'Signal'` for audio inputs.
- Use `field_dropdown` with Japanese display labels and English/numeric values.

Do not forget to register the block at the bottom of the file:

```typescript
// Add to the allBlocks array
const allBlocks = [
  // ...existing blocks...
  biyo_chorus,
];
```

If you are creating a new category file, import it from `lib/blockly/blocks/index.ts`:

```typescript
import './your_new_category';
```

### Step 2: Add the code generator

Edit `lib/blockly/generator/mimium-generator.ts` and add a generator function in the appropriate section:

```typescript
mimiumGenerator.forBlock['biyo_chorus'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const speed = parseFloat(String(block.getFieldValue('SPEED') ?? '3'));
  const depth = parseFloat(String(block.getFieldValue('DEPTH') ?? '0.5'));
  const delayTime = (depth * 0.005).toFixed(6);
  const code = `(${signal}) * 0.7 + _delay(${signal}, ${delayTime} + ${delayTime} * sinwave(${speed}.0, 0.0)) * 0.3`;
  return [code, Order.ADD];
};
```

Generator rules:

- Use `getSignalCode(block, inputName, generator)` to retrieve connected input code. It returns `"0.0"` when nothing is connected.
- Return a tuple of `[code: string, order: number]`. Use the `Order` enum for operator precedence.
- All numeric literals in mimium code must end with `.0` (e.g., `3.0`, not `3`).
- If the generated code uses helpers not in the PREAMBLE (e.g., `sinwave`, `_delay`, `lowpass`), check that they already exist. If you need a new helper, add it to the `PREAMBLE` constant.

### Step 3: Add to the toolbox

Edit `lib/blockly/toolbox.ts` and add the block to the correct category in the `toolbox` constant (the full/advanced toolbox). If appropriate, also add it to `intermediateToolbox` and/or `beginnerToolbox`.

```typescript
{
  kind: 'category',
  name: '\u2728 \u3078\u3093\u3057\u3093',  // "Henshin" (Effects)
  colour: '#4C97FF',
  contents: [
    // ...existing effect blocks...
    { kind: 'block', type: 'biyo_chorus' },
  ],
},
```

### Step 4: Add transpiler support (if needed)

If your block uses a new DSP primitive not already in the `PREAMBLE` (the helper functions at the top of `mimium-generator.ts`), add it there. For example:

```typescript
const PREAMBLE = `
// ... existing helpers ...

fn chorus(input, speed, depth) {
  let mod = depth * (0.5 + 0.5 * sin(2.0 * 3.14159265 * speed * (now / samplerate)));
  input * 0.7 + delay(input, mod * samplerate) * 0.3
}
`.trim();
```

### Step 5: Write tests

Add tests in `lib/blockly/generator/__tests__/mimium-generator.test.ts`:

```typescript
describe('biyo_chorus', () => {
  it('generates chorus effect code', () => {
    const [code, order] = generateBlock({
      type: 'biyo_chorus',
      fields: { SPEED: '3', DEPTH: '0.5' },
      connectedInputs: { SIGNAL: 'noise()' },
    });
    expect(code).toContain('noise()');
    expect(code).toContain('_delay(');
    expect(code).toContain('sinwave(3.0, 0.0)');
    expect(order).toBe(Order.ADD);
  });

  it('uses fallback when no signal connected', () => {
    const [code] = generateBlock({
      type: 'biyo_chorus',
      fields: { SPEED: '3', DEPTH: '0.5' },
    });
    expect(code).toContain('(0.0)');
  });
});
```

Use the existing `generateBlock` and `createMockBlock` helpers already defined in the test file.

### Step 6: Add to samples (optional but encouraged)

If your new block creates an interesting sound, add one or more sample entries in `lib/samples.ts`:

```typescript
{
  key: 'fun_chorus_dream',
  name: 'ゆめのコーラス',
  category: 'fun',
  description: 'ゆめみたいなきれいなおと',
  xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_chorus" ${X(200, 60)}>
    <field name="SPEED">3</field>
    <field name="DEPTH">0.5</field>
    <value name="SIGNAL">
      <block type="biyo_sine">
        <field name="NOTE">C</field>
        <field name="OCTAVE">4</field>
      </block>
    </value>
  </block>
</xml>`,
},
```

---

## Testing

### Test framework

The project uses [Vitest](https://vitest.dev/) with jsdom environment. React component tests use `@testing-library/react` and `@testing-library/jest-dom` matchers.

### Test file locations

Tests are co-located with the code they test, inside `__tests__/` directories:

```
lib/blockly/generator/__tests__/mimium-generator.test.ts
lib/audio/__tests__/wasm-loader.test.ts
lib/stores/__tests__/compile.test.ts
lib/stores/__tests__/playback.test.ts
lib/stores/__tests__/projects.test.ts
lib/stores/__tests__/tracks.test.ts
```

### Test categories

| Category | Location | Description |
|----------|----------|-------------|
| **Block generator** | `lib/blockly/generator/__tests__/` | Tests that each block type produces correct mimium code |
| **Store logic** | `lib/stores/__tests__/` | Tests for Zustand store actions and state transitions |
| **Audio** | `lib/audio/__tests__/` | Tests for WASM loading and audio engine |

### Writing a test

For block generator tests, use the existing helper functions:

```typescript
import { describe, it, expect } from 'vitest';

describe('biyo_my_block', () => {
  it('produces expected code with given fields', () => {
    const [code, order] = generateBlock({
      type: 'biyo_my_block',
      fields: { FIELD_NAME: 'value' },
      connectedInputs: { SIGNAL: 'noise()' },
    });
    expect(code).toContain('expected_output');
    expect(order).toBe(Order.FUNCTION_CALL);
  });
});
```

For Zustand store tests, access the store directly via `getState()`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useMyStore } from '../my-store';

describe('MyStore', () => {
  beforeEach(() => {
    const fresh = useMyStore.getInitialState();
    useMyStore.setState(fresh, true);
  });

  it('does something', () => {
    useMyStore.getState().someAction();
    expect(useMyStore.getState().someValue).toBe(expected);
  });
});
```

### Running coverage

```bash
npm run test:coverage
```

Coverage is powered by V8 via Vitest. The CI pipeline generates a coverage report on pushes to `main`.

---

## Pull Request Process

### Branch naming

Use a descriptive branch name with a prefix:

```
feat/chorus-effect
fix/reverb-clipping
docs/contributing-guide
refactor/store-cleanup
test/generator-edge-cases
```

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add chorus effect block
fix: prevent reverb feedback loop clipping
docs: add contributing guide
test: add edge case tests for sequencer
refactor: extract MIDI conversion to shared utility
chore: update biome to v2.4.4
```

### CI checks

Every pull request must pass **all four** CI jobs before merging:

1. **Lint** -- `npx biome check .` (no lint errors)
2. **Type Check** -- `npx tsc --noEmit` (no type errors)
3. **Test** -- `npx vitest run` (all tests pass)
4. **Build** -- `npm run build` (production build succeeds)

You can run all of these locally before pushing:

```bash
npx biome check . && npx tsc --noEmit && npx vitest run && npm run build
```

### Review process

1. Open a pull request against `main`.
2. Fill in a clear description of **what** changed and **why**.
3. If adding a new block, include a screenshot or description of how it sounds.
4. A maintainer will review your PR. Address any feedback.
5. Once approved and CI passes, a maintainer will merge.

### Tips for a smooth review

- Keep PRs focused: one feature or fix per PR.
- If you are adding a new block, include the block definition, generator, toolbox entry, tests, and optionally a sample -- all in one PR.
- Run `npm run lint:fix && npm run format` before pushing to avoid CI lint failures.
- If your change affects audio output, describe how you tested it (e.g., "played the block in the browser and verified the sound").

---

## Architecture Overview

For a deeper look at the system architecture, data flow, and design decisions, see [docs/ARCHITECTURE.md](./ARCHITECTURE.md).

**High-level data flow:**

```
Blockly Workspace (user drags blocks)
        |
        v
Block Definitions (lib/blockly/blocks/)
        |
        v
Code Generator (lib/blockly/generator/mimium-generator.ts)
        |
        v
mimium DSP code (fn dsp() -> float { ... })
        |
        v
Audio Engine (lib/audio/engine.ts) -> mimium WASM -> Web Audio API -> Sound!
```

**State management:**

All application state flows through [Zustand](https://github.com/pmndrs/zustand) stores in `lib/stores/`. Components subscribe to stores and react to changes. There is no prop-drilling for global state.

---

## Questions?

If something in this guide is unclear or you get stuck, please open an issue. We are happy to help.

Welcome aboard, and happy hacking!
