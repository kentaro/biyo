import type { ExperienceLevel } from '@/lib/stores/experience';

// ---- Full toolbox definition (used as default and for "advanced") ----

export const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '\uD83C\uDFB5 \u304A\u3068\u306E\u3082\u3068',
      colour: '#C44D62',
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
      colour: '#468070',
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
      colour: '#3C843C',
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
      colour: '#3976C6',
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
      colour: '#B050B0',
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
      colour: '#7060E0',
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
      colour: '#9F6A08',
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

// ---- Beginner toolbox: ~12 blocks across 3 categories ----
// Enough to make interesting sounds immediately: basic sources, a few effects,
// and fun presets that reward experimentation.

const beginnerToolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '\uD83C\uDFB5 \u304A\u3068',
      colour: '#C44D62',
      contents: [
        { kind: 'block', type: 'biyo_sine' },
        { kind: 'block', type: 'biyo_square' },
        { kind: 'block', type: 'biyo_noise' },
        { kind: 'block', type: 'biyo_piano_note' },
      ],
    },
    {
      kind: 'category',
      name: '\u2728 \u3078\u3093\u3057\u3093',
      colour: '#3976C6',
      contents: [
        { kind: 'block', type: 'biyo_reverb' },
        { kind: 'block', type: 'biyo_delay' },
        { kind: 'block', type: 'biyo_distortion' },
      ],
    },
    {
      kind: 'category',
      name: '\uD83C\uDFAA \u304A\u305F\u306E\u3057\u307F',
      colour: '#B050B0',
      contents: [
        { kind: 'block', type: 'biyo_ghost' },
        { kind: 'block', type: 'biyo_siren' },
        { kind: 'block', type: 'biyo_laser' },
        { kind: 'block', type: 'biyo_water_drop' },
        { kind: 'block', type: 'biyo_thunder' },
      ],
    },
  ],
};

// ---- Intermediate toolbox: more sources, all effects, rhythm, presets, basic notes ----
// Unlocks the full sound palette: all wave types, percussion, all effects,
// rhythm/sequencing, all fun presets, and basic note/chord blocks.
// Does NOT include: generative blocks, advanced notes (scale, arpeggio),
// melody sequencer, or utility blocks -- those are reserved for advanced.

const intermediateToolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '\uD83C\uDFB5 \u304A\u3068\u306E\u3082\u3068',
      colour: '#C44D62',
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
      colour: '#468070',
      contents: [
        { kind: 'block', type: 'biyo_piano_note' },
        { kind: 'block', type: 'biyo_note' },
        { kind: 'block', type: 'biyo_chord' },
      ],
    },
    {
      kind: 'category',
      name: '\uD83E\uDD41 \u30EA\u30BA\u30E0',
      colour: '#3C843C',
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
      colour: '#3976C6',
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
      colour: '#B050B0',
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
  ],
};

/**
 * Returns the appropriate Blockly toolbox definition based on experience level.
 *
 * - beginner:     12 blocks in 3 categories (basic sources + piano, 3 effects, 5 fun presets)
 * - intermediate: 44 blocks in 5 categories (all sources, all effects, rhythm, notes, all presets)
 * - advanced:     56 blocks in 7 categories (everything: generative, scale, arpeggio, melody, utility)
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
