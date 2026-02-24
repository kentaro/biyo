import * as Blockly from 'blockly';

// --- Order of operations (precedence) ---
const Order = {
  ATOMIC: 0,
  FUNCTION_CALL: 1,
  UNARY: 2,
  MULTIPLY: 3,
  ADD: 4,
  NONE: 99,
};

// --- Preamble: mimium helper functions ---
const PREAMBLE = `
// --- biyo preamble ---
fn midi_to_hz(note) {
  440.0 * pow(2.0, (note - 69.0) / 12.0)
}

fn sinwave(freq, phase) {
  sin(2.0 * 3.14159265 * freq * (now / samplerate) + phase)
}

fn saw(freq, phase) {
  let t = fmod(freq * (now / samplerate) + phase, 1.0);
  t * 2.0 - 1.0
}

fn triangle(freq, phase) {
  let t = fmod(freq * (now / samplerate) + phase, 1.0);
  if t < 0.5 { t * 4.0 - 1.0 } else { 3.0 - t * 4.0 }
}

fn square(freq, phase) {
  let t = fmod(freq * (now / samplerate) + phase, 1.0);
  if t < 0.5 { 1.0 } else { -1.0 }
}

fn noise() {
  random() * 2.0 - 1.0
}

fn lowpass(input, freq, q) {
  let _q = if q < 0.1 { 0.1 } else { q };
  let w0 = 2.0 * 3.14159265 * freq / samplerate;
  let alpha = sin(w0) / (2.0 * _q);
  let b0 = (1.0 - cos(w0)) / 2.0;
  let b1 = 1.0 - cos(w0);
  let b2 = (1.0 - cos(w0)) / 2.0;
  let a0 = 1.0 + alpha;
  let a1 = -2.0 * cos(w0);
  let a2 = 1.0 - alpha;
  (b0/a0) * input
}

fn highpass(input, freq, q) {
  let _q = if q < 0.1 { 0.1 } else { q };
  let w0 = 2.0 * 3.14159265 * freq / samplerate;
  let alpha = sin(w0) / (2.0 * _q);
  let b0 = (1.0 + cos(w0)) / 2.0;
  let a0 = 1.0 + alpha;
  (b0/a0) * input
}

fn bandpass(input, freq, q) {
  let _q = if q < 0.1 { 0.1 } else { q };
  let w0 = 2.0 * 3.14159265 * freq / samplerate;
  let alpha = sin(w0) / (2.0 * _q);
  let b0 = alpha;
  let a0 = 1.0 + alpha;
  (b0/a0) * input
}

fn metro(interval) {
  let phase = fmod(now / samplerate, interval);
  if phase < (1.0 / samplerate) { 1.0 } else { 0.0 }
}

fn _delay(input, time) {
  let samples = time * samplerate;
  delay(input, samples)
}

fn envelope(trigger, attack, release) {
  let _atk = if attack < 0.0001 { 0.0001 } else { attack };
  let _rel = if release < 0.0001 { 0.0001 } else { release };
  let t = fmod(now / samplerate, _atk + _rel);
  if t < _atk { t / _atk } else { 1.0 - (t - _atk) / _rel }
}

fn clamp(x, lo, hi) {
  if x < lo { lo } else { if x > hi { hi } else { x } }
}

fn soft_clip(x) {
  let t = clamp(x, -1.0, 1.0);
  t * (1.5 - 0.5 * t * t)
}

fn microphone() {
  0.0
}
`.trim();

// --- Create the generator ---
const mimiumGenerator = new Blockly.CodeGenerator('Mimium');

// --- Helper: get connected signal code ---
function getSignalCode(
  block: Blockly.Block,
  inputName: string,
  generator: Blockly.CodeGenerator,
  fallback: string = '0.0',
): string {
  const code = generator.valueToCode(block, inputName, Order.NONE);
  return code || fallback;
}

// Map note name (C, C#, D, ...) + octave to MIDI note number
function noteToMidi(noteName: string, octave: number): number {
  const noteMap: Record<string, number> = {
    C: 0,
    'C#': 1,
    D: 2,
    'D#': 3,
    E: 4,
    F: 5,
    'F#': 6,
    G: 7,
    'G#': 8,
    A: 9,
    'A#': 10,
    B: 11,
  };
  return (noteMap[noteName] ?? 0) + (octave + 1) * 12;
}

