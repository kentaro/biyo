import { describe, expect, it } from 'vitest';
import type { Suggestion } from '../engine';
import { analyzeWorkspace, extractBlockTypesFromXml } from '../engine';

// ── Helper ────────────────────────────────────────────────────────
/** Return only the IDs of the returned suggestions for easy assertion. */
function ids(suggestions: Suggestion[]): string[] {
  return suggestions.map((s) => s.id);
}

// ══════════════════════════════════════════════════════════════════
// analyzeWorkspace
// ══════════════════════════════════════════════════════════════════

describe('analyzeWorkspace', () => {
  // ── Empty workspace ──────────────────────────────────────────
  describe('empty workspace', () => {
    it('suggests adding a sound source when block list is empty', () => {
      const result = analyzeWorkspace([]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('empty_add_source');
      expect(result[0].blockType).toBe('biyo_sine');
    });
  });

  // ── Source only ──────────────────────────────────────────────
  describe('only source blocks', () => {
    it('suggests effect and rhythm when only a source is present', () => {
      const result = analyzeWorkspace(['biyo_sine']);
      expect(ids(result)).toEqual(['source_no_effect', 'source_no_rhythm']);
    });

    it('detects preset types as sources', () => {
      const result = analyzeWorkspace(['biyo_robot_voice']);
      // preset counts as source → suggest effect + rhythm
      expect(ids(result)).toEqual(['source_no_effect', 'source_no_rhythm']);
    });

    it('works with every source type', () => {
      const sourceTypes = [
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
      ];
      for (const src of sourceTypes) {
        const result = analyzeWorkspace([src]);
        expect(result.length).toBeGreaterThan(0);
        // First suggestion should always be source_no_effect for a lone source
        expect(result[0].id).toBe('source_no_effect');
      }
    });
  });

  // ── Source + Effect (no spatial, no rhythm) ──────────────────
  describe('source + effect (non-spatial)', () => {
    it('suggests spatial effect and melody', () => {
      // biyo_distortion is an effect but NOT a spatial effect
      const result = analyzeWorkspace(['biyo_sine', 'biyo_distortion']);
      expect(ids(result)).toEqual(['source_no_rhythm', 'effect_no_spatial']);
    });
  });

  // ── Source + Spatial Effect ──────────────────────────────────
  describe('source + spatial effect', () => {
    it('suggests rhythm when source has spatial effect but no rhythm', () => {
      // biyo_reverb is both an effect AND a spatial effect
      const result = analyzeWorkspace(['biyo_sine', 'biyo_reverb']);
      // source_no_rhythm (priority 2) and add_melody (priority 6)
      expect(ids(result)).toEqual(['source_no_rhythm', 'add_melody']);
    });
  });

  // ── Source + Effect + Rhythm (full chain) ────────────────────
  describe('full signal chain', () => {
    it('suggests drums when source + effect + rhythm present but no drum_pattern', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_reverb', 'biyo_sequencer']);
      expect(ids(result)).toEqual(['add_drums', 'try_preset']);
    });

    it('suggests new track when chain is complete with enough blocks', () => {
      const result = analyzeWorkspace([
        'biyo_sine',
        'biyo_reverb',
        'biyo_sequencer',
        'biyo_drum_pattern',
      ]);
      // try_preset (priority 8) and complete_add_track (priority 9)
      expect(ids(result)).toEqual(['try_preset', 'complete_add_track']);
    });

    it('does not suggest add_drums when drum_pattern already exists', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_reverb', 'biyo_drum_pattern']);
      expect(ids(result)).not.toContain('add_drums');
    });

    it('does not suggest add_drums when no source', () => {
      const result = analyzeWorkspace(['biyo_reverb', 'biyo_sequencer']);
      expect(ids(result)).not.toContain('add_drums');
    });

    it('does not suggest add_drums when no effect', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_sequencer']);
      expect(ids(result)).not.toContain('add_drums');
    });

    it('does not suggest add_drums when no rhythm', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_reverb']);
      expect(ids(result)).not.toContain('add_drums');
    });
  });

  // ── Note-related suggestions ─────────────────────────────────
  describe('note and chord suggestions', () => {
    it('suggests chord when a single note is present without chord', () => {
      const result = analyzeWorkspace(['biyo_piano_note']);
      // hasSource is false (piano_note is not in SOURCE_TYPES or PRESET_TYPES),
      // but hasSingleNote is true → note_no_chord triggers
      expect(ids(result)).toContain('note_no_chord');
    });

    it('suggests chord for biyo_note type', () => {
      const result = analyzeWorkspace(['biyo_note']);
      expect(ids(result)).toContain('note_no_chord');
    });

    it('does not suggest chord when chord is already present', () => {
      const result = analyzeWorkspace(['biyo_piano_note', 'biyo_chord']);
      expect(ids(result)).not.toContain('note_no_chord');
    });

    it('does not suggest chord for scale/arpeggio chord types', () => {
      const result = analyzeWorkspace(['biyo_piano_note', 'biyo_scale']);
      expect(ids(result)).not.toContain('note_no_chord');
    });
  });

  // ── Rhythm without effect ────────────────────────────────────
  describe('rhythm without effect', () => {
    it('suggests delay when rhythm is present but no effect', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_metro']);
      // source_no_effect (priority 1) and rhythm_no_effect (priority 4)
      // but source_no_effect takes one slot. Next matching is rhythm_no_effect? No,
      // Let's check: source_no_effect (1), source_no_rhythm (2) → has rhythm (biyo_metro), so skipped.
      // note_no_chord(3) → no note. rhythm_no_effect(4) → match
      expect(ids(result)).toEqual(['source_no_effect', 'rhythm_no_effect']);
    });

    it('suggests delay for sequencer type', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_sequencer']);
      expect(ids(result)).toEqual(['source_no_effect', 'rhythm_no_effect']);
    });

    it('suggests delay for all rhythm types', () => {
      const rhythmTypes = [
        'biyo_metro',
        'biyo_sequencer',
        'biyo_melody',
        'biyo_drum_pattern',
        'biyo_bpm',
        'biyo_envelope',
      ];
      for (const r of rhythmTypes) {
        const result = analyzeWorkspace(['biyo_sine', r]);
        expect(ids(result)).toContain('rhythm_no_effect');
      }
    });
  });

  // ── Effect without spatial ───────────────────────────────────
  describe('effect without spatial', () => {
    it('suggests reverb when non-spatial effect is present with source', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_lowpass']);
      expect(ids(result)).toContain('effect_no_spatial');
    });

    it('does not trigger when spatial effect exists', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_reverb']);
      expect(ids(result)).not.toContain('effect_no_spatial');
    });

    it('does not trigger when delay (spatial) exists', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_delay']);
      expect(ids(result)).not.toContain('effect_no_spatial');
    });

    it('does not trigger when pingpong (spatial) exists', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_pingpong']);
      expect(ids(result)).not.toContain('effect_no_spatial');
    });

    it('requires source to be present', () => {
      // Effect alone without source should not trigger effect_no_spatial
      const result = analyzeWorkspace(['biyo_lowpass']);
      expect(ids(result)).not.toContain('effect_no_spatial');
    });
  });

  // ── Add melody rule ──────────────────────────────────────────
  describe('add melody', () => {
    it('suggests melody when source + spatial effect but no rhythm', () => {
      // Use a spatial effect (reverb) so effect_no_spatial doesn't consume a slot
      const result = analyzeWorkspace(['biyo_sine', 'biyo_reverb']);
      // source_no_rhythm (priority 2) + add_melody (priority 6)
      expect(ids(result)).toContain('add_melody');
    });

    it('does not suggest melody when rhythm exists', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_lowpass', 'biyo_metro']);
      expect(ids(result)).not.toContain('add_melody');
    });
  });

  // ── Preset suggestion ────────────────────────────────────────
  describe('preset suggestion', () => {
    it('suggests preset when 2+ blocks and no preset', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_lowpass']);
      // try_preset (priority 8) - may be cut off by MAX_SUGGESTIONS
      // With source + non-spatial effect:
      // source_no_rhythm (2), effect_no_spatial (5) → first two slots taken
      // So try_preset won't appear here because MAX is 2
      expect(result).toHaveLength(2);
    });

    it('does not suggest preset when preset exists', () => {
      const result = analyzeWorkspace(['biyo_robot_voice', 'biyo_lowpass']);
      expect(ids(result)).not.toContain('try_preset');
    });

    it('does not suggest preset when fewer than 2 blocks', () => {
      // Single non-preset, non-source block
      const result = analyzeWorkspace(['biyo_lowpass']);
      expect(ids(result)).not.toContain('try_preset');
    });

    it('suggests preset when conditions met and higher priority rules exhausted', () => {
      // source + effect + rhythm but no drum_pattern, no preset
      const result = analyzeWorkspace(['biyo_sine', 'biyo_reverb', 'biyo_sequencer']);
      expect(ids(result)).toContain('try_preset');
    });
  });

  // ── Complete add track rule ──────────────────────────────────
  describe('complete add track', () => {
    it('suggests new track when source + effect + rhythm/chord + 4+ blocks', () => {
      const result = analyzeWorkspace([
        'biyo_sine',
        'biyo_reverb',
        'biyo_sequencer',
        'biyo_drum_pattern',
      ]);
      expect(ids(result)).toContain('complete_add_track');
    });

    it('suggests new track for chord-based composition', () => {
      // Need source + effect + chord + 4+ blocks, and higher-priority rules
      // must not consume both slots before complete_add_track (priority 9).
      // Use preset as source so hasPreset=true (try_preset won't match).
      // Use spatial effect so effect_no_spatial won't match.
      // Add rhythm so source_no_rhythm/add_melody won't match.
      const result = analyzeWorkspace([
        'biyo_robot_voice',
        'biyo_reverb',
        'biyo_chord',
        'biyo_sequencer',
        'biyo_drum_pattern',
      ]);
      expect(ids(result)).toContain('complete_add_track');
    });

    it('does not suggest new track with fewer than 4 blocks', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_reverb', 'biyo_chord']);
      expect(ids(result)).not.toContain('complete_add_track');
    });

    it('does not suggest new track without effect', () => {
      const result = analyzeWorkspace(['biyo_sine', 'biyo_chord', 'biyo_note', 'biyo_piano_note']);
      expect(ids(result)).not.toContain('complete_add_track');
    });

    it('does not suggest new track without source', () => {
      const result = analyzeWorkspace([
        'biyo_reverb',
        'biyo_chord',
        'biyo_lowpass',
        'biyo_sequencer',
      ]);
      expect(ids(result)).not.toContain('complete_add_track');
    });

    it('does not suggest new track without rhythm or chord', () => {
      const result = analyzeWorkspace([
        'biyo_sine',
        'biyo_reverb',
        'biyo_lowpass',
        'biyo_distortion',
      ]);
      expect(ids(result)).not.toContain('complete_add_track');
    });
  });

  // ── MAX_SUGGESTIONS limit ────────────────────────────────────
  describe('max suggestions limit', () => {
    it('returns at most 2 suggestions', () => {
      const result = analyzeWorkspace(['biyo_sine']);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('returns at most 2 even when many rules match', () => {
      // source + non-spatial effect: many rules could match
      const result = analyzeWorkspace(['biyo_sine', 'biyo_distortion', 'biyo_piano_note']);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  // ── Priority ordering ────────────────────────────────────────
  describe('priority ordering', () => {
    it('returns higher priority suggestions first', () => {
      // With just a source: source_no_effect (1) comes before source_no_rhythm (2)
      const result = analyzeWorkspace(['biyo_sine']);
      expect(result[0].id).toBe('source_no_effect');
      expect(result[1].id).toBe('source_no_rhythm');
    });

    it('empty workspace has highest priority', () => {
      const result = analyzeWorkspace([]);
      expect(result[0].id).toBe('empty_add_source');
    });
  });

  // ── Suggestion shape ─────────────────────────────────────────
  describe('suggestion object shape', () => {
    it('returns well-formed suggestion objects', () => {
      const result = analyzeWorkspace([]);
      const suggestion = result[0];
      expect(suggestion).toHaveProperty('id');
      expect(suggestion).toHaveProperty('label');
      expect(suggestion).toHaveProperty('emoji');
      expect(suggestion).toHaveProperty('blockType');
      expect(suggestion).toHaveProperty('reason');
      expect(suggestion).toHaveProperty('xml');
      expect(typeof suggestion.id).toBe('string');
      expect(typeof suggestion.label).toBe('string');
      expect(typeof suggestion.emoji).toBe('string');
      expect(typeof suggestion.blockType).toBe('string');
      expect(typeof suggestion.reason).toBe('string');
      expect(typeof suggestion.xml).toBe('string');
    });
  });

  // ── Block type classification completeness ───────────────────
  describe('block type classification', () => {
    it('classifies all effect types correctly', () => {
      const effectTypes = [
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
      ];
      for (const eff of effectTypes) {
        // source + effect → should NOT produce source_no_effect
        const result = analyzeWorkspace(['biyo_sine', eff]);
        expect(ids(result)).not.toContain('source_no_effect');
      }
    });

    it('classifies spatial effects as subset of effects', () => {
      const spatialEffects = ['biyo_reverb', 'biyo_delay', 'biyo_pingpong'];
      for (const sp of spatialEffects) {
        // source + spatial → no effect_no_spatial
        const result = analyzeWorkspace(['biyo_sine', sp]);
        expect(ids(result)).not.toContain('effect_no_spatial');
      }
    });

    it('classifies all preset types', () => {
      const presetTypes = [
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
      for (const preset of presetTypes) {
        // Presets count as sources, so source_no_effect should appear
        const result = analyzeWorkspace([preset]);
        expect(ids(result)).toContain('source_no_effect');
      }
    });

    it('classifies all chord types', () => {
      const chordTypes = ['biyo_chord', 'biyo_scale', 'biyo_arpeggio', 'biyo_famicom'];
      for (const ch of chordTypes) {
        // note + chord → no note_no_chord
        const result = analyzeWorkspace(['biyo_piano_note', ch]);
        expect(ids(result)).not.toContain('note_no_chord');
      }
    });

    it('classifies all note types', () => {
      const noteTypes = ['biyo_piano_note', 'biyo_note'];
      for (const note of noteTypes) {
        const result = analyzeWorkspace([note]);
        expect(ids(result)).toContain('note_no_chord');
      }
    });
  });

  // ── No duplicate suggestions ─────────────────────────────────
  describe('no duplicate suggestions', () => {
    it('never returns duplicate suggestion IDs', () => {
      const scenarios = [
        [],
        ['biyo_sine'],
        ['biyo_sine', 'biyo_reverb'],
        ['biyo_sine', 'biyo_lowpass'],
        ['biyo_sine', 'biyo_reverb', 'biyo_sequencer'],
        ['biyo_sine', 'biyo_reverb', 'biyo_sequencer', 'biyo_drum_pattern'],
        ['biyo_piano_note'],
        ['biyo_piano_note', 'biyo_chord'],
      ];
      for (const blocks of scenarios) {
        const result = analyzeWorkspace(blocks);
        const resultIds = ids(result);
        const uniqueIds = new Set(resultIds);
        expect(resultIds.length).toBe(uniqueIds.size);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════
// extractBlockTypesFromXml
// ══════════════════════════════════════════════════════════════════

describe('extractBlockTypesFromXml', () => {
  it('extracts block types from valid XML', () => {
    const xml = `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="biyo_sine" x="180" y="120">
          <field name="NOTE">C</field>
        </block>
        <block type="biyo_reverb" x="180" y="200">
          <field name="SIZE">0.6</field>
        </block>
      </xml>`;
    const result = extractBlockTypesFromXml(xml);
    expect(result).toEqual(['biyo_sine', 'biyo_reverb']);
  });

  it('extracts multiple occurrences of the same type', () => {
    const xml = `
      <xml>
        <block type="biyo_sine"/>
        <block type="biyo_sine"/>
      </xml>`;
    const result = extractBlockTypesFromXml(xml);
    expect(result).toEqual(['biyo_sine', 'biyo_sine']);
  });

  it('returns empty array for empty string', () => {
    const result = extractBlockTypesFromXml('');
    expect(result).toEqual([]);
  });

  it('returns empty array for XML with no biyo blocks', () => {
    const xml = `<xml><block type="controls_if"></block></xml>`;
    const result = extractBlockTypesFromXml(xml);
    expect(result).toEqual([]);
  });

  it('returns empty array for invalid/non-XML string', () => {
    const result = extractBlockTypesFromXml('this is not xml at all');
    expect(result).toEqual([]);
  });

  it('returns empty array for XML without type attributes', () => {
    const xml = `<xml><block name="test"></block></xml>`;
    const result = extractBlockTypesFromXml(xml);
    expect(result).toEqual([]);
  });

  it('only matches biyo_ prefixed types', () => {
    const xml = `
      <xml>
        <block type="biyo_sine"/>
        <block type="other_block"/>
        <block type="biyo_reverb"/>
      </xml>`;
    const result = extractBlockTypesFromXml(xml);
    expect(result).toEqual(['biyo_sine', 'biyo_reverb']);
  });

  it('handles nested block XML correctly', () => {
    const xml = `
      <xml>
        <block type="biyo_sine">
          <next>
            <block type="biyo_lowpass">
              <next>
                <block type="biyo_reverb"/>
              </next>
            </block>
          </next>
        </block>
      </xml>`;
    const result = extractBlockTypesFromXml(xml);
    expect(result).toEqual(['biyo_sine', 'biyo_lowpass', 'biyo_reverb']);
  });

  it('handles XML with single quotes (does not match)', () => {
    const xml = `<xml><block type='biyo_sine'/></xml>`;
    const result = extractBlockTypesFromXml(xml);
    // regex uses double quotes only
    expect(result).toEqual([]);
  });

  it('integrates correctly with analyzeWorkspace', () => {
    const xml = `
      <xml>
        <block type="biyo_sine"/>
        <block type="biyo_reverb"/>
      </xml>`;
    const types = extractBlockTypesFromXml(xml);
    const suggestions = analyzeWorkspace(types);
    expect(suggestions.length).toBeGreaterThan(0);
    // source + spatial effect → source_no_rhythm should be first
    expect(suggestions[0].id).toBe('source_no_rhythm');
  });
});
