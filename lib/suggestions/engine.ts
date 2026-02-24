/**
 * Smart Suggestion Engine
 *
 * Analyzes the current workspace blocks and applies music theory rules
 * to suggest what the user should add next. This is context-aware
 * compositional guidance for a children's block-based synthesizer.
 */

export interface Suggestion {
  id: string;
  label: string;
  emoji: string;
  blockType: string;
  reason: string;
  /** Blockly XML snippet to inject when this suggestion is clicked */
  xml: string;
}

// ── Block type classification ──────────────────────────────────────

const SOURCE_TYPES = new Set([
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
]);

const EFFECT_TYPES = new Set([
  'biyo_lowpass',
  'biyo_highpass',
  'biyo_bandpass',
  'biyo_delay',
  'biyo_reverb',
  'biyo_tremolo',
  'biyo_autowah',
  'biyo_vibrato',
  'biyo_distortion',
  'biyo_gain_up',
  'biyo_gain_down',
  'biyo_telephone',
  'biyo_pingpong',
]);

const SPATIAL_EFFECTS = new Set(['biyo_reverb', 'biyo_delay', 'biyo_pingpong']);

const RHYTHM_TYPES = new Set([
  'biyo_metro',
  'biyo_sequencer',
  'biyo_melody',
  'biyo_drum_pattern',
  'biyo_bpm',
  'biyo_envelope',
]);

const NOTE_TYPES = new Set(['biyo_piano_note', 'biyo_note']);

const CHORD_TYPES = new Set(['biyo_chord', 'biyo_scale', 'biyo_arpeggio', 'biyo_famicom']);

const GENERATIVE_TYPES = new Set([
  'biyo_random_melody',
  'biyo_euclidean',
  'biyo_lfo_random',
  'biyo_probability',
]);

const PRESET_TYPES = new Set([
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
]);

// ── Analysis helpers ───────────────────────────────────────────────

interface WorkspaceAnalysis {
  blockTypes: Set<string>;
  hasSource: boolean;
  hasEffect: boolean;
  hasSpatialEffect: boolean;
  hasRhythm: boolean;
  hasSingleNote: boolean;
  hasChord: boolean;
  hasPreset: boolean;
  hasGenerative: boolean;
  totalBlocks: number;
  isEmpty: boolean;
}

function analyzeBlockTypes(blockTypes: string[]): WorkspaceAnalysis {
  const typeSet = new Set(blockTypes);

  const hasSource = blockTypes.some((t) => SOURCE_TYPES.has(t) || PRESET_TYPES.has(t));
  const hasEffect = blockTypes.some((t) => EFFECT_TYPES.has(t));
  const hasSpatialEffect = blockTypes.some((t) => SPATIAL_EFFECTS.has(t));
  const hasGenerative = blockTypes.some((t) => GENERATIVE_TYPES.has(t));
  // Generative blocks (random_melody, euclidean, etc.) function like rhythm patterns
  const hasRhythm = blockTypes.some((t) => RHYTHM_TYPES.has(t)) || hasGenerative;
  const hasSingleNote = blockTypes.some((t) => NOTE_TYPES.has(t));
  const hasChord = blockTypes.some((t) => CHORD_TYPES.has(t));
  const hasPreset = blockTypes.some((t) => PRESET_TYPES.has(t));

  return {
    blockTypes: typeSet,
    hasSource,
    hasEffect,
    hasSpatialEffect,
    hasRhythm,
    hasSingleNote,
    hasChord,
    hasPreset,
    hasGenerative,
    totalBlocks: blockTypes.length,
    isEmpty: blockTypes.length === 0,
  };
}

// ── Rule definitions ───────────────────────────────────────────────

interface Rule {
  id: string;
  /** Higher priority = shown first (lower number) */
  priority: number;
  test: (a: WorkspaceAnalysis) => boolean;
  suggestion: Suggestion;
}