// Convert dropdown note value like "C4", "A3" to MIDI number
function _noteDropdownToMidi(noteStr: string): number {
  const match = noteStr.match(/^([A-G]#?)(\d)$/);
  if (!match) return 69; // fallback to A4
  const noteName = match[1];
  const octave = parseInt(match[2], 10);
  return noteToMidi(noteName, octave);
}

// =========================================================
// SOURCE BLOCKS
// =========================================================

mimiumGenerator.forBlock.biyo_sine = (block: Blockly.Block, _generator: Blockly.CodeGenerator) => {
  const noteName = String(block.getFieldValue('NOTE') ?? 'A');
  const octave = parseInt(String(block.getFieldValue('OCTAVE') ?? '4'), 10);
  const midi = noteToMidi(noteName, octave);
  return [`sinwave(midi_to_hz(${midi}.0), 0.0)`, Order.FUNCTION_CALL];
};

mimiumGenerator.forBlock.biyo_saw = (block: Blockly.Block, _generator: Blockly.CodeGenerator) => {
  const noteName = String(block.getFieldValue('NOTE') ?? 'A');
  const octave = parseInt(String(block.getFieldValue('OCTAVE') ?? '4'), 10);
  const midi = noteToMidi(noteName, octave);
  return [`saw(midi_to_hz(${midi}.0), 0.0)`, Order.FUNCTION_CALL];
};

mimiumGenerator.forBlock.biyo_triangle = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const noteName = String(block.getFieldValue('NOTE') ?? 'A');
  const octave = parseInt(String(block.getFieldValue('OCTAVE') ?? '4'), 10);
  const midi = noteToMidi(noteName, octave);
  return [`triangle(midi_to_hz(${midi}.0), 0.0)`, Order.FUNCTION_CALL];
};

mimiumGenerator.forBlock.biyo_square = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const noteName = String(block.getFieldValue('NOTE') ?? 'A');
  const octave = parseInt(String(block.getFieldValue('OCTAVE') ?? '4'), 10);
  const midi = noteToMidi(noteName, octave);
  return [`square(midi_to_hz(${midi}.0), 0.0)`, Order.FUNCTION_CALL];
};

mimiumGenerator.forBlock.biyo_noise = (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => ['noise()', Order.FUNCTION_CALL];

mimiumGenerator.forBlock.biyo_microphone = (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => ['microphone()', Order.FUNCTION_CALL];

mimiumGenerator.forBlock.biyo_filtered_noise = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const brightness = block.getFieldValue('BRIGHTNESS') ?? '2000';
  return [`lowpass(noise(), ${parseFloat(String(brightness))}.0, 0.707)`, Order.FUNCTION_CALL];
};

mimiumGenerator.forBlock.biyo_detune_saw = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const noteName = String(block.getFieldValue('NOTE') ?? 'A');
  const octave = parseInt(String(block.getFieldValue('OCTAVE') ?? '4'), 10);
  const midi = noteToMidi(noteName, octave);
  const detune = parseFloat(String(block.getFieldValue('DETUNE') ?? '1'));
  const code = `(saw(midi_to_hz(${midi}.0), 0.0) + saw(midi_to_hz(${midi}.0) + ${detune}, 0.33) + saw(midi_to_hz(${midi}.0) - ${detune}, 0.66)) / 3.0`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_kick = (block: Blockly.Block, _generator: Blockly.CodeGenerator) => {
  const freq = parseFloat(String(block.getFieldValue('FREQ') ?? '60'));
  const code = `sinwave(${freq}.0 * (1.0 + envelope(metro(0.5), 0.001, 0.15) * 4.0), 0.0) * envelope(metro(0.5), 0.001, 0.2)`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_hihat = (block: Blockly.Block, _generator: Blockly.CodeGenerator) => {
  const length = parseFloat(String(block.getFieldValue('LENGTH') ?? '0.05'));
  const code = `highpass(noise(), 8000.0, 1.0) * envelope(metro(0.25), 0.001, ${length})`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_pluck = (block: Blockly.Block, _generator: Blockly.CodeGenerator) => {
  const noteName = String(block.getFieldValue('NOTE') ?? 'A');
  const octave = parseInt(String(block.getFieldValue('OCTAVE') ?? '4'), 10);
  const midi = noteToMidi(noteName, octave);
  const sustain = parseFloat(String(block.getFieldValue('SUSTAIN') ?? '0.5'));
  const code = `(sinwave(midi_to_hz(${midi}.0), 0.0) * 0.5 + triangle(midi_to_hz(${midi}.0) * 2.0, 0.0) * 0.3 + noise() * 0.2) * envelope(metro(${(sustain + 0.1).toFixed(3)}), 0.001, ${sustain})`;
  return [code, Order.MULTIPLY];
};

// =========================================================
// EFFECT BLOCKS
// =========================================================

mimiumGenerator.forBlock.biyo_lowpass = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const cutoff = Math.max(
    20,
    Math.min(20000, parseFloat(String(block.getFieldValue('CUTOFF') ?? '1000'))),
  );
  const resonance = Math.max(
    0.1,
    Math.min(20, parseFloat(String(block.getFieldValue('RESONANCE') ?? '1'))),
  );
  return [`lowpass(${signal}, ${cutoff}.0, ${resonance})`, Order.FUNCTION_CALL];
};

mimiumGenerator.forBlock.biyo_highpass = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const cutoff = Math.max(
    20,
    Math.min(20000, parseFloat(String(block.getFieldValue('CUTOFF') ?? '1000'))),
  );
  const resonance = Math.max(
    0.1,
    Math.min(20, parseFloat(String(block.getFieldValue('RESONANCE') ?? '1'))),
  );
  return [`highpass(${signal}, ${cutoff}.0, ${resonance})`, Order.FUNCTION_CALL];
};

mimiumGenerator.forBlock.biyo_bandpass = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const center = Math.max(
    20,
    Math.min(20000, parseFloat(String(block.getFieldValue('CENTER') ?? '1000'))),
  );
  const width = parseFloat(String(block.getFieldValue('WIDTH') ?? '500'));
  const q = Math.min(20, Math.max(0.1, center / Math.max(1, width)));
  return [`bandpass(${signal}, ${center}.0, ${q.toFixed(2)})`, Order.FUNCTION_CALL];
};

