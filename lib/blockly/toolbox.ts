import type { ExperienceLevel } from '@/lib/stores/experience';

// ---- Full toolbox definition (used as default and for "advanced") ----

export const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '\uD83C\uDFB5 \u304A\u3068\u306E\u3082\u3068',
      colour: '#FF6680',
      contents: [
        { kind: 'block', type: 'biyo_sine' },
        { kind: 'block', type: 'biyo_saw' },
        { kind: 'block', type: 'biyo_triangle' },
        { kind: 'block', type: 'biyo_square' },
        { kind: 'block', type: 'biyo_noise' },
        { kind: 'block', type: 'biyo_filtered_noise' },
        { kind: 'block', type: 'biyo_detune_saw' },
        { kind: 'block', type: 'biyo_kick' },
        { kind: 'block', type: 'biyo_hihat' },
        { kind: 'block', type: 'biyo_pluck' },
        { kind: 'block', type: 'biyo_microphone' },
      ],
    },
    {
      kind: 'category',
      name: '\uD83C\uDFB9 \u304A\u3093\u304C\u304F',
      colour: '#5BA58C',
      contents: [
        { kind: 'block', type: 'biyo_piano_note' },
        { kind: 'block', type: 'biyo_note' },
        { kind: 'block', type: 'biyo_chord' },
        { kind: 'block', type: 'biyo_scale' },
        { kind: 'block', type: 'biyo_arpeggio' },
      ],
    },
    {
      kind: 'category',
      name: '\uD83E\uDD41 \u30EA\u30BA\u30E0',
      colour: '#59C059',
      contents: [
        { kind: 'block', type: 'biyo_bpm' },
        { kind: 'block', type: 'biyo_metro' },
        { kind: 'block', type: 'biyo_sequencer' },
        { kind: 'block', type: 'biyo_melody' },
        { kind: 'block', type: 'biyo_drum_pattern' },
        { kind: 'block', type: 'biyo_envelope' },
      ],
    },
    {
      kind: 'category',
      name: '\u2728 \u3078\u3093\u3057\u3093',
      colour: '#4C97FF',
      contents: [
        { kind: 'block', type: 'biyo_lowpass' },
        { kind: 'block', type: 'biyo_highpass' },
        { kind: 'block', type: 'biyo_bandpass' },
        { kind: 'block', type: 'biyo_delay' },
        { kind: 'block', type: 'biyo_pingpong' },
        { kind: 'block', type: 'biyo_reverb' },
        { kind: 'block', type: 'biyo_tremolo' },
        { kind: 'block', type: 'biyo_autowah' },
        { kind: 'block', type: 'biyo_vibrato' },
        { kind: 'block', type: 'biyo_distortion' },
        { kind: 'block', type: 'biyo_gain_up' },
        { kind: 'block', type: 'biyo_gain_down' },
        { kind: 'block', type: 'biyo_telephone' },
      ],
    },
    {
      kind: 'category',
      name: '\uD83C\uDFAA \u304A\u305F\u306E\u3057\u307F',
      colour: '#CF63CF',
      contents: [
        { kind: 'block', type: 'biyo_robot_voice' },
        { kind: 'block', type: 'biyo_space' },
        { kind: 'block', type: 'biyo_water_drop' },
        { kind: 'block', type: 'biyo_ghost' },
        { kind: 'block', type: 'biyo_siren' },
        { kind: 'block', type: 'biyo_laser' },
        { kind: 'block', type: 'biyo_ufo' },
        { kind: 'block', type: 'biyo_bubbles' },
        { kind: 'block', type: 'biyo_thunder' },
        { kind: 'block', type: 'biyo_famicom' },
        { kind: 'block', type: 'biyo_clap' },
        { kind: 'block', type: 'biyo_snare' },
      ],
    },
    {
      kind: 'category',
      name: '\uD83C\uDFB2 \u305D\u3046\u305E\u3046',
      colour: '#7B68EE',
      contents: [
        { kind: 'block', type: 'biyo_random_melody' },
        { kind: 'block', type: 'biyo_euclidean' },
        { kind: 'block', type: 'biyo_lfo_random' },
        { kind: 'block', type: 'biyo_probability' },
      ],
    },
    {
      kind: 'category',
      name: '\uD83D\uDD27 \u3079\u3093\u308A',
      colour: '#FFAB19',
      contents: [
        { kind: 'block', type: 'biyo_mix' },
        { kind: 'block', type: 'biyo_multiply' },
        { kind: 'block', type: 'biyo_number' },
        { kind: 'block', type: 'biyo_invert' },
        { kind: 'block', type: 'biyo_passthrough' },
      ],
    },
  ],
};

// ---- Beginner toolbox: only 6 essential blocks, simplified categories ----

const beginnerToolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '\uD83C\uDFB5 \u304A\u3068',
      colour: '#FF6680',
      contents: [
        { kind: 'block', type: 'biyo_sine' },
        { kind: 'block', type: 'biyo_square' },
        { kind: 'block', type: 'biyo_noise' },
      ],
    },
    {
      kind: 'category',
      name: '\u2728 \u3078\u3093\u3057\u3093',
      colour: '#4C97FF',
      contents: [
        { kind: 'block', type: 'biyo_reverb' },
        { kind: 'block', type: 'biyo_delay' },
        { kind: 'block', type: 'biyo_distortion' },
      ],
    },
  ],
};

