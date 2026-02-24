import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Blockly
// ---------------------------------------------------------------------------
// vi.mock is hoisted to the top of the file, so all referenced variables must
// be defined inside the factory. We store the shared forBlock registry on
// globalThis so tests can look up individual block generators.
// ---------------------------------------------------------------------------

vi.mock('blockly', () => {
  // Initialize the shared registry here since vi.mock is hoisted to file top.
  // biome-ignore lint/suspicious/noExplicitAny: test helper
  if (!(globalThis as any).__blockRegistry) {
    // biome-ignore lint/suspicious/noExplicitAny: test helper
    (globalThis as any).__blockRegistry = {};
  }
  // biome-ignore lint/suspicious/noExplicitAny: test helper
  const registry = (globalThis as any).__blockRegistry;

  class MockCodeGenerator {
    name: string;
    // biome-ignore lint/complexity/noBannedTypes: test mock
    forBlock: Record<string, Function>;
    PRECEDENCE = 0;

    constructor(name: string) {
      this.name = name;
      this.forBlock = registry;
    }

    // biome-ignore lint/suspicious/noExplicitAny: test mock
    valueToCode(block: any, inputName: string, _order: number): string {
      return block.__connectedInputs?.[inputName] ?? '';
    }

    // biome-ignore lint/suspicious/noExplicitAny: test mock
    blockToCode(block: any): string | [string, number] {
      const fn = this.forBlock[block.type];
      if (!fn) return '';
      return fn(block, this);
    }
  }

  return {
    __esModule: true,
    default: { CodeGenerator: MockCodeGenerator },
    CodeGenerator: MockCodeGenerator,
  };
});

// ---------------------------------------------------------------------------
// Import the module under test (after mock is in place)
// ---------------------------------------------------------------------------
import { generateMimiumCode, mimiumGenerator, Order, PREAMBLE } from '../mimium-generator';

// biome-ignore lint/suspicious/noExplicitAny: test helper
// biome-ignore lint/complexity/noBannedTypes: Function type is appropriate for dynamic block registry
const blockRegistry: Record<string, Function> = (globalThis as any).__blockRegistry;

// ---------------------------------------------------------------------------
// Helper: create a mock Block
// ---------------------------------------------------------------------------
interface MockBlockOptions {
  type: string;
  id?: string;
  fields?: Record<string, string | number>;
  /** Map of input name -> code string (simulates connected child blocks) */
  connectedInputs?: Record<string, string>;
  enabled?: boolean;
}

function createMockBlock(opts: MockBlockOptions) {
  const fields = opts.fields ?? {};
  return {
    type: opts.type,
    id: opts.id ?? 'abcd1234',
    getFieldValue(name: string) {
      return fields[name] ?? null;
    },
    isEnabled() {
      return opts.enabled !== false;
    },
    __connectedInputs: opts.connectedInputs ?? {},
    // biome-ignore lint/suspicious/noExplicitAny: test mock
  } as any;
}

// ---------------------------------------------------------------------------
// Helper: invoke a registered block generator and return [code, order]
// ---------------------------------------------------------------------------
function generateBlock(opts: MockBlockOptions): [code: string, order: number] {
  const block = createMockBlock(opts);
  const fn = blockRegistry[opts.type];
  if (!fn) throw new Error(`No generator registered for block type: ${opts.type}`);
  const result = fn(block, mimiumGenerator);
  return result as [string, number];
}

// ---------------------------------------------------------------------------
// Helper: create a mock Workspace
// ---------------------------------------------------------------------------
function createMockWorkspace(blocks: MockBlockOptions[]) {
  const mockBlocks = blocks.map(createMockBlock);
  return {
    getTopBlocks(_ordered: boolean) {
      return mockBlocks;
    },
    // biome-ignore lint/suspicious/noExplicitAny: test mock
  } as any;
}

// =========================================================================
// TESTS
// =========================================================================