mimiumGenerator.forBlock.biyo_delay = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const time = Math.max(
    0.001,
    Math.min(2.0, parseFloat(String(block.getFieldValue('TIME') ?? '0.3'))),
  );
  const mix = Math.max(0, Math.min(1.0, parseFloat(String(block.getFieldValue('MIX') ?? '0.5'))));
  const code = `(${signal}) * ${1.0 - mix} + _delay(${signal}, ${time}) * ${mix}`;
  return [code, Order.ADD];
};

mimiumGenerator.forBlock.biyo_reverb = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const size = Math.max(0, Math.min(1.0, parseFloat(String(block.getFieldValue('SIZE') ?? '0.6'))));
  const mix = Math.max(0, Math.min(0.8, parseFloat(String(block.getFieldValue('MIX') ?? '0.3'))));
  const d1 = (0.03 * size + 0.01).toFixed(4);
  const d2 = (0.05 * size + 0.02).toFixed(4);
  const d3 = (0.07 * size + 0.03).toFixed(4);
  const d4 = (0.11 * size + 0.04).toFixed(4);
  // Use let binding to cache signal and prevent exponential code growth on nested reverbs
  const safeId = block.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) || '0000';
  const varName = `_rv${safeId}`;
  const code = `(let ${varName} = ${signal}; ${varName} * ${(1.0 - mix).toFixed(3)} + (_delay(${varName}, ${d1}) + _delay(${varName}, ${d2}) + _delay(${varName}, ${d3}) + _delay(${varName}, ${d4})) * ${(mix / 4).toFixed(3)})`;
  return [code, Order.ADD];
};

mimiumGenerator.forBlock.biyo_tremolo = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const speed = Math.max(
    0.1,
    Math.min(30, parseFloat(String(block.getFieldValue('SPEED') ?? '5'))),
  );
  const depth = Math.max(
    0,
    Math.min(1.0, parseFloat(String(block.getFieldValue('DEPTH') ?? '0.5'))),
  );
  const code = `(${signal}) * (1.0 - ${depth} * 0.5 + ${depth} * 0.5 * sinwave(${speed}.0, 0.0))`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_autowah = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const speed = Math.max(
    0.1,
    Math.min(20, parseFloat(String(block.getFieldValue('SPEED') ?? '2'))),
  );
  const depth = Math.max(
    0,
    Math.min(1.0, parseFloat(String(block.getFieldValue('DEPTH') ?? '0.5'))),
  );
  const baseFreq = 500;
  const range = 3000;
  const code = `lowpass(${signal}, ${baseFreq}.0 + ${range}.0 * ${depth} * (0.5 + 0.5 * sinwave(${speed}.0, 0.0)), 2.0)`;
  return [code, Order.FUNCTION_CALL];
};

mimiumGenerator.forBlock.biyo_vibrato = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const speed = Math.max(
    0.1,
    Math.min(30, parseFloat(String(block.getFieldValue('SPEED') ?? '5'))),
  );
  const depth = Math.max(
    0,
    Math.min(1.0, parseFloat(String(block.getFieldValue('DEPTH') ?? '0.3'))),
  );
  const baseDelay = (depth * 0.002 + 0.001).toFixed(6); // offset so delay never reaches 0
  const modAmt = (depth * 0.002).toFixed(6);
  const code = `_delay(${signal}, ${baseDelay} + ${modAmt} * sinwave(${speed}.0, 0.0))`;
  return [code, Order.FUNCTION_CALL];
};