// ---- Intermediate toolbox: all sources, all effects, basic rhythm ----

const intermediateToolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '\uD83C\uDFB5 \u304A\u3068\u306E\u3082\u3068',
      colour: '#FF6680',
      contents: [
        { kind: 'block', type: 'biyo_sine' },
        { kind: 'block', type: 'biyo_saw' },
        { kind: 'block', type: 'biyo_triangle' },
        { kind: 'block', type: 'biyo_square' },
        { kind: 'block', type: 'biyo_noise' },
        { kind: 'block', type: 'biyo_filtered_noise' },
        { kind: 'block', type: 'biyo_detune_saw' },
        { kind: 'block', type: 'biyo_kick' },
        { kind: 'block', type: 'biyo_hihat' },
        { kind: 'block', type: 'biyo_pluck' },
        { kind: 'block', type: 'biyo_microphone' },
      ],
    },
    {
      kind: 'category',
      name: '\uD83C\uDFB9 \u304A\u3093\u304C\u304F',
      colour: '#5BA58C',
      contents: [
        { kind: 'block', type: 'biyo_piano_note' },
        { kind: 'block', type: 'biyo_note' },
        { kind: 'block', type: 'biyo_chord' },
      ],
    },
    {
      kind: 'category',
      name: '\uD83E\uDD41 \u30EA\u30BA\u30E0',
      colour: '#59C059',
      contents: [
        { kind: 'block', type: 'biyo_bpm' },
        { kind: 'block', type: 'biyo_metro' },
        { kind: 'block', type: 'biyo_sequencer' },
        { kind: 'block', type: 'biyo_drum_pattern' },
        { kind: 'block', type: 'biyo_envelope' },
      ],
    },
    {
      kind: 'category',
      name: '\u2728 \u3078\u3093\u3057\u3093',
      colour: '#4C97FF',
      contents: [
        { kind: 'block', type: 'biyo_lowpass' },
        { kind: 'block', type: 'biyo_highpass' },
        { kind: 'block', type: 'biyo_bandpass' },
        { kind: 'block', type: 'biyo_delay' },
        { kind: 'block', type: 'biyo_pingpong' },
        { kind: 'block', type: 'biyo_reverb' },
        { kind: 'block', type: 'biyo_tremolo' },
        { kind: 'block', type: 'biyo_autowah' },
        { kind: 'block', type: 'biyo_vibrato' },
        { kind: 'block', type: 'biyo_distortion' },
        { kind: 'block', type: 'biyo_gain_up' },
        { kind: 'block', type: 'biyo_gain_down' },
        { kind: 'block', type: 'biyo_telephone' },
      ],
    },
    {
      kind: 'category',
      name: '\uD83C\uDFAA \u304A\u305F\u306E\u3057\u307F',
      colour: '#CF63CF',
      contents: [
        { kind: 'block', type: 'biyo_robot_voice' },
        { kind: 'block', type: 'biyo_space' },
        { kind: 'block', type: 'biyo_water_drop' },
        { kind: 'block', type: 'biyo_ghost' },
        { kind: 'block', type: 'biyo_siren' },
        { kind: 'block', type: 'biyo_laser' },
        { kind: 'block', type: 'biyo_ufo' },
        { kind: 'block', type: 'biyo_bubbles' },
        { kind: 'block', type: 'biyo_thunder' },
        { kind: 'block', type: 'biyo_famicom' },
        { kind: 'block', type: 'biyo_clap' },
        { kind: 'block', type: 'biyo_snare' },
      ],
    },
    {
      kind: 'category',
      name: '\uD83C\uDFB2 \u305D\u3046\u305E\u3046',
      colour: '#7B68EE',
      contents: [
        { kind: 'block', type: 'biyo_random_melody' },
        { kind: 'block', type: 'biyo_euclidean' },
        { kind: 'block', type: 'biyo_lfo_random' },
        { kind: 'block', type: 'biyo_probability' },
      ],
    },
    {
      kind: 'category',
      name: '\uD83D\uDD27 \u3079\u3093\u308A',
      colour: '#FFAB19',
      contents: [
        { kind: 'block', type: 'biyo_mix' },
        { kind: 'block', type: 'biyo_multiply' },
        { kind: 'block', type: 'biyo_number' },
        { kind: 'block', type: 'biyo_invert' },
        { kind: 'block', type: 'biyo_passthrough' },
      ],
    },
  ],
};

/**
 * Returns the appropriate Blockly toolbox definition based on experience level.
 *
 * - beginner: 6 blocks only (sine, square, noise + reverb, delay, distortion)
 * - intermediate: All sources, all effects, basic rhythm, basic notes, presets, utility
 * - advanced: Everything including scale, arpeggio, melody
 */
export function getToolboxForLevel(level: ExperienceLevel) {
  switch (level) {
    case 'beginner':
      return beginnerToolbox;
    case 'intermediate':
      return intermediateToolbox;
    case 'advanced':
      return toolbox;
  }
}