const RULES: Rule[] = [
  // Rule: Empty workspace -> suggest adding a sound source
  {
    id: 'empty_add_source',
    priority: 0,
    test: (a) => a.isEmpty,
    suggestion: {
      id: 'empty_add_source',
      label: 'おとをだしてみよう!',
      emoji: '\uD83C\uDFB5',
      blockType: 'biyo_sine',
      reason: 'まずはおとのもとをおいてみよう',
      xml: `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="biyo_sine" x="180" y="120">
          <field name="NOTE">C</field>
          <field name="OCTAVE">4</field>
        </block>
      </xml>`,
    },
  },

  // Rule: Has source but no effect -> suggest reverb
  {
    id: 'source_no_effect',
    priority: 1,
    test: (a) => a.hasSource && !a.hasEffect,
    suggestion: {
      id: 'source_no_effect',
      label: 'おとをへんしんさせてみよう!',
      emoji: '\u2728',
      blockType: 'biyo_reverb',
      reason: 'エフェクトでおとをかわいくしよう',
      xml: `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="biyo_reverb" x="180" y="200">
          <field name="SIZE">0.6</field>
          <field name="DAMPING">0.5</field>
          <field name="MIX">0.3</field>
        </block>
      </xml>`,
    },
  },

  // Rule: Has source but no rhythm -> suggest sequencer
  {
    id: 'source_no_rhythm',
    priority: 2,
    test: (a) => a.hasSource && !a.hasRhythm,
    suggestion: {
      id: 'source_no_rhythm',
      label: 'リズムをつけてみよう!',
      emoji: '\uD83E\uDD41',
      blockType: 'biyo_sequencer',
      reason: 'リズムでもっとたのしくなるよ',
      xml: `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="biyo_sequencer" x="180" y="200">
          <field name="BPM">120</field>
          <field name="NOTE1">60</field>
          <field name="NOTE2">64</field>
          <field name="NOTE3">67</field>
          <field name="NOTE4">72</field>
        </block>
      </xml>`,
    },
  },

  // Rule: Has single note but no chord -> suggest chord
  {
    id: 'note_no_chord',
    priority: 3,
    test: (a) => a.hasSingleNote && !a.hasChord,
    suggestion: {
      id: 'note_no_chord',
      label: 'わおんにしてみよう!',
      emoji: '\uD83C\uDFB9',
      blockType: 'biyo_chord',
      reason: 'おとをかさねてハーモニー',
      xml: `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="biyo_chord" x="180" y="200">
          <field name="ROOT">C</field>
          <field name="TYPE">major</field>
        </block>
      </xml>`,
    },
  },

  // Rule: Has rhythm but no effect -> suggest delay
  {
    id: 'rhythm_no_effect',
    priority: 4,
    test: (a) => a.hasRhythm && !a.hasEffect,
    suggestion: {
      id: 'rhythm_no_effect',
      label: 'エフェクトをかけてみよう!',
      emoji: '\uD83C\uDF00',
      blockType: 'biyo_delay',
      reason: 'やまびこでリズムがもっとたのしく',
      xml: `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="biyo_delay" x="180" y="200">
          <field name="TIME">0.3</field>
          <field name="FEEDBACK">0.4</field>
          <field name="MIX">0.5</field>
        </block>
      </xml>`,
    },
  },

  // Rule: Has effect but no spatial -> suggest reverb
  {
    id: 'effect_no_spatial',
    priority: 5,
    test: (a) => a.hasEffect && !a.hasSpatialEffect && a.hasSource,
    suggestion: {
      id: 'effect_no_spatial',
      label: 'ひろがるおとにしてみよう!',
      emoji: '\uD83C\uDF0A',
      blockType: 'biyo_reverb',
      reason: 'おふろでうたうみたいにひびくよ',
      xml: `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="biyo_reverb" x="180" y="280">
          <field name="SIZE">0.85</field>
          <field name="DAMPING">0.5</field>
          <field name="MIX">0.4</field>
        </block>
      </xml>`,
    },
  },

  // Rule: Has source + effect but no melody pattern -> suggest melody
  {
    id: 'add_melody',
    priority: 6,
    test: (a) => a.hasSource && a.hasEffect && !a.hasRhythm,
    suggestion: {
      id: 'add_melody',
      label: 'メロディーをつくろう!',
      emoji: '\uD83C\uDFBC',
      blockType: 'biyo_melody',
      reason: 'じぶんだけのメロディーがつくれるよ',
      xml: `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="biyo_melody" x="180" y="280">
          <field name="OCTAVE">4</field>
          <field name="BPM">120</field>
          <field name="NOTE1">C</field>
          <field name="NOTE2">E</field>
          <field name="NOTE3">G</field>
          <field name="NOTE4">C</field>
          <field name="NOTE5">REST</field>
          <field name="NOTE6">G</field>
          <field name="NOTE7">E</field>
          <field name="NOTE8">C</field>
        </block>
      </xml>`,
    },
  },

  // Rule: Has everything -> suggest adding a drum pattern
  {
    id: 'add_drums',
    priority: 7,
    test: (a) =>
      a.hasSource && a.hasEffect && a.hasRhythm && !a.blockTypes.has('biyo_drum_pattern'),
    suggestion: {
      id: 'add_drums',
      label: 'ドラムをたしてみよう!',
      emoji: '\uD83E\uDD41',
      blockType: 'biyo_drum_pattern',
      reason: 'ドラムでリズムかんアップ',
      xml: `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="biyo_drum_pattern" x="180" y="350">
          <field name="BPM">120</field>
          <field name="PATTERN">rock</field>
        </block>
      </xml>`,
    },
  },

  // Rule: Has no presets at all -> suggest a fun preset
  {
    id: 'try_preset',
    priority: 8,
    test: (a) => a.totalBlocks >= 2 && !a.hasPreset,
    suggestion: {
      id: 'try_preset',
      label: 'おもしろいおとをためそう!',
      emoji: '\uD83C\uDFAA',
      blockType: 'biyo_robot_voice',
      reason: 'ロボットやうちゅうのおとがあるよ',
      xml: `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="biyo_robot_voice" x="180" y="280">
          <field name="VOWEL">a</field>
        </block>
      </xml>`,
    },
  },

  // Rule: Complete signal chain -> suggest new track
  {
    id: 'complete_add_track',
    priority: 9,
    test: (a) => a.hasSource && a.hasEffect && (a.hasRhythm || a.hasChord) && a.totalBlocks >= 4,
    suggestion: {
      id: 'complete_add_track',
      label: 'もうひとつおへやをつくろう!',
      emoji: '\uD83C\uDF1F',
      blockType: '__new_track__',
      reason: 'いまのおとはかんぺき!つぎのおへやへ',
      xml: '',
    },
  },
];