mimiumGenerator.forBlock.biyo_distortion = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const drive = Math.max(1, Math.min(50, parseFloat(String(block.getFieldValue('DRIVE') ?? '5'))));
  // Normalize output: soft_clip output is [-1,1], divide by drive then scale.
  // Cap output gain so even at low drive the result stays within [-1, 1].
  const outputGain = Math.min(1.0, 3.0 / drive);
  const code = `soft_clip((${signal}) * ${drive}.0) * ${outputGain.toFixed(3)}`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_gain_up = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const gain = Math.max(
    1.0,
    Math.min(3.0, parseFloat(String(block.getFieldValue('GAIN') ?? '1.5'))),
  );
  return [`(${signal}) * ${gain}`, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_gain_down = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const amount = Math.max(
    0,
    Math.min(1.0, parseFloat(String(block.getFieldValue('AMOUNT') ?? '0.5'))),
  );
  return [`(${signal}) * ${amount}`, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_telephone = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const code = `bandpass(soft_clip((${signal}) * 4.0), 1200.0, 3.0) * 0.5`;
  return [code, Order.MULTIPLY];
};

// =========================================================
// RHYTHM BLOCKS
// =========================================================

mimiumGenerator.forBlock.biyo_metro = (block: Blockly.Block, _generator: Blockly.CodeGenerator) => {
  const bpm = parseFloat(String(block.getFieldValue('BPM') ?? '120'));
  const interval = (60.0 / bpm).toFixed(6);
  const code = `sinwave(800.0, 0.0) * envelope(metro(${interval}), 0.001, 0.05)`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_sequencer = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const bpm = parseFloat(String(block.getFieldValue('BPM') ?? '120'));
  const speed = (60.0 / bpm).toFixed(6);
  const note1 = parseFloat(String(block.getFieldValue('NOTE1') ?? '60'));
  const note2 = parseFloat(String(block.getFieldValue('NOTE2') ?? '64'));
  const note3 = parseFloat(String(block.getFieldValue('NOTE3') ?? '67'));
  const note4 = parseFloat(String(block.getFieldValue('NOTE4') ?? '72'));
  const notes = [note1, note2, note3, note4];
  const n = notes.length;
  const code = `(
    let _step_idx = floor(fmod(now / samplerate / ${speed}, ${n}.0));
    let _seq_freq = ${notes
      .map((midi: number, i: number) => `if _step_idx == ${i}.0 { midi_to_hz(${midi}.0) } else {`)
      .join(' ')} 0.0 ${notes.map(() => '}').join(' ')};
    triangle(_seq_freq, 0.0) * envelope(metro(${speed}), 0.01, ${(parseFloat(speed) * 0.8).toFixed(4)})
  )`;
  return [code, Order.ATOMIC];
};

mimiumGenerator.forBlock.biyo_melody = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const bpm = parseFloat(String(block.getFieldValue('BPM') ?? '120'));
  const octave = parseInt(String(block.getFieldValue('OCTAVE') ?? '4'), 10);
  const speed = (60.0 / bpm).toFixed(6);
  const stepCount = 8;
  const noteFields: { noteName: string; midi: number }[] = [];
  for (let i = 1; i <= stepCount; i++) {
    const noteName = String(block.getFieldValue(`NOTE${i}`) ?? 'C');
    if (noteName === 'REST') {
      noteFields.push({ noteName: 'REST', midi: 0 });
    } else {
      noteFields.push({ noteName, midi: noteToMidi(noteName, octave) });
    }
  }
  // Generate a melody that actually produces sound (triangle wave per note)
  const code = `(
    let _mel_idx = floor(fmod(now / samplerate / ${speed}, ${stepCount}.0));
    let _mel_freq = ${noteFields
      .map(
        (n, i) =>
          `if _mel_idx == ${i}.0 { ${n.noteName === 'REST' ? '0.0' : `midi_to_hz(${n.midi}.0)`} } else {`,
      )
      .join(' ')} 0.0 ${noteFields.map(() => '}').join(' ')};
    if _mel_freq < 1.0 { 0.0 } else { triangle(_mel_freq, 0.0) * envelope(metro(${speed}), 0.01, ${(parseFloat(speed) * 0.8).toFixed(4)}) }
  )`;
  return [code, Order.ATOMIC];
};

mimiumGenerator.forBlock.biyo_drum_pattern = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const bpm = parseFloat(String(block.getFieldValue('BPM') ?? '120'));
  const speed = (60.0 / bpm / 2).toFixed(6);
  const pattern = block.getFieldValue('PATTERN') ?? 'rock';

  const patterns: Record<string, string> = {
    rock: 'x...x...x...x...',
    techno: 'x.x.x.x.x.x.x.x.',
    jazz: 'x..x..x..x..',
    samba: 'x.xx.xx.x.xx.xx.',
  };
  const patStr = patterns[String(pattern)] ?? patterns.rock;
  const n = patStr.length;
  // Generate actual drum sounds: kick (sine pitch envelope) + hihat (noise burst)
  const code = `(
    let _dp_idx = floor(fmod(now / samplerate / ${speed}, ${n}.0));
    let _dp_trig = ${patStr
      .split('')
      .map(
        (ch: string, i: number) =>
          `if _dp_idx == ${i}.0 { ${ch === 'x' || ch === 'X' ? '1.0' : '0.0'} } else {`,
      )
      .join(' ')} 0.0 ${patStr
      .split('')
      .map(() => '}')
      .join(' ')};
    let _dp_env = envelope(metro(${speed}), 0.001, ${(parseFloat(speed) * 0.5).toFixed(4)});
    _dp_trig * (sinwave(60.0, 0.0) * _dp_env * 0.7 + noise() * _dp_env * _dp_env * 0.3)
  )`;
  return [code, Order.ATOMIC];
};

mimiumGenerator.forBlock.biyo_envelope = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator, '1.0');
  const attack = parseFloat(String(block.getFieldValue('ATTACK') ?? '0.05'));
  const release = parseFloat(String(block.getFieldValue('RELEASE') ?? '0.3'));
  const code = `(${signal}) * envelope(metro(${(attack + release + 0.05).toFixed(3)}), ${attack}, ${release})`;
  return [code, Order.MULTIPLY];
};

