import { describe, expect, it } from 'vitest';
import { getToolboxForLevel, toolbox } from '../toolbox';

// ---------- helpers ----------

type ToolboxBlock = { kind: 'block'; type: string };
type ToolboxCategory = { kind: 'category'; name: string; colour: string; contents: ToolboxBlock[] };
type Toolbox = { kind: string; contents: ToolboxCategory[] };

/** Extract all block type strings from a toolbox definition */
function collectBlockTypes(tb: Toolbox): string[] {
  return tb.contents.flatMap((cat) => cat.contents.map((b) => b.type));
}

/** Extract category names from a toolbox definition */
function collectCategoryNames(tb: Toolbox): string[] {
  return tb.contents.map((cat) => cat.name);
}

// ---------- Exhaustive list of all block types registered across block definition files ----------

// sources.ts
const SOURCE_BLOCKS = [
  'biyo_sine',
  'biyo_saw',
  'biyo_triangle',
  'biyo_square',
  'biyo_noise',
  'biyo_filtered_noise',
  'biyo_detune_saw',
  'biyo_kick',
  'biyo_hihat',
  'biyo_pluck',
  'biyo_microphone',
];

// notes.ts
const NOTE_BLOCKS = ['biyo_piano_note', 'biyo_note', 'biyo_chord', 'biyo_scale', 'biyo_arpeggio'];

// rhythm.ts
const RHYTHM_BLOCKS = [
  'biyo_bpm',
  'biyo_metro',
  'biyo_sequencer',
  'biyo_melody',
  'biyo_drum_pattern',
  'biyo_envelope',
];

// effects.ts
const EFFECT_BLOCKS = [
  'biyo_lowpass',
  'biyo_highpass',
  'biyo_bandpass',
  'biyo_delay',
  'biyo_pingpong',
  'biyo_reverb',
  'biyo_tremolo',
  'biyo_autowah',
  'biyo_vibrato',
  'biyo_distortion',
  'biyo_gain_up',
  'biyo_gain_down',
  'biyo_telephone',
];

// presets.ts
const PRESET_BLOCKS = [
  'biyo_robot_voice',
  'biyo_space',
  'biyo_water_drop',
  'biyo_ghost',
  'biyo_siren',
  'biyo_laser',
  'biyo_ufo',
  'biyo_bubbles',
  'biyo_thunder',
  'biyo_famicom',
  'biyo_clap',
  'biyo_snare',
];

// generative.ts
const GENERATIVE_BLOCKS = [
  'biyo_random_melody',
  'biyo_euclidean',
  'biyo_lfo_random',
  'biyo_probability',
];

// utility.ts (utility blocks — mix, multiply, number, invert, passthrough)
const UTILITY_BLOCKS = [
  'biyo_mix',
  'biyo_multiply',
  'biyo_number',
  'biyo_invert',
  'biyo_passthrough',
];

/** Every block type that is defined in the block definition files */
const ALL_DEFINED_BLOCK_TYPES = new Set([
  ...SOURCE_BLOCKS,
  ...NOTE_BLOCKS,
  ...RHYTHM_BLOCKS,
  ...EFFECT_BLOCKS,
  ...PRESET_BLOCKS,
  ...GENERATIVE_BLOCKS,
  ...UTILITY_BLOCKS,
]);

// ==========================================================================
// Tests
// ==========================================================================