// ── Main analysis function ─────────────────────────────────────────

const MAX_SUGGESTIONS = 2;

/**
 * Analyze current workspace blocks and return up to 2 context-aware suggestions.
 *
 * @param blockTypes - Array of block type strings currently in the workspace
 * @returns Up to MAX_SUGGESTIONS suggestions sorted by priority
 */
export function analyzeWorkspace(blockTypes: string[]): Suggestion[] {
  const analysis = analyzeBlockTypes(blockTypes);
  const matched: Suggestion[] = [];

  // Rules are already sorted by priority (ascending = higher importance first)
  for (const rule of RULES) {
    if (matched.length >= MAX_SUGGESTIONS) break;
    if (rule.test(analysis)) {
      // Avoid duplicates by ID
      if (!matched.some((s) => s.id === rule.suggestion.id)) {
        matched.push(rule.suggestion);
      }
    }
  }

  return matched;
}

/**
 * Extract block type strings from workspace XML using regex.
 * This avoids needing a Blockly import in the engine.
 */
export function extractBlockTypesFromXml(xml: string): string[] {
  const types: string[] = [];
  const regex = /type="(biyo_\w+)"/g;
  let match: RegExpExecArray | null = regex.exec(xml);
  while (match !== null) {
    types.push(match[1]);
    match = regex.exec(xml);
  }
  return types;
}