// =========================================================
// UTILITY BLOCKS
// =========================================================

mimiumGenerator.forBlock.biyo_mix = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
  const a = getSignalCode(block, 'SIGNAL_A', generator);
  const b = getSignalCode(block, 'SIGNAL_B', generator);
  const balance = parseFloat(String(block.getFieldValue('BALANCE') ?? '0.5'));
  return [`(${a}) * ${1.0 - balance} + (${b}) * ${balance}`, Order.ADD];
};

mimiumGenerator.forBlock.biyo_number = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const num = block.getFieldValue('VALUE') ?? 1;
  return [`${num}.0`, Order.ATOMIC];
};

mimiumGenerator.forBlock.biyo_note = (block: Blockly.Block, _generator: Blockly.CodeGenerator) => {
  const noteName = block.getFieldValue('NOTE') ?? 'C';
  const octave = parseFloat(String(block.getFieldValue('OCTAVE') ?? '4'));
  const midi = noteToMidi(String(noteName), Number(octave));
  return [`sinwave(midi_to_hz(${midi}.0), 0.0)`, Order.FUNCTION_CALL];
};

mimiumGenerator.forBlock.biyo_chord = (block: Blockly.Block, _generator: Blockly.CodeGenerator) => {
  const rootName = block.getFieldValue('ROOT') ?? 'C';
  const chordType = block.getFieldValue('TYPE') ?? 'major';
  const rootMidi = noteToMidi(String(rootName), 4);

  let intervals: number[];
  switch (chordType) {
    case 'minor':
      intervals = [0, 3, 7];
      break;
    case '7th':
      intervals = [0, 4, 7, 10];
      break;
    default:
      intervals = [0, 4, 7];
      break;
  }
  const n = intervals.length;
  const sum = intervals.map((i) => `sinwave(midi_to_hz(${rootMidi + i}.0), 0.0)`).join(' + ');
  return [`(${sum}) / ${n}.0`, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_multiply = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const a = getSignalCode(block, 'SIGNAL_A', generator, '1.0');
  const b = getSignalCode(block, 'SIGNAL_B', generator, '1.0');
  return [`(${a}) * (${b})`, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_invert = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  return [`-(${signal})`, Order.UNARY];
};

mimiumGenerator.forBlock.biyo_scale = (block: Blockly.Block, _generator: Blockly.CodeGenerator) => {
  const rootName = String(block.getFieldValue('ROOT') ?? 'C');
  const scaleType = String(block.getFieldValue('SCALE_TYPE') ?? 'major');
  const octave = parseInt(String(block.getFieldValue('OCTAVE') ?? '4'), 10);
  const bpm = parseFloat(String(block.getFieldValue('SPEED') ?? '120'));
  const rootMidi = noteToMidi(rootName, octave);

  let intervals: number[];
  switch (scaleType) {
    case 'minor':
      intervals = [0, 2, 3, 5, 7, 8, 10, 12];
      break;
    case 'pentatonic':
      intervals = [0, 2, 4, 7, 9, 12];
      break;
    default:
      intervals = [0, 2, 4, 5, 7, 9, 11, 12];
      break;
  }

  const notes = intervals.map((i) => rootMidi + i);
  const n = notes.length;
  const speed = (60.0 / bpm).toFixed(6);

  const code = `(
    let _scale_idx = floor(fmod(now / samplerate / ${speed}, ${n}.0));
    ${notes
      .map(
        (midi: number, i: number) =>
          `if _scale_idx == ${i}.0 { sinwave(midi_to_hz(${midi}.0), 0.0) * envelope(metro(${speed}), 0.01, ${((60.0 / bpm) * 0.8).toFixed(4)}) } else {`,
      )
      .join(' ')} 0.0 ${notes.map(() => '}').join(' ')}
  )`;
  return [code, Order.ATOMIC];
};

mimiumGenerator.forBlock.biyo_arpeggio = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const rootName = String(block.getFieldValue('ROOT') ?? 'C');
  const chordType = String(block.getFieldValue('TYPE') ?? 'major');
  const bpm = parseFloat(String(block.getFieldValue('SPEED') ?? '120'));
  const rootMidi = noteToMidi(rootName, 4);

  let intervals: number[];
  switch (chordType) {
    case 'minor':
      intervals = [0, 3, 7, 12];
      break;
    case '7th':
      intervals = [0, 4, 7, 10];
      break;
    default:
      intervals = [0, 4, 7, 12];
      break;
  }

  const notes = intervals.map((i) => rootMidi + i);
  const n = notes.length;
  const speed = (60.0 / bpm).toFixed(6);

  const code = `(
    let _arp_idx = floor(fmod(now / samplerate / ${speed}, ${n}.0));
    ${notes
      .map(
        (midi: number, i: number) =>
          `if _arp_idx == ${i}.0 { sinwave(midi_to_hz(${midi}.0), 0.0) * envelope(metro(${speed}), 0.01, ${((60.0 / bpm) * 0.8).toFixed(4)}) } else {`,
      )
      .join(' ')} 0.0 ${notes.map(() => '}').join(' ')}
  )`;
  return [code, Order.ATOMIC];
};

// =========================================================
// PRESET BLOCKS
// =========================================================

mimiumGenerator.forBlock.biyo_robot_voice = (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  // Vowel formant synthesis: bandpass-filtered saw wave at formant frequencies
  // Cycles between "ah" (730/1090/2440) and "ee" (270/2290/3010) formants
  const code = `(let _rv_src = saw(120.0, 0.0); let _rv_lfo = 0.5 + 0.5 * sinwave(2.0, 0.0); bandpass(_rv_src, 730.0 * _rv_lfo + 270.0 * (1.0 - _rv_lfo), 5.0) * 0.4 + bandpass(_rv_src, 1090.0 * _rv_lfo + 2290.0 * (1.0 - _rv_lfo), 5.0) * 0.3 + bandpass(_rv_src, 2440.0 * _rv_lfo + 3010.0 * (1.0 - _rv_lfo), 5.0) * 0.2)`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_space = (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const code = `(sinwave(200.0 + sinwave(0.1, 0.0) * 100.0, 0.0) * 0.3 + _delay(sinwave(300.0 + sinwave(0.07, 0.0) * 150.0, 0.0), 0.3) * 0.2 + noise() * 0.05) * 0.6`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_water_drop = (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const code = `sinwave(800.0 + envelope(metro(0.4), 0.001, 0.1) * 1200.0, 0.0) * envelope(metro(0.4), 0.001, 0.08) * 0.6`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_ghost = (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const code = `lowpass(noise() * 0.3 + sinwave(300.0 + sinwave(2.0, 0.0) * 200.0, 0.0) * 0.5, 800.0 + sinwave(0.5, 0.0) * 400.0, 1.0) * (0.4 + 0.3 * sinwave(0.3, 0.0))`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_siren = (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const code = `sinwave(600.0 + sinwave(2.0, 0.0) * 400.0, 0.0) * 0.5`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_laser = (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const code = `sinwave(3000.0 * envelope(metro(0.3), 0.001, 0.15), 0.0) * envelope(metro(0.3), 0.001, 0.1) * 0.5`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_ufo = (_block: Blockly.Block, _generator: Blockly.CodeGenerator) => {
  const code = `(sinwave(400.0 + sinwave(3.0, 0.0) * 300.0, 0.0) * 0.3 + sinwave(401.0 + sinwave(3.1, 0.0) * 301.0, 0.0) * 0.3) * (0.5 + 0.3 * sinwave(0.5, 0.0))`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_bubbles = (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const code = `sinwave(200.0 + envelope(metro(0.15), 0.001, 0.08) * 600.0, 0.0) * envelope(metro(0.15), 0.001, 0.06) * 0.4`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_thunder = (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const code = `lowpass(noise(), 200.0 + envelope(metro(3.0), 0.01, 1.5) * 800.0, 0.5) * envelope(metro(3.0), 0.05, 2.0) * 0.7`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_famicom = (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  // 8-bit arpeggio: rapidly cycles through C-E-G-C chord tones (square wave)
  // Speed = 0.08s per step (12.5 Hz arpeggio rate, classic NES style)
  const code = `(let _fc_idx = floor(fmod(now / samplerate / 0.08, 4.0)); let _fc_freq = if _fc_idx == 0.0 { 523.0 } else { if _fc_idx == 1.0 { 659.0 } else { if _fc_idx == 2.0 { 784.0 } else { 1047.0 } } }; square(_fc_freq, 0.0) * 0.4)`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_clap = (_block: Blockly.Block, _generator: Blockly.CodeGenerator) => {
  const code = `bandpass(noise(), 1200.0, 2.0) * envelope(metro(0.5), 0.001, 0.08) * 0.6`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_snare = (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const code = `(sinwave(200.0, 0.0) * envelope(metro(0.5), 0.001, 0.05) * 0.4 + highpass(noise(), 2000.0, 1.0) * envelope(metro(0.5), 0.001, 0.1) * 0.5) * 0.7`;
  return [code, Order.MULTIPLY];
};

// =========================================================
// NOTE / EXTRA BLOCKS
// =========================================================

mimiumGenerator.forBlock.biyo_piano_note = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const noteName = block.getFieldValue('NOTE') ?? 'C';
  const octave = parseFloat(String(block.getFieldValue('OCTAVE') ?? '4'));
  const midi = noteToMidi(String(noteName), Number(octave));
  const duration = 0.5;
  const code = `(sinwave(midi_to_hz(${midi}.0), 0.0) * 0.5 + sinwave(midi_to_hz(${midi}.0) * 2.0, 0.0) * 0.2 + sinwave(midi_to_hz(${midi}.0) * 3.0, 0.0) * 0.1) * envelope(metro(${duration + 0.1}), 0.01, ${duration})`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_bpm = (block: Blockly.Block, _generator: Blockly.CodeGenerator) => {
  const bpm = parseFloat(String(block.getFieldValue('BPM') ?? '120'));
  const beatInterval = (60.0 / bpm).toFixed(6);
  const code = `sinwave(800.0, 0.0) * envelope(metro(${beatInterval}), 0.001, 0.05)`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_pingpong = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const time = Math.max(
    0.01,
    Math.min(2.0, parseFloat(String(block.getFieldValue('TIME') ?? '0.25'))),
  );
  const feedback = Math.max(
    0,
    Math.min(0.9, parseFloat(String(block.getFieldValue('FEEDBACK') ?? '0.4'))),
  );
  // Normalize so total gain never exceeds 1.0
  const tap1 = 0.5;
  const tap2 = feedback * 0.5;
  const tap3 = feedback * feedback * 0.3;
  const totalGain = tap1 + tap2 + tap3;
  const norm = totalGain > 1.0 ? 1.0 / totalGain : 1.0;
  const code = `((${signal}) * ${(tap1 * norm).toFixed(3)} + _delay(${signal}, ${time}) * ${(tap2 * norm).toFixed(3)} + _delay(${signal}, ${time * 2}) * ${(tap3 * norm).toFixed(3)})`;
  return [code, Order.ADD];
};

mimiumGenerator.forBlock.biyo_passthrough = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  return [signal, Order.ATOMIC];
};

// =========================================================
// GENERATIVE BLOCKS
// =========================================================

/**
 * Bjorklund's algorithm: distributes `hits` pulses evenly across `steps`.
 * Returns a boolean array of length `steps`.
 * Academically significant: Euclidean rhythms generated by this algorithm
 * represent many traditional world music patterns (e.g., Cuban tresillo,
 * West African bell patterns, Turkish aksak).
 */
function bjorklund(hits: number, steps: number): boolean[] {
  if (hits >= steps) return Array(steps).fill(true);
  if (hits <= 0) return Array(steps).fill(false);

  let pattern: number[][] = [];
  let remainder: number[][] = [];

  for (let i = 0; i < hits; i++) pattern.push([1]);
  for (let i = 0; i < steps - hits; i++) remainder.push([0]);

  while (remainder.length > 1) {
    const newPattern: number[][] = [];
    const minLen = Math.min(pattern.length, remainder.length);
    for (let i = 0; i < minLen; i++) {
      newPattern.push([...pattern[i], ...remainder[i]]);
    }
    const leftoverPattern = pattern.slice(minLen);
    const leftoverRemainder = remainder.slice(minLen);
    pattern = newPattern;
    remainder = leftoverPattern.length > 0 ? leftoverPattern : leftoverRemainder;
  }

  if (remainder.length > 0) {
    pattern.push(...remainder);
  }

  return pattern.flat().map((v) => v === 1);
}

mimiumGenerator.forBlock.biyo_random_melody = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const scaleType = String(block.getFieldValue('SCALE') ?? 'major');
  const bpm = parseFloat(String(block.getFieldValue('BPM') ?? '120'));
  const octave = parseInt(String(block.getFieldValue('OCTAVE') ?? '4'), 10);
  const speed = (60.0 / bpm).toFixed(6);

  // Scale intervals relative to root C
  let intervals: number[];
  switch (scaleType) {
    case 'minor':
      intervals = [0, 2, 3, 5, 7, 8, 10];
      break;
    case 'pentatonic':
      intervals = [0, 2, 4, 7, 9];
      break;
    default:
      intervals = [0, 2, 4, 5, 7, 9, 11];
      break;
  }

  // MIDI notes for the scale in the chosen octave (root = C)
  const rootMidi = noteToMidi('C', octave);
  const notes = intervals.map((i) => rootMidi + i);
  const n = notes.length;

  // Use a deterministic hash of the beat index to pseudo-randomly select scale degrees.
  // sin(beat * 12.9898 + 78.233) * 43758.5453 is a classic GPU hash function,
  // combined with floor() to quantize to scale indices.
  const code = `(
    let _rm_beat = floor(now / samplerate / ${speed});
    let _rm_idx = floor(fmod(abs(sin(_rm_beat * 12.9898 + 78.233) * 43758.5453), ${n}.0));
    ${notes
      .map(
        (midi: number, i: number) =>
          `if _rm_idx == ${i}.0 { sinwave(midi_to_hz(${midi}.0), 0.0) * envelope(metro(${speed}), 0.01, ${((60.0 / bpm) * 0.8).toFixed(4)}) } else {`,
      )
      .join(' ')} 0.0 ${notes.map(() => '}').join(' ')}
  )`;
  return [code, Order.ATOMIC];
};

mimiumGenerator.forBlock.biyo_euclidean = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const hits = parseInt(String(block.getFieldValue('HITS') ?? '3'), 10);
  const steps = parseInt(String(block.getFieldValue('STEPS') ?? '8'), 10);
  const bpm = parseFloat(String(block.getFieldValue('BPM') ?? '120'));

  // Compute the Euclidean pattern at code generation time using Bjorklund's algorithm
  const pattern = bjorklund(hits, steps);
  const stepDuration = (60.0 / bpm / 2).toFixed(6); // eighth-note grid

  const code = `(
    let _eu_idx = floor(fmod(now / samplerate / ${stepDuration}, ${steps}.0));
    let _eu_trig = ${pattern
      .map((hit: boolean, i: number) => `if _eu_idx == ${i}.0 { ${hit ? '1.0' : '0.0'} } else {`)
      .join(' ')} 0.0 ${pattern.map(() => '}').join(' ')};
    let _eu_env = envelope(metro(${stepDuration}), 0.001, ${(parseFloat(stepDuration) * 0.5).toFixed(4)});
    _eu_trig * (sinwave(60.0, 0.0) * _eu_env * 0.7 + noise() * _eu_env * _eu_env * 0.3)
  )`;
  return [code, Order.ATOMIC];
};

mimiumGenerator.forBlock.biyo_lfo_random = (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) => {
  const speed = parseFloat(String(block.getFieldValue('SPEED') ?? '2'));
  const range = parseFloat(String(block.getFieldValue('RANGE') ?? '0.5'));

  // Smooth random walk using summed sine waves at incommensurate (irrational ratio)
  // frequencies, multiplied with a triangle wave to produce audible sound.
  // The modulation signal (0-range) shapes the amplitude of a 220Hz triangle wave.
  const code = `triangle(220.0, 0.0) * (${range} * (0.5 + 0.5 * (sin(2.0 * 3.14159265 * ${speed} * (now / samplerate) * 1.0) * 0.3 + sin(2.0 * 3.14159265 * ${speed} * (now / samplerate) * 1.7321) * 0.25 + sin(2.0 * 3.14159265 * ${speed} * (now / samplerate) * 2.2361) * 0.2 + sin(2.0 * 3.14159265 * ${speed} * (now / samplerate) * 0.5774) * 0.25)))`;
  return [code, Order.MULTIPLY];
};

mimiumGenerator.forBlock.biyo_probability = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => {
  const signal = getSignalCode(block, 'SIGNAL', generator);
  const chance = parseInt(String(block.getFieldValue('CHANCE') ?? '50'), 10);
  const threshold = (chance / 100).toFixed(4);

  // Probabilistic gate: uses a hash function on a coarse time index (floor(now/1024))
  // to produce a stable pseudo-random decision per ~23ms window at 44.1kHz.
  // The signal passes through only when the hash value falls below the threshold.
  const code = `(${signal}) * (if fmod(abs(sin(floor(now / 1024.0) * 12.9898 + 78.233) * 43758.5453), 1.0) < ${threshold} { 1.0 } else { 0.0 })`;
  return [code, Order.MULTIPLY];
};

// =========================================================
// Main export: generate mimium code from a workspace
// =========================================================

export function generateMimiumCode(workspace: Blockly.Workspace): string {
  // Get all top-level blocks
  const topBlocks = workspace.getTopBlocks(true);

  if (topBlocks.length === 0) {
    return `${PREAMBLE}\n\nfn dsp() -> float {\n  0.0\n}`;
  }

  // Generate code for each top-level block
  const expressions: string[] = [];
  for (const block of topBlocks) {
    if (block.isEnabled()) {
      const code = mimiumGenerator.blockToCode(block);
      if (typeof code === 'string' && code.trim()) {
        expressions.push(code.trim());
      } else if (Array.isArray(code) && code[0] && String(code[0]).trim()) {
        expressions.push(String(code[0]).trim());
      }
    }
  }

  if (expressions.length === 0) {
    return `${PREAMBLE}\n\nfn dsp() -> float {\n  0.0\n}`;
  }

  // Combine: if multiple top-level blocks, mix them
  let body: string;
  if (expressions.length === 1) {
    body = expressions[0];
  } else {
    const n = expressions.length;
    body = `(${expressions.join(' + ')}) / ${n}.0`;
  }

  return `${PREAMBLE}\n\nfn dsp() -> float {\n  ${body}\n}`;
}

/**
 * Generate mimium code from a workspace XML string using a headless workspace.
 * This is useful for generating code for tracks that are not currently displayed
 * in the visual editor (e.g., when loading a saved project with multiple tracks).
 *
 * Creates a temporary headless Blockly workspace, loads the XML, generates code,
 * and disposes the workspace.
 */
export function generateCodeFromXml(xml: string): string {
  if (!xml || xml.trim() === '') {
    return `${PREAMBLE}\n\nfn dsp() -> float {\n  0.0\n}`;
  }

  const headlessWorkspace = new Blockly.Workspace();
  try {
    const dom = Blockly.utils.xml.textToDom(xml);
    Blockly.Xml.domToWorkspace(dom, headlessWorkspace);
    return generateMimiumCode(headlessWorkspace);
  } catch {
    return `${PREAMBLE}\n\nfn dsp() -> float {\n  0.0\n}`;
  } finally {
    headlessWorkspace.dispose();
  }
}

export { mimiumGenerator, PREAMBLE, Order };