describe('mimium-generator', () => {
  // -----------------------------------------------------------------------
  // Exports
  // -----------------------------------------------------------------------
  describe('exports', () => {
    it('exports PREAMBLE as a non-empty string', () => {
      expect(typeof PREAMBLE).toBe('string');
      expect(PREAMBLE.length).toBeGreaterThan(0);
    });

    it('exports Order with expected precedence levels', () => {
      expect(Order.ATOMIC).toBe(0);
      expect(Order.FUNCTION_CALL).toBe(1);
      expect(Order.UNARY).toBe(2);
      expect(Order.MULTIPLY).toBe(3);
      expect(Order.ADD).toBe(4);
      expect(Order.NONE).toBe(99);
    });

    it('exports mimiumGenerator instance', () => {
      expect(mimiumGenerator).toBeDefined();
    });

    it('PREAMBLE contains essential helper functions', () => {
      expect(PREAMBLE).toContain('fn midi_to_hz(note)');
      expect(PREAMBLE).toContain('fn sinwave(freq, phase)');
      expect(PREAMBLE).toContain('fn saw(freq, phase)');
      expect(PREAMBLE).toContain('fn triangle(freq, phase)');
      expect(PREAMBLE).toContain('fn square(freq, phase)');
      expect(PREAMBLE).toContain('fn noise()');
      expect(PREAMBLE).toContain('fn lowpass(input, freq, q)');
      expect(PREAMBLE).toContain('fn highpass(input, freq, q)');
      expect(PREAMBLE).toContain('fn bandpass(input, freq, q)');
      expect(PREAMBLE).toContain('fn metro(interval)');
      expect(PREAMBLE).toContain('fn _delay(input, time)');
      expect(PREAMBLE).toContain('fn envelope(trigger, attack, release)');
      expect(PREAMBLE).toContain('fn clamp(x, lo, hi)');
      expect(PREAMBLE).toContain('fn soft_clip(x)');
    });
  });

  // =======================================================================
  // SOURCE BLOCKS
  // =======================================================================
  describe('source blocks', () => {
    describe('biyo_sine', () => {
      it('generates sinwave with midi_to_hz for A4 (default)', () => {
        const [code, order] = generateBlock({
          type: 'biyo_sine',
          fields: { NOTE: 'A', OCTAVE: '4' },
        });
        expect(code).toBe('sinwave(midi_to_hz(69.0), 0.0)');
        expect(order).toBe(Order.FUNCTION_CALL);
      });

      it('generates correct MIDI note for C3', () => {
        const [code] = generateBlock({
          type: 'biyo_sine',
          fields: { NOTE: 'C', OCTAVE: '3' },
        });
        expect(code).toBe('sinwave(midi_to_hz(48.0), 0.0)');
      });

      it('uses defaults when fields are null', () => {
        const [code] = generateBlock({
          type: 'biyo_sine',
          fields: {},
        });
        expect(code).toBe('sinwave(midi_to_hz(69.0), 0.0)');
      });

      it('generates correct MIDI for sharp notes', () => {
        const [code] = generateBlock({
          type: 'biyo_sine',
          fields: { NOTE: 'F#', OCTAVE: '5' },
        });
        expect(code).toBe('sinwave(midi_to_hz(78.0), 0.0)');
      });
    });

    describe('biyo_saw', () => {
      it('generates saw() call with midi_to_hz', () => {
        const [code, order] = generateBlock({
          type: 'biyo_saw',
          fields: { NOTE: 'D', OCTAVE: '3' },
        });
        expect(code).toBe('saw(midi_to_hz(50.0), 0.0)');
        expect(order).toBe(Order.FUNCTION_CALL);
      });

      it('uses defaults when fields are null', () => {
        const [code] = generateBlock({
          type: 'biyo_saw',
          fields: {},
        });
        expect(code).toBe('saw(midi_to_hz(69.0), 0.0)');
      });
    });

    describe('biyo_square', () => {
      it('generates square() call', () => {
        const [code, order] = generateBlock({
          type: 'biyo_square',
          fields: { NOTE: 'E', OCTAVE: '4' },
        });
        expect(code).toBe('square(midi_to_hz(64.0), 0.0)');
        expect(order).toBe(Order.FUNCTION_CALL);
      });
    });

    describe('biyo_triangle', () => {
      it('generates triangle() call', () => {
        const [code, order] = generateBlock({
          type: 'biyo_triangle',
          fields: { NOTE: 'G', OCTAVE: '4' },
        });
        expect(code).toBe('triangle(midi_to_hz(67.0), 0.0)');
        expect(order).toBe(Order.FUNCTION_CALL);
      });
    });

    describe('biyo_noise', () => {
      it('generates noise() with no parameters', () => {
        const [code, order] = generateBlock({ type: 'biyo_noise', fields: {} });
        expect(code).toBe('noise()');
        expect(order).toBe(Order.FUNCTION_CALL);
      });
    });

    describe('biyo_filtered_noise', () => {
      it('wraps noise in lowpass with specified brightness', () => {
        const [code, order] = generateBlock({
          type: 'biyo_filtered_noise',
          fields: { BRIGHTNESS: '3000' },
        });
        expect(code).toBe('lowpass(noise(), 3000.0, 0.707)');
        expect(order).toBe(Order.FUNCTION_CALL);
      });

      it('uses default brightness of 2000 when field is null', () => {
        const [code] = generateBlock({
          type: 'biyo_filtered_noise',
          fields: {},
        });
        expect(code).toBe('lowpass(noise(), 2000.0, 0.707)');
      });
    });

    describe('biyo_kick', () => {
      it('generates kick synthesis with envelope-modulated frequency', () => {
        const [code, order] = generateBlock({
          type: 'biyo_kick',
          fields: { FREQ: '60' },
        });
        expect(code).toContain('sinwave(60.0');
        expect(code).toContain('envelope(metro(0.5), 0.001, 0.15)');
        expect(code).toContain('envelope(metro(0.5), 0.001, 0.2)');
        expect(order).toBe(Order.MULTIPLY);
      });

      it('uses default freq 60 when field is null', () => {
        const [code] = generateBlock({
          type: 'biyo_kick',
          fields: {},
        });
        expect(code).toContain('sinwave(60.0');
      });

      it('accepts custom frequency', () => {
        const [code] = generateBlock({
          type: 'biyo_kick',
          fields: { FREQ: '80' },
        });
        expect(code).toContain('sinwave(80.0');
      });
    });

    describe('biyo_hihat', () => {
      it('generates hihat with highpass noise and envelope', () => {
        const [code, order] = generateBlock({
          type: 'biyo_hihat',
          fields: { LENGTH: '0.05' },
        });
        expect(code).toContain('highpass(noise(), 8000.0, 1.0)');
        expect(code).toContain('envelope(metro(0.25), 0.001, 0.05)');
        expect(order).toBe(Order.MULTIPLY);
      });

      it('uses default length when field is null', () => {
        const [code] = generateBlock({
          type: 'biyo_hihat',
          fields: {},
        });
        expect(code).toContain('envelope(metro(0.25), 0.001, 0.05)');
      });

      it('accepts custom length', () => {
        const [code] = generateBlock({
          type: 'biyo_hihat',
          fields: { LENGTH: '0.1' },
        });
        expect(code).toContain('envelope(metro(0.25), 0.001, 0.1)');
      });
    });

    describe('biyo_pluck', () => {
      it('generates pluck with sinwave + triangle + noise', () => {
        const [code, order] = generateBlock({
          type: 'biyo_pluck',
          fields: { NOTE: 'A', OCTAVE: '4', SUSTAIN: '0.5' },
        });
        expect(code).toContain('sinwave(midi_to_hz(69.0), 0.0)');
        expect(code).toContain('triangle(midi_to_hz(69.0) * 2.0, 0.0)');
        expect(code).toContain('noise()');
        expect(code).toContain('* 0.5');
        expect(code).toContain('* 0.3');
        expect(code).toContain('* 0.2');
        expect(code).toContain('envelope(metro(0.600)');
        expect(code).toContain(', 0.001, 0.5)');
        expect(order).toBe(Order.MULTIPLY);
      });

      it('uses default values when fields are null', () => {
        const [code] = generateBlock({
          type: 'biyo_pluck',
          fields: {},
        });
        expect(code).toContain('midi_to_hz(69.0)');
        expect(code).toContain('0.001, 0.5)');
      });
    });

    describe('biyo_detune_saw', () => {
      it('generates 3-oscillator detuned saw output', () => {
        const [code, order] = generateBlock({
          type: 'biyo_detune_saw',
          fields: { NOTE: 'A', OCTAVE: '4', DETUNE: '1' },
        });
        expect(code).toContain('saw(midi_to_hz(69.0), 0.0)');
        expect(code).toContain('saw(midi_to_hz(69.0) + 1, 0.33)');
        expect(code).toContain('saw(midi_to_hz(69.0) - 1, 0.66)');
        expect(code).toContain('/ 3.0');
        expect(order).toBe(Order.MULTIPLY);
      });

      it('uses default detune of 1 when field is null', () => {
        const [code] = generateBlock({
          type: 'biyo_detune_saw',
          fields: {},
        });
        expect(code).toContain('+ 1, 0.33)');
        expect(code).toContain('- 1, 0.66)');
      });

      it('supports custom detune value', () => {
        const [code] = generateBlock({
          type: 'biyo_detune_saw',
          fields: { NOTE: 'C', OCTAVE: '3', DETUNE: '2.5' },
        });
        expect(code).toContain('+ 2.5, 0.33)');
        expect(code).toContain('- 2.5, 0.66)');
      });
    });
  });

  // =======================================================================
  // EFFECT BLOCKS
  // =======================================================================
  describe('effect blocks', () => {
    describe('biyo_lowpass', () => {
      it('wraps signal in lowpass()', () => {
        const [code, order] = generateBlock({
          type: 'biyo_lowpass',
          fields: { CUTOFF: '1000', RESONANCE: '1' },
          connectedInputs: { SIGNAL: 'noise()' },
        });
        expect(code).toBe('lowpass(noise(), 1000.0, 1)');
        expect(order).toBe(Order.FUNCTION_CALL);
      });

      it('uses fallback 0.0 when no signal connected', () => {
        const [code] = generateBlock({
          type: 'biyo_lowpass',
          fields: { CUTOFF: '500', RESONANCE: '2' },
        });
        expect(code).toBe('lowpass(0.0, 500.0, 2)');
      });

      it('uses default cutoff/resonance when fields null', () => {
        const [code] = generateBlock({
          type: 'biyo_lowpass',
          fields: {},
          connectedInputs: { SIGNAL: 'noise()' },
        });
        expect(code).toBe('lowpass(noise(), 1000.0, 1)');
      });
    });

    describe('biyo_highpass', () => {
      it('wraps signal in highpass()', () => {
        const [code, order] = generateBlock({
          type: 'biyo_highpass',
          fields: { CUTOFF: '2000', RESONANCE: '0.7' },
          connectedInputs: { SIGNAL: 'saw(440.0, 0.0)' },
        });
        expect(code).toBe('highpass(saw(440.0, 0.0), 2000.0, 0.7)');
        expect(order).toBe(Order.FUNCTION_CALL);
      });
    });

    describe('biyo_bandpass', () => {
      it('wraps signal in bandpass() with computed Q', () => {
        const [code, order] = generateBlock({
          type: 'biyo_bandpass',
          fields: { CENTER: '1000', WIDTH: '500' },
          connectedInputs: { SIGNAL: 'noise()' },
        });
        expect(code).toBe('bandpass(noise(), 1000.0, 2.00)');
        expect(order).toBe(Order.FUNCTION_CALL);
      });

      it('clamps Q to minimum 0.1', () => {
        const [code] = generateBlock({
          type: 'biyo_bandpass',
          fields: { CENTER: '10', WIDTH: '100000' },
          connectedInputs: { SIGNAL: 'noise()' },
        });
        expect(code).toBe('bandpass(noise(), 10.0, 0.10)');
      });
    });

    describe('biyo_delay', () => {
      it('generates delay with dry/wet mix', () => {
        const [code, order] = generateBlock({
          type: 'biyo_delay',
          fields: { TIME: '0.3', MIX: '0.5' },
          connectedInputs: { SIGNAL: 'noise()' },
        });
        expect(code).toContain('(noise()) * 0.5');
        expect(code).toContain('_delay(noise(), 0.3) * 0.5');
        expect(order).toBe(Order.ADD);
      });

      it('uses default time and mix when fields null', () => {
        const [code] = generateBlock({
          type: 'biyo_delay',
          fields: {},
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toContain('(sig) * 0.5');
        expect(code).toContain('_delay(sig, 0.3) * 0.5');
      });

      it('correctly computes dry level as 1 - mix', () => {
        const [code] = generateBlock({
          type: 'biyo_delay',
          fields: { TIME: '0.5', MIX: '0.3' },
          connectedInputs: { SIGNAL: 's' },
        });
        expect(code).toContain('(s) * 0.7');
        expect(code).toContain('_delay(s, 0.5) * 0.3');
      });
    });

    describe('biyo_reverb', () => {
      it('generates reverb with let-binding cache', () => {
        const [code, order] = generateBlock({
          type: 'biyo_reverb',
          id: 'abcd1234',
          fields: { SIZE: '0.6', MIX: '0.3' },
          connectedInputs: { SIGNAL: 'noise()' },
        });
        expect(code).toContain('let _rvabcd = noise()');
        expect(code).toContain('_rvabcd * 0.700');
        expect(code).toContain('_delay(_rvabcd,');
        // Signal referenced only once (in let binding), not duplicated
        const noiseCount = (code.match(/noise\(\)/g) || []).length;
        expect(noiseCount).toBe(1);
        expect(order).toBe(Order.ADD);
      });

      it('computes delay times based on size', () => {
        const [code] = generateBlock({
          type: 'biyo_reverb',
          id: 'test5678',
          fields: { SIZE: '1.0', MIX: '0.5' },
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toContain('_delay(_rvtest, 0.0400)');
        expect(code).toContain('_delay(_rvtest, 0.0700)');
        expect(code).toContain('_delay(_rvtest, 0.1000)');
        expect(code).toContain('_delay(_rvtest, 0.1500)');
      });
    });

    describe('biyo_tremolo', () => {
      it('generates amplitude modulation', () => {
        const [code, order] = generateBlock({
          type: 'biyo_tremolo',
          fields: { SPEED: '5', DEPTH: '0.5' },
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toContain('(sig)');
        expect(code).toContain('sinwave(5.0, 0.0)');
        expect(code).toContain('0.5');
        expect(order).toBe(Order.MULTIPLY);
      });
    });

    describe('biyo_autowah', () => {
      it('generates LFO-modulated lowpass', () => {
        const [code, order] = generateBlock({
          type: 'biyo_autowah',
          fields: { SPEED: '2', DEPTH: '0.5' },
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toContain('lowpass(sig,');
        expect(code).toContain('500.0');
        expect(code).toContain('3000.0');
        expect(code).toContain('sinwave(2.0, 0.0)');
        expect(order).toBe(Order.FUNCTION_CALL);
      });
    });

    describe('biyo_vibrato', () => {
      it('generates vibrato via modulated delay', () => {
        const [code, order] = generateBlock({
          type: 'biyo_vibrato',
          fields: { SPEED: '5', DEPTH: '0.3' },
          connectedInputs: { SIGNAL: 'sig' },
        });
        const delayTime = (0.3 * 0.002).toFixed(6);
        expect(code).toContain(`_delay(sig, ${delayTime}`);
        expect(code).toContain('sinwave(5.0, 0.0)');
        expect(order).toBe(Order.FUNCTION_CALL);
      });
    });

    describe('biyo_distortion', () => {
      it('generates soft_clip distortion', () => {
        const [code, order] = generateBlock({
          type: 'biyo_distortion',
          fields: { DRIVE: '5' },
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toBe('soft_clip((sig) * 5.0) / 5.0 * 3.0');
        expect(order).toBe(Order.MULTIPLY);
      });

      it('uses default drive when field is null', () => {
        const [code] = generateBlock({
          type: 'biyo_distortion',
          fields: {},
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toBe('soft_clip((sig) * 5.0) / 5.0 * 3.0');
      });

      it('accepts custom drive value', () => {
        const [code] = generateBlock({
          type: 'biyo_distortion',
          fields: { DRIVE: '10' },
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toBe('soft_clip((sig) * 10.0) / 10.0 * 3.0');
      });
    });

    describe('biyo_gain_up', () => {
      it('multiplies signal by gain', () => {
        const [code, order] = generateBlock({
          type: 'biyo_gain_up',
          fields: { GAIN: '2.0' },
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toBe('(sig) * 2');
        expect(order).toBe(Order.MULTIPLY);
      });
    });

    describe('biyo_gain_down', () => {
      it('multiplies signal by amount', () => {
        const [code, order] = generateBlock({
          type: 'biyo_gain_down',
          fields: { AMOUNT: '0.3' },
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toBe('(sig) * 0.3');
        expect(order).toBe(Order.MULTIPLY);
      });
    });

    describe('biyo_telephone', () => {
      it('generates bandpass + soft_clip telephone effect', () => {
        const [code, order] = generateBlock({
          type: 'biyo_telephone',
          fields: {},
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toBe('bandpass(soft_clip((sig) * 4.0), 1200.0, 3.0) * 0.5');
        expect(order).toBe(Order.MULTIPLY);
      });
    });

    describe('biyo_pingpong', () => {
      it('generates ping-pong delay', () => {
        const [code, order] = generateBlock({
          type: 'biyo_pingpong',
          fields: { TIME: '0.25', FEEDBACK: '0.4' },
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toContain('(sig) * 0.5');
        expect(code).toContain('_delay(sig, 0.25) * 0.4 * 0.5');
        expect(code).toContain('_delay(sig, 0.5)');
        expect(order).toBe(Order.ADD);
      });
    });

    describe('biyo_passthrough', () => {
      it('passes signal through unchanged', () => {
        const [code, order] = generateBlock({
          type: 'biyo_passthrough',
          fields: {},
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toBe('sig');
        expect(order).toBe(Order.ATOMIC);
      });
    });

    describe('all effect blocks produce valid output', () => {
      const effectBlocks: MockBlockOptions[] = [
        { type: 'biyo_lowpass', fields: { CUTOFF: '1000', RESONANCE: '1' } },
        { type: 'biyo_highpass', fields: { CUTOFF: '2000', RESONANCE: '1' } },
        { type: 'biyo_bandpass', fields: { CENTER: '1000', WIDTH: '500' } },
        { type: 'biyo_delay', fields: { TIME: '0.3', MIX: '0.5' } },
        { type: 'biyo_reverb', fields: { SIZE: '0.6', MIX: '0.3' } },
        { type: 'biyo_tremolo', fields: { SPEED: '5', DEPTH: '0.5' } },
        { type: 'biyo_autowah', fields: { SPEED: '2', DEPTH: '0.5' } },
        { type: 'biyo_vibrato', fields: { SPEED: '5', DEPTH: '0.3' } },
        { type: 'biyo_distortion', fields: { DRIVE: '5' } },
        { type: 'biyo_gain_up', fields: { GAIN: '1.5' } },
        { type: 'biyo_gain_down', fields: { AMOUNT: '0.5' } },
        { type: 'biyo_telephone', fields: {} },
      ];

      for (const { type, fields } of effectBlocks) {
        it(`${type} produces non-empty code`, () => {
          const [code, order] = generateBlock({
            type,
            fields,
            connectedInputs: { SIGNAL: 'noise()' },
          });
          expect(code).toBeTruthy();
          expect(code.length).toBeGreaterThan(0);
          expect(typeof order).toBe('number');
        });
      }
    });
  });

  // =======================================================================
  // RHYTHM BLOCKS
  // =======================================================================
  describe('rhythm blocks', () => {
    describe('biyo_metro', () => {
      it('generates metro with interval from BPM', () => {
        const [code, order] = generateBlock({
          type: 'biyo_metro',
          fields: { BPM: '120' },
        });
        expect(code).toBe('metro(0.500000)');
        expect(order).toBe(Order.FUNCTION_CALL);
      });

      it('uses default BPM 120 when field is null', () => {
        const [code] = generateBlock({
          type: 'biyo_metro',
          fields: {},
        });
        expect(code).toBe('metro(0.500000)');
      });

      it('computes correct interval for 60 BPM', () => {
        const [code] = generateBlock({
          type: 'biyo_metro',
          fields: { BPM: '60' },
        });
        expect(code).toBe('metro(1.000000)');
      });
    });

    describe('biyo_sequencer', () => {
      it('generates 4-step sequence with fmod', () => {
        const [code, order] = generateBlock({
          type: 'biyo_sequencer',
          fields: {
            BPM: '120',
            NOTE1: '60',
            NOTE2: '64',
            NOTE3: '67',
            NOTE4: '72',
          },
        });
        expect(code).toContain('fmod(now / samplerate /');
        expect(code).toContain('4.0)');
        expect(code).toContain('midi_to_hz(60.0)');
        expect(code).toContain('midi_to_hz(64.0)');
        expect(code).toContain('midi_to_hz(67.0)');
        expect(code).toContain('midi_to_hz(72.0)');
        expect(code).toContain('_step_idx == 0.0');
        expect(code).toContain('_step_idx == 1.0');
        expect(code).toContain('_step_idx == 2.0');
        expect(code).toContain('_step_idx == 3.0');
        expect(order).toBe(Order.ATOMIC);
      });

      it('uses default MIDI notes when fields null', () => {
        const [code] = generateBlock({
          type: 'biyo_sequencer',
          fields: {},
        });
        expect(code).toContain('midi_to_hz(60.0)');
        expect(code).toContain('midi_to_hz(64.0)');
        expect(code).toContain('midi_to_hz(67.0)');
        expect(code).toContain('midi_to_hz(72.0)');
      });

      it('computes speed from BPM', () => {
        const [code] = generateBlock({
          type: 'biyo_sequencer',
          fields: { BPM: '60', NOTE1: '60', NOTE2: '64', NOTE3: '67', NOTE4: '72' },
        });
        expect(code).toContain('/ 1.000000, 4.0)');
      });
    });

    describe('biyo_melody', () => {
      it('generates 8-step melody', () => {
        const [code, order] = generateBlock({
          type: 'biyo_melody',
          fields: {
            BPM: '120',
            OCTAVE: '4',
            NOTE1: 'C',
            NOTE2: 'D',
            NOTE3: 'E',
            NOTE4: 'F',
            NOTE5: 'G',
            NOTE6: 'A',
            NOTE7: 'B',
            NOTE8: 'C',
          },
        });
        expect(code).toContain('fmod(now / samplerate /');
        expect(code).toContain('8.0)');
        expect(code).toContain('_mel_idx');
        expect(code).toContain('midi_to_hz(60.0)');
        expect(code).toContain('midi_to_hz(62.0)');
        expect(code).toContain('midi_to_hz(64.0)');
        expect(order).toBe(Order.ATOMIC);
      });

      it('handles REST notes', () => {
        const [code] = generateBlock({
          type: 'biyo_melody',
          fields: {
            BPM: '120',
            OCTAVE: '4',
            NOTE1: 'C',
            NOTE2: 'REST',
            NOTE3: 'E',
            NOTE4: 'REST',
            NOTE5: 'G',
            NOTE6: 'REST',
            NOTE7: 'B',
            NOTE8: 'REST',
          },
        });
        expect(code).toContain('_mel_idx == 1.0 { 0.0 }');
        expect(code).toContain('_mel_idx == 3.0 { 0.0 }');
        expect(code).toContain('_mel_idx == 5.0 { 0.0 }');
        expect(code).toContain('_mel_idx == 7.0 { 0.0 }');
      });

      it('uses default octave 4 and note C when fields null', () => {
        const [code] = generateBlock({
          type: 'biyo_melody',
          fields: {},
        });
        expect(code).toContain('midi_to_hz(60.0)');
      });
    });

    describe('biyo_drum_pattern', () => {
      it('generates rock drum pattern', () => {
        const [code, order] = generateBlock({
          type: 'biyo_drum_pattern',
          fields: { BPM: '120', PATTERN: 'rock' },
        });
        expect(code).toContain('_dp_idx');
        expect(code).toContain('fmod(now / samplerate /');
        expect(code).toContain('16.0)');
        expect(code).toContain('_dp_idx == 0.0 { 1.0 }');
        expect(code).toContain('_dp_idx == 1.0 { 0.0 }');
        expect(order).toBe(Order.ATOMIC);
      });

      it('generates techno pattern', () => {
        const [code] = generateBlock({
          type: 'biyo_drum_pattern',
          fields: { BPM: '130', PATTERN: 'techno' },
        });
        // techno = "x.x.x.x.x.x.x.x." = 16 steps
        expect(code).toContain('16.0)');
      });

      it('generates jazz pattern', () => {
        const [code] = generateBlock({
          type: 'biyo_drum_pattern',
          fields: { BPM: '100', PATTERN: 'jazz' },
        });
        // jazz = "x..x..x..x.." = 12 steps
        expect(code).toContain('12.0)');
      });

      it('generates samba pattern', () => {
        const [code] = generateBlock({
          type: 'biyo_drum_pattern',
          fields: { BPM: '110', PATTERN: 'samba' },
        });
        // samba = "x.xx.xx.x.xx.xx." = 16 steps
        expect(code).toContain('16.0)');
      });

      it('falls back to rock for unknown pattern', () => {
        const [code] = generateBlock({
          type: 'biyo_drum_pattern',
          fields: { BPM: '120', PATTERN: 'unknown_pattern' },
        });
        expect(code).toContain('16.0)');
      });

      it('uses default BPM and pattern when fields null', () => {
        const [code] = generateBlock({
          type: 'biyo_drum_pattern',
          fields: {},
        });
        expect(code).toContain('16.0)');
      });
    });

    describe('biyo_scale', () => {
      it('generates major scale pattern (8 notes)', () => {
        const [code, order] = generateBlock({
          type: 'biyo_scale',
          fields: { ROOT: 'C', SCALE_TYPE: 'major', OCTAVE: '4', SPEED: '120' },
        });
        expect(code).toContain('_scale_idx');
        expect(code).toContain('8.0)');
        expect(code).toContain('midi_to_hz(60.0)');
        expect(code).toContain('midi_to_hz(62.0)');
        expect(code).toContain('midi_to_hz(64.0)');
        expect(code).toContain('midi_to_hz(65.0)');
        expect(code).toContain('midi_to_hz(67.0)');
        expect(code).toContain('midi_to_hz(69.0)');
        expect(code).toContain('midi_to_hz(71.0)');
        expect(code).toContain('midi_to_hz(72.0)');
        expect(code).toContain('sinwave(');
        expect(code).toContain('envelope(metro(');
        expect(order).toBe(Order.ATOMIC);
      });

      it('generates minor scale pattern (8 notes)', () => {
        const [code] = generateBlock({
          type: 'biyo_scale',
          fields: { ROOT: 'A', SCALE_TYPE: 'minor', OCTAVE: '4', SPEED: '120' },
        });
        expect(code).toContain('8.0)');
        expect(code).toContain('midi_to_hz(69.0)');
        expect(code).toContain('midi_to_hz(71.0)');
        expect(code).toContain('midi_to_hz(72.0)');
        expect(code).toContain('midi_to_hz(74.0)');
        expect(code).toContain('midi_to_hz(76.0)');
        expect(code).toContain('midi_to_hz(77.0)');
        expect(code).toContain('midi_to_hz(79.0)');
        expect(code).toContain('midi_to_hz(81.0)');
      });

      it('generates pentatonic scale pattern (6 notes)', () => {
        const [code] = generateBlock({
          type: 'biyo_scale',
          fields: { ROOT: 'C', SCALE_TYPE: 'pentatonic', OCTAVE: '4', SPEED: '120' },
        });
        expect(code).toContain('6.0)');
        expect(code).toContain('midi_to_hz(60.0)');
        expect(code).toContain('midi_to_hz(62.0)');
        expect(code).toContain('midi_to_hz(64.0)');
        expect(code).toContain('midi_to_hz(67.0)');
        expect(code).toContain('midi_to_hz(69.0)');
        expect(code).toContain('midi_to_hz(72.0)');
      });
    });

    describe('biyo_arpeggio', () => {
      it('generates major arpeggio (4 notes)', () => {
        const [code, order] = generateBlock({
          type: 'biyo_arpeggio',
          fields: { ROOT: 'C', TYPE: 'major', SPEED: '120' },
        });
        expect(code).toContain('_arp_idx');
        expect(code).toContain('4.0)');
        expect(code).toContain('midi_to_hz(60.0)');
        expect(code).toContain('midi_to_hz(64.0)');
        expect(code).toContain('midi_to_hz(67.0)');
        expect(code).toContain('midi_to_hz(72.0)');
        expect(code).toContain('sinwave(');
        expect(code).toContain('envelope(metro(');
        expect(order).toBe(Order.ATOMIC);
      });

      it('generates minor arpeggio (4 notes)', () => {
        const [code] = generateBlock({
          type: 'biyo_arpeggio',
          fields: { ROOT: 'A', TYPE: 'minor', SPEED: '120' },
        });
        expect(code).toContain('midi_to_hz(69.0)');
        expect(code).toContain('midi_to_hz(72.0)');
        expect(code).toContain('midi_to_hz(76.0)');
        expect(code).toContain('midi_to_hz(81.0)');
      });

      it('generates 7th arpeggio (4 notes)', () => {
        const [code] = generateBlock({
          type: 'biyo_arpeggio',
          fields: { ROOT: 'G', TYPE: '7th', SPEED: '120' },
        });
        expect(code).toContain('midi_to_hz(67.0)');
        expect(code).toContain('midi_to_hz(71.0)');
        expect(code).toContain('midi_to_hz(74.0)');
        expect(code).toContain('midi_to_hz(77.0)');
      });
    });

    describe('biyo_envelope', () => {
      it('generates envelope-shaped signal', () => {
        const [code, order] = generateBlock({
          type: 'biyo_envelope',
          fields: { ATTACK: '0.05', RELEASE: '0.3' },
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toContain('(sig) * envelope(metro(0.400)');
        expect(code).toContain(', 0.05, 0.3)');
        expect(order).toBe(Order.MULTIPLY);
      });

      it('uses default signal 1.0 when nothing connected', () => {
        const [code] = generateBlock({
          type: 'biyo_envelope',
          fields: { ATTACK: '0.05', RELEASE: '0.3' },
        });
        expect(code).toContain('(1.0)');
      });
    });
  });

  // =======================================================================
  // UTILITY BLOCKS
  // =======================================================================
  describe('utility blocks', () => {
    describe('biyo_mix', () => {
      it('mixes two signals with balance', () => {
        const [code, order] = generateBlock({
          type: 'biyo_mix',
          fields: { BALANCE: '0.5' },
          connectedInputs: { SIGNAL_A: 'sigA', SIGNAL_B: 'sigB' },
        });
        expect(code).toBe('(sigA) * 0.5 + (sigB) * 0.5');
        expect(order).toBe(Order.ADD);
      });

      it('balance 0 = full signal A', () => {
        const [code] = generateBlock({
          type: 'biyo_mix',
          fields: { BALANCE: '0' },
          connectedInputs: { SIGNAL_A: 'sigA', SIGNAL_B: 'sigB' },
        });
        expect(code).toBe('(sigA) * 1 + (sigB) * 0');
      });

      it('balance 1 = full signal B', () => {
        const [code] = generateBlock({
          type: 'biyo_mix',
          fields: { BALANCE: '1' },
          connectedInputs: { SIGNAL_A: 'sigA', SIGNAL_B: 'sigB' },
        });
        expect(code).toBe('(sigA) * 0 + (sigB) * 1');
      });
    });

    describe('biyo_number', () => {
      it('generates a float literal', () => {
        const [code, order] = generateBlock({
          type: 'biyo_number',
          fields: { VALUE: '42' },
        });
        expect(code).toBe('42.0');
        expect(order).toBe(Order.ATOMIC);
      });

      it('uses default value 1 when field is null', () => {
        const [code] = generateBlock({
          type: 'biyo_number',
          fields: {},
        });
        expect(code).toBe('1.0');
      });
    });

    describe('biyo_note', () => {
      it('generates midi_to_hz for a note', () => {
        const [code, order] = generateBlock({
          type: 'biyo_note',
          fields: { NOTE: 'C', OCTAVE: '4' },
        });
        expect(code).toBe('midi_to_hz(60.0)');
        expect(order).toBe(Order.FUNCTION_CALL);
      });
    });

    describe('biyo_chord', () => {
      it('generates major chord (3 sinwaves)', () => {
        const [code, order] = generateBlock({
          type: 'biyo_chord',
          fields: { ROOT: 'C', TYPE: 'major' },
        });
        expect(code).toContain('sinwave(midi_to_hz(60.0), 0.0)');
        expect(code).toContain('sinwave(midi_to_hz(64.0), 0.0)');
        expect(code).toContain('sinwave(midi_to_hz(67.0), 0.0)');
        expect(code).toContain('/ 3.0');
        expect(order).toBe(Order.MULTIPLY);
      });

      it('generates minor chord', () => {
        const [code] = generateBlock({
          type: 'biyo_chord',
          fields: { ROOT: 'A', TYPE: 'minor' },
        });
        expect(code).toContain('sinwave(midi_to_hz(69.0), 0.0)');
        expect(code).toContain('sinwave(midi_to_hz(72.0), 0.0)');
        expect(code).toContain('sinwave(midi_to_hz(76.0), 0.0)');
        expect(code).toContain('/ 3.0');
      });

      it('generates 7th chord (4 sinwaves)', () => {
        const [code] = generateBlock({
          type: 'biyo_chord',
          fields: { ROOT: 'G', TYPE: '7th' },
        });
        expect(code).toContain('sinwave(midi_to_hz(67.0), 0.0)');
        expect(code).toContain('sinwave(midi_to_hz(71.0), 0.0)');
        expect(code).toContain('sinwave(midi_to_hz(74.0), 0.0)');
        expect(code).toContain('sinwave(midi_to_hz(77.0), 0.0)');
        expect(code).toContain('/ 4.0');
      });
    });

    describe('biyo_multiply', () => {
      it('multiplies two signals', () => {
        const [code, order] = generateBlock({
          type: 'biyo_multiply',
          fields: {},
          connectedInputs: { SIGNAL_A: 'sigA', SIGNAL_B: 'sigB' },
        });
        expect(code).toBe('(sigA) * (sigB)');
        expect(order).toBe(Order.MULTIPLY);
      });

      it('uses 1.0 fallback when nothing connected', () => {
        const [code] = generateBlock({
          type: 'biyo_multiply',
          fields: {},
        });
        expect(code).toBe('(1.0) * (1.0)');
      });
    });

    describe('biyo_invert', () => {
      it('negates signal', () => {
        const [code, order] = generateBlock({
          type: 'biyo_invert',
          fields: {},
          connectedInputs: { SIGNAL: 'sig' },
        });
        expect(code).toBe('-(sig)');
        expect(order).toBe(Order.UNARY);
      });

      it('uses 0.0 fallback when nothing connected', () => {
        const [code] = generateBlock({
          type: 'biyo_invert',
          fields: {},
        });
        expect(code).toBe('-(0.0)');
      });
    });
  });

  // =======================================================================
  // PRESET BLOCKS
  // =======================================================================
  describe('preset blocks', () => {
    const presetBlocks = [
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

    for (const type of presetBlocks) {
      it(`${type} produces non-empty code with MULTIPLY order`, () => {
        const [code, order] = generateBlock({ type, fields: {} });
        expect(code).toBeTruthy();
        expect(code.length).toBeGreaterThan(0);
        expect(order).toBe(Order.MULTIPLY);
      });
    }

    it('biyo_robot_voice contains two square oscillators', () => {
      const [code] = generateBlock({ type: 'biyo_robot_voice', fields: {} });
      expect(code).toContain('square(150.0, 0.0)');
      expect(code).toContain('square(153.0, 0.0)');
      expect(code).toContain('sinwave(6.0, 0.0)');
    });

    it('biyo_space contains delay and noise', () => {
      const [code] = generateBlock({ type: 'biyo_space', fields: {} });
      expect(code).toContain('sinwave(200.0');
      expect(code).toContain('_delay(');
      expect(code).toContain('noise()');
    });

    it('biyo_snare combines sinwave and highpass noise', () => {
      const [code] = generateBlock({ type: 'biyo_snare', fields: {} });
      expect(code).toContain('sinwave(200.0, 0.0)');
      expect(code).toContain('highpass(noise(), 2000.0, 1.0)');
    });
  });

  // =======================================================================
  // NOTE / EXTRA BLOCKS
  // =======================================================================
  describe('note / extra blocks', () => {
    describe('biyo_piano_note', () => {
      it('generates piano-like harmonics with envelope', () => {
        const [code, order] = generateBlock({
          type: 'biyo_piano_note',
          fields: { NOTE: 'C', OCTAVE: '4' },
        });
        expect(code).toContain('sinwave(midi_to_hz(60.0), 0.0) * 0.5');
        expect(code).toContain('sinwave(midi_to_hz(60.0) * 2.0, 0.0) * 0.2');
        expect(code).toContain('sinwave(midi_to_hz(60.0) * 3.0, 0.0) * 0.1');
        expect(code).toContain('envelope(metro(');
        expect(order).toBe(Order.MULTIPLY);
      });
    });

    describe('biyo_bpm', () => {
      it('generates metro from BPM', () => {
        const [code, order] = generateBlock({
          type: 'biyo_bpm',
          fields: { BPM: '140' },
        });
        const interval = (60.0 / 140).toFixed(6);
        expect(code).toBe(`metro(${interval})`);
        expect(order).toBe(Order.FUNCTION_CALL);
      });
    });
  });

  // =======================================================================
  // EDGE CASES
  // =======================================================================
  describe('edge cases', () => {
    it('effect block with no connected input produces valid code (fallback 0.0)', () => {
      const [code] = generateBlock({
        type: 'biyo_lowpass',
        fields: { CUTOFF: '500', RESONANCE: '1' },
        connectedInputs: {},
      });
      expect(code).toBe('lowpass(0.0, 500.0, 1)');
    });

    it('deeply nested blocks produce valid code', () => {
      const distortionCode = 'soft_clip((noise()) * 5.0) / 5.0 * 3.0';
      const [code] = generateBlock({
        type: 'biyo_lowpass',
        fields: { CUTOFF: '800', RESONANCE: '2' },
        connectedInputs: { SIGNAL: distortionCode },
      });
      expect(code).toBe(`lowpass(${distortionCode}, 800.0, 2)`);
      expect(code).toContain('soft_clip');
      expect(code).toContain('noise()');
      expect(code).toContain('lowpass(');
    });

    it('empty workspace produces valid DSP with 0.0 output', () => {
      const workspace = createMockWorkspace([]);
      const code = generateMimiumCode(workspace);
      expect(code).toContain(PREAMBLE);
      expect(code).toContain('fn dsp() -> float {');
      expect(code).toContain('0.0');
    });

    it('disabled blocks are excluded from generation', () => {
      const workspace = createMockWorkspace([
        {
          type: 'biyo_noise',
          fields: {},
          enabled: false,
        },
      ]);
      const code = generateMimiumCode(workspace);
      expect(code).toContain('fn dsp() -> float {');
      // The dsp body should be "0.0" (no noise() call in the dsp function)
      const dspMatch = code.match(/fn dsp\(\) -> float \{([^}]+)\}/);
      expect(dspMatch).toBeTruthy();
      expect(dspMatch?.[1].trim()).toBe('0.0');
    });
  });

  // =======================================================================
  // generateMimiumCode (workspace-level)
  // =======================================================================
  describe('generateMimiumCode', () => {
    it('wraps a single top-level block in dsp function', () => {
      const workspace = createMockWorkspace([
        {
          type: 'biyo_noise',
          fields: {},
        },
      ]);
      const code = generateMimiumCode(workspace);
      expect(code).toContain(PREAMBLE);
      expect(code).toContain('fn dsp() -> float {');
      // The dsp body should contain noise() without mixing division
      const dspMatch = code.match(/fn dsp\(\) -> float \{([^}]+)\}/);
      expect(dspMatch).toBeTruthy();
      const dspBody = dspMatch?.[1].trim();
      expect(dspBody).toBe('noise()');
    });

    it('mixes multiple top-level blocks', () => {
      const workspace = createMockWorkspace([
        { type: 'biyo_noise', fields: {} },
        {
          type: 'biyo_sine',
          fields: { NOTE: 'A', OCTAVE: '4' },
        },
      ]);
      const code = generateMimiumCode(workspace);
      // Extract just the dsp function body to check mixing
      const dspMatch = code.match(/fn dsp\(\) -> float \{\n\s+(.+)\n\}/);
      expect(dspMatch).toBeTruthy();
      const dspBody = dspMatch?.[1];
      expect(dspBody).toContain('noise()');
      expect(dspBody).toContain('sinwave(midi_to_hz(69.0), 0.0)');
      expect(dspBody).toContain('/ 2.0');
    });

    it('outputs preamble followed by dsp function', () => {
      const workspace = createMockWorkspace([{ type: 'biyo_noise', fields: {} }]);
      const code = generateMimiumCode(workspace);
      const parts = code.split('\n\n');
      expect(parts[0]).toContain('fn midi_to_hz');
      const lastPart = parts[parts.length - 1];
      expect(lastPart).toContain('fn dsp() -> float {');
    });

    it('handles three top-level blocks by mixing with / 3.0', () => {
      const workspace = createMockWorkspace([
        { type: 'biyo_noise', fields: {} },
        { type: 'biyo_noise', fields: {} },
        { type: 'biyo_noise', fields: {} },
      ]);
      const code = generateMimiumCode(workspace);
      expect(code).toContain('/ 3.0');
    });
  });

  // =======================================================================
  // MIDI conversion correctness
  // =======================================================================
  describe('MIDI note conversion', () => {
    const testCases: Array<{ note: string; octave: string; expectedMidi: number }> = [
      { note: 'C', octave: '0', expectedMidi: 12 },
      { note: 'C', octave: '4', expectedMidi: 60 },
      { note: 'A', octave: '4', expectedMidi: 69 },
      { note: 'C', octave: '5', expectedMidi: 72 },
      { note: 'B', octave: '4', expectedMidi: 71 },
      { note: 'C#', octave: '4', expectedMidi: 61 },
      { note: 'D#', octave: '3', expectedMidi: 51 },
      { note: 'G#', octave: '5', expectedMidi: 80 },
      { note: 'A#', octave: '4', expectedMidi: 70 },
    ];

    for (const { note, octave, expectedMidi } of testCases) {
      it(`${note}${octave} = MIDI ${expectedMidi}`, () => {
        const [code] = generateBlock({
          type: 'biyo_sine',
          fields: { NOTE: note, OCTAVE: octave },
        });
        expect(code).toBe(`sinwave(midi_to_hz(${expectedMidi}.0), 0.0)`);
      });
    }
  });
});