describe('toolbox', () => {
  describe('exported toolbox constant (advanced / full)', () => {
    it('has kind "categoryToolbox"', () => {
      expect(toolbox.kind).toBe('categoryToolbox');
    });

    it('has 7 categories', () => {
      expect(toolbox.contents).toHaveLength(7);
    });

    it('contains 56 blocks total', () => {
      const blocks = collectBlockTypes(toolbox as Toolbox);
      expect(blocks).toHaveLength(56);
    });
  });

  // ---------- getToolboxForLevel ----------

  describe('getToolboxForLevel', () => {
    // ---- beginner ----

    describe('beginner', () => {
      const tb = getToolboxForLevel('beginner') as Toolbox;

      it('returns an object with kind "categoryToolbox"', () => {
        expect(tb.kind).toBe('categoryToolbox');
      });

      it('has 3 categories', () => {
        expect(tb.contents).toHaveLength(3);
      });

      it('returns correct category names', () => {
        const names = collectCategoryNames(tb);
        expect(names).toEqual([
          '\uD83C\uDFB5 \u304A\u3068', // おと
          '\u2728 \u3078\u3093\u3057\u3093', // へんしん
          '\uD83C\uDFAA \u304A\u305F\u306E\u3057\u307F', // おたのしみ
        ]);
      });

      it('contains exactly 12 blocks total', () => {
        const blocks = collectBlockTypes(tb);
        expect(blocks).toHaveLength(12);
      });

      it('contains the expected block types', () => {
        const blocks = collectBlockTypes(tb);
        expect(blocks).toEqual([
          'biyo_sine',
          'biyo_square',
          'biyo_noise',
          'biyo_piano_note',
          'biyo_reverb',
          'biyo_delay',
          'biyo_distortion',
          'biyo_ghost',
          'biyo_siren',
          'biyo_laser',
          'biyo_water_drop',
          'biyo_thunder',
        ]);
      });

      it('all block types exist in block definitions', () => {
        const blocks = collectBlockTypes(tb);
        for (const blockType of blocks) {
          expect(ALL_DEFINED_BLOCK_TYPES.has(blockType)).toBe(true);
        }
      });
    });

    // ---- intermediate ----

    describe('intermediate', () => {
      const tb = getToolboxForLevel('intermediate') as Toolbox;

      it('returns an object with kind "categoryToolbox"', () => {
        expect(tb.kind).toBe('categoryToolbox');
      });

      it('has 5 categories', () => {
        expect(tb.contents).toHaveLength(5);
      });

      it('returns correct category names', () => {
        const names = collectCategoryNames(tb);
        expect(names).toEqual([
          '\uD83C\uDFB5 \u304A\u3068\u306E\u3082\u3068', // おとのもと
          '\uD83C\uDFB9 \u304A\u3093\u304C\u304F', // おんがく
          '\uD83E\uDD41 \u30EA\u30BA\u30E0', // リズム
          '\u2728 \u3078\u3093\u3057\u3093', // へんしん
          '\uD83C\uDFAA \u304A\u305F\u306E\u3057\u307F', // おたのしみ
        ]);
      });

      it('contains 44 blocks total', () => {
        const blocks = collectBlockTypes(tb);
        expect(blocks).toHaveLength(44);
      });

      it('includes all source blocks (11)', () => {
        const blocks = new Set(collectBlockTypes(tb));
        for (const b of SOURCE_BLOCKS) {
          expect(blocks.has(b)).toBe(true);
        }
      });

      it('includes all effect blocks (13)', () => {
        const blocks = new Set(collectBlockTypes(tb));
        for (const b of EFFECT_BLOCKS) {
          expect(blocks.has(b)).toBe(true);
        }
      });

      it('includes all preset blocks (12)', () => {
        const blocks = new Set(collectBlockTypes(tb));
        for (const b of PRESET_BLOCKS) {
          expect(blocks.has(b)).toBe(true);
        }
      });

      it('does NOT include generative blocks (reserved for advanced)', () => {
        const blocks = new Set(collectBlockTypes(tb));
        for (const b of GENERATIVE_BLOCKS) {
          expect(blocks.has(b)).toBe(false);
        }
      });

      it('does NOT include utility blocks (reserved for advanced)', () => {
        const blocks = new Set(collectBlockTypes(tb));
        for (const b of UTILITY_BLOCKS) {
          expect(blocks.has(b)).toBe(false);
        }
      });

      it('includes basic note blocks but not scale/arpeggio', () => {
        const blocks = new Set(collectBlockTypes(tb));
        expect(blocks.has('biyo_piano_note')).toBe(true);
        expect(blocks.has('biyo_note')).toBe(true);
        expect(blocks.has('biyo_chord')).toBe(true);
        expect(blocks.has('biyo_scale')).toBe(false);
        expect(blocks.has('biyo_arpeggio')).toBe(false);
      });

      it('includes basic rhythm blocks but not melody', () => {
        const blocks = new Set(collectBlockTypes(tb));
        expect(blocks.has('biyo_bpm')).toBe(true);
        expect(blocks.has('biyo_metro')).toBe(true);
        expect(blocks.has('biyo_sequencer')).toBe(true);
        expect(blocks.has('biyo_drum_pattern')).toBe(true);
        expect(blocks.has('biyo_envelope')).toBe(true);
        expect(blocks.has('biyo_melody')).toBe(false);
      });

      it('all block types exist in block definitions', () => {
        const blocks = collectBlockTypes(tb);
        for (const blockType of blocks) {
          expect(ALL_DEFINED_BLOCK_TYPES.has(blockType)).toBe(true);
        }
      });
    });

    // ---- advanced ----

    describe('advanced', () => {
      const tb = getToolboxForLevel('advanced') as Toolbox;

      it('returns an object with kind "categoryToolbox"', () => {
        expect(tb.kind).toBe('categoryToolbox');
      });

      it('returns the same object as the exported toolbox constant', () => {
        expect(tb).toBe(toolbox);
      });

      it('has 7 categories', () => {
        expect(tb.contents).toHaveLength(7);
      });

      it('returns correct category names', () => {
        const names = collectCategoryNames(tb);
        expect(names).toEqual([
          '\uD83C\uDFB5 \u304A\u3068\u306E\u3082\u3068', // おとのもと
          '\uD83C\uDFB9 \u304A\u3093\u304C\u304F', // おんがく
          '\uD83E\uDD41 \u30EA\u30BA\u30E0', // リズム
          '\u2728 \u3078\u3093\u3057\u3093', // へんしん
          '\uD83C\uDFAA \u304A\u305F\u306E\u3057\u307F', // おたのしみ
          '\uD83C\uDFB2 \u305D\u3046\u305E\u3046', // そうぞう
          '\uD83D\uDD27 \u3079\u3093\u308A', // べんり
        ]);
      });

      it('contains 56 blocks total', () => {
        const blocks = collectBlockTypes(tb);
        expect(blocks).toHaveLength(56);
      });

      it('includes all source blocks', () => {
        const blocks = new Set(collectBlockTypes(tb));
        for (const b of SOURCE_BLOCKS) {
          expect(blocks.has(b)).toBe(true);
        }
      });

      it('includes all note blocks (including scale and arpeggio)', () => {
        const blocks = new Set(collectBlockTypes(tb));
        for (const b of NOTE_BLOCKS) {
          expect(blocks.has(b)).toBe(true);
        }
      });

      it('includes all rhythm blocks (including melody)', () => {
        const blocks = new Set(collectBlockTypes(tb));
        for (const b of RHYTHM_BLOCKS) {
          expect(blocks.has(b)).toBe(true);
        }
      });

      it('includes all effect blocks', () => {
        const blocks = new Set(collectBlockTypes(tb));
        for (const b of EFFECT_BLOCKS) {
          expect(blocks.has(b)).toBe(true);
        }
      });

      it('includes all preset blocks', () => {
        const blocks = new Set(collectBlockTypes(tb));
        for (const b of PRESET_BLOCKS) {
          expect(blocks.has(b)).toBe(true);
        }
      });

      it('includes all generative blocks', () => {
        const blocks = new Set(collectBlockTypes(tb));
        for (const b of GENERATIVE_BLOCKS) {
          expect(blocks.has(b)).toBe(true);
        }
      });

      it('includes all utility blocks', () => {
        const blocks = new Set(collectBlockTypes(tb));
        for (const b of UTILITY_BLOCKS) {
          expect(blocks.has(b)).toBe(true);
        }
      });

      it('all block types exist in block definitions', () => {
        const blocks = collectBlockTypes(tb);
        for (const blockType of blocks) {
          expect(ALL_DEFINED_BLOCK_TYPES.has(blockType)).toBe(true);
        }
      });
    });

    // ---- cross-level checks ----

    describe('cross-level comparisons', () => {
      it('all levels return kind "categoryToolbox"', () => {
        for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
          const tb = getToolboxForLevel(level);
          expect(tb.kind).toBe('categoryToolbox');
        }
      });

      it('beginner block count < intermediate block count < advanced block count', () => {
        const beginnerCount = collectBlockTypes(getToolboxForLevel('beginner') as Toolbox).length;
        const intermediateCount = collectBlockTypes(
          getToolboxForLevel('intermediate') as Toolbox,
        ).length;
        const advancedCount = collectBlockTypes(getToolboxForLevel('advanced') as Toolbox).length;

        expect(beginnerCount).toBeLessThan(intermediateCount);
        expect(intermediateCount).toBeLessThan(advancedCount);
      });

      it('beginner blocks are a subset of intermediate blocks', () => {
        const beginnerBlocks = collectBlockTypes(getToolboxForLevel('beginner') as Toolbox);
        const intermediateBlocks = new Set(
          collectBlockTypes(getToolboxForLevel('intermediate') as Toolbox),
        );
        for (const b of beginnerBlocks) {
          expect(intermediateBlocks.has(b)).toBe(true);
        }
      });

      it('intermediate blocks are a subset of advanced blocks', () => {
        const intermediateBlocks = collectBlockTypes(getToolboxForLevel('intermediate') as Toolbox);
        const advancedBlocks = new Set(
          collectBlockTypes(getToolboxForLevel('advanced') as Toolbox),
        );
        for (const b of intermediateBlocks) {
          expect(advancedBlocks.has(b)).toBe(true);
        }
      });

      it('advanced toolbox covers every defined block type', () => {
        const advancedBlocks = new Set(
          collectBlockTypes(getToolboxForLevel('advanced') as Toolbox),
        );
        for (const blockType of ALL_DEFINED_BLOCK_TYPES) {
          expect(advancedBlocks.has(blockType)).toBe(true);
        }
      });
    });

    // ---- category structure checks ----

    describe('category structure', () => {
      it('every category in every level has a colour string', () => {
        for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
          const tb = getToolboxForLevel(level) as Toolbox;
          for (const cat of tb.contents) {
            expect(typeof cat.colour).toBe('string');
            expect(cat.colour).toMatch(/^#[0-9A-Fa-f]{6}$/);
          }
        }
      });

      it('every block entry has kind "block" and a non-empty type', () => {
        for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
          const tb = getToolboxForLevel(level) as Toolbox;
          for (const cat of tb.contents) {
            for (const block of cat.contents) {
              expect(block.kind).toBe('block');
              expect(typeof block.type).toBe('string');
              expect(block.type.length).toBeGreaterThan(0);
            }
          }
        }
      });
    });
  });
});
