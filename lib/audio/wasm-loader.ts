/**
 * Mimium-to-JavaScript transpiler for biyo.
 *
 * Parses the mimium DSL code produced by the Blockly code generator,
 * transpiles it to JavaScript, and evaluates it with `new Function()`.
 * This replaces the old regex-based parser that could only handle
 * flat function calls like `sinwave(440)`.
 */

import { microphoneManager } from './microphone';

export interface MimiumContext {
  compile(code: string): void;
  process(output: Float32Array): void;
  get_samplerate(): number;
  set_samplerate(rate: number): void;
}

// --------------- State ---------------

interface DSPState {
  now: number;
  sampleRate: number;
  delayBuffers: Float32Array[];
  delayPositions: number[];
  delayIdx: number;
  filterStates: { x1: number; x2: number; y1: number; y2: number }[];
  filterIdx: number;
  dcX: number;
  dcY: number;
}

function createState(sampleRate: number): DSPState {
  return {
    now: 0,
    sampleRate,
    delayBuffers: [],
    delayPositions: [],
    delayIdx: 0,
    filterStates: [],
    filterIdx: 0,
    dcX: 0,
    dcY: 0,
  };
}

// --------------- Builtin Functions ---------------

function makeBuiltins(state: DSPState) {
  const TWO_PI = 2 * Math.PI;

  function sinwave(freq: number, phase: number): number {
    return Math.sin(TWO_PI * freq * (state.now / state.sampleRate) + phase);
  }

  function saw(freq: number, phase: number): number {
    const t = (((freq * (state.now / state.sampleRate) + phase) % 1.0) + 1.0) % 1.0;
    return t * 2.0 - 1.0;
  }

  function triangle(freq: number, phase: number): number {
    const t = (((freq * (state.now / state.sampleRate) + phase) % 1.0) + 1.0) % 1.0;
    return t < 0.5 ? t * 4.0 - 1.0 : 3.0 - t * 4.0;
  }

  function square(freq: number, phase: number): number {
    const t = (((freq * (state.now / state.sampleRate) + phase) % 1.0) + 1.0) % 1.0;
    return t < 0.5 ? 1.0 : -1.0;
  }

  function noise(): number {
    return Math.random() * 2.0 - 1.0;
  }

  function _getFilterState(): { x1: number; x2: number; y1: number; y2: number } {
    const idx = state.filterIdx++;
    // Cap at 64 simultaneous filters to prevent unbounded growth
    if (idx >= 64) return { x1: 0, x2: 0, y1: 0, y2: 0 };
    if (idx >= state.filterStates.length) {
      state.filterStates.push({ x1: 0, x2: 0, y1: 0, y2: 0 });
    }
    return state.filterStates[idx];
  }

  function lowpass(input: number, freq: number, q: number): number {
    const fs = _getFilterState();
    const w0 = (TWO_PI * freq) / state.sampleRate;
    const sinW0 = Math.sin(w0);
    const cosW0 = Math.cos(w0);
    const alpha = sinW0 / (2.0 * q);
    const b0 = (1.0 - cosW0) / 2.0;
    const b1 = 1.0 - cosW0;
    const b2 = (1.0 - cosW0) / 2.0;
    const a0 = 1.0 + alpha;
    const a1 = -2.0 * cosW0;
    const a2 = 1.0 - alpha;
    const y =
      (b0 / a0) * input +
      (b1 / a0) * fs.x1 +
      (b2 / a0) * fs.x2 -
      (a1 / a0) * fs.y1 -
      (a2 / a0) * fs.y2;
    fs.x2 = fs.x1;
    fs.x1 = input;
    fs.y2 = fs.y1;
    fs.y1 = y;
    return y;
  }

  function highpass(input: number, freq: number, q: number): number {
    const fs = _getFilterState();
    const w0 = (TWO_PI * freq) / state.sampleRate;
    const sinW0 = Math.sin(w0);
    const cosW0 = Math.cos(w0);
    const alpha = sinW0 / (2.0 * q);
    const b0 = (1.0 + cosW0) / 2.0;
    const b1 = -(1.0 + cosW0);
    const b2 = (1.0 + cosW0) / 2.0;
    const a0 = 1.0 + alpha;
    const a1 = -2.0 * cosW0;
    const a2 = 1.0 - alpha;
    const y =
      (b0 / a0) * input +
      (b1 / a0) * fs.x1 +
      (b2 / a0) * fs.x2 -
      (a1 / a0) * fs.y1 -
      (a2 / a0) * fs.y2;
    fs.x2 = fs.x1;
    fs.x1 = input;
    fs.y2 = fs.y1;
    fs.y1 = y;
    return y;
  }

  function bandpass(input: number, freq: number, q: number): number {
    const fs = _getFilterState();
    const w0 = (TWO_PI * freq) / state.sampleRate;
    const sinW0 = Math.sin(w0);
    const cosW0 = Math.cos(w0);
    const alpha = sinW0 / (2.0 * q);
    const b0 = alpha;
    const b1 = 0;
    const b2 = -alpha;
    const a0 = 1.0 + alpha;
    const a1 = -2.0 * cosW0;
    const a2 = 1.0 - alpha;
    const y =
      (b0 / a0) * input +
      (b1 / a0) * fs.x1 +
      (b2 / a0) * fs.x2 -
      (a1 / a0) * fs.y1 -
      (a2 / a0) * fs.y2;
    fs.x2 = fs.x1;
    fs.x1 = input;
    fs.y2 = fs.y1;
    fs.y1 = y;
    return y;
  }

  function delayFn(input: number, samples: number): number {
    const idx = state.delayIdx++;
    // Cap at 32 simultaneous delay lines to prevent memory exhaustion
    if (idx >= 32) return input;
    const delaySamples = Math.max(1, Math.round(samples));
    const maxSamples = Math.min(delaySamples, state.sampleRate * 5);
    if (idx >= state.delayBuffers.length) {
      state.delayBuffers.push(new Float32Array(maxSamples));
      state.delayPositions.push(0);
    }
    let buf = state.delayBuffers[idx];
    if (buf.length < maxSamples) {
      const newBuf = new Float32Array(maxSamples);
      newBuf.set(buf);
      state.delayBuffers[idx] = newBuf;
      buf = newBuf;
    }
    const pos = state.delayPositions[idx];
    const readPos = (((pos - delaySamples) % buf.length) + buf.length) % buf.length;
    const output = buf[readPos];
    buf[pos % buf.length] = input;
    state.delayPositions[idx] = (pos + 1) % buf.length;
    return output;
  }

  function _delay(input: number, time: number): number {
    const samples = time * state.sampleRate;
    return delayFn(input, samples);
  }

  function metro(interval: number): number {
    const phase = (((state.now / state.sampleRate) % interval) + interval) % interval;
    return phase < 1.0 / state.sampleRate ? 1.0 : 0.0;
  }

  function envelope(_trigger: number, attack: number, release: number): number {
    const period = attack + release;
    const t = (((state.now / state.sampleRate) % period) + period) % period;
    if (t < attack) {
      return t / attack;
    } else {
      return 1.0 - (t - attack) / release;
    }
  }

  function midi_to_hz(note: number): number {
    return 440.0 * 2.0 ** ((note - 69.0) / 12.0);
  }

  function clamp(x: number, lo: number, hi: number): number {
    return Math.min(Math.max(x, lo), hi);
  }

  function soft_clip(x: number): number {
    const t = clamp(x, -1.0, 1.0);
    return t * (1.5 - 0.5 * t * t);
  }

  /** Read the next sample from the microphone circular buffer */
  function microphone(): number {
    return microphoneManager.readSample();
  }

  return {
    sinwave,
    saw,
    triangle,
    square,
    noise,
    lowpass,
    highpass,
    bandpass,
    _delay,
    metro,
    envelope,
    midi_to_hz,
    clamp,
    soft_clip,
    microphone,
    sin: Math.sin,
    cos: Math.cos,
    floor: Math.floor,
    abs: Math.abs,
    pow: Math.pow,
    random: Math.random,
    delay: delayFn,
    fmod: (a: number, b: number) => ((a % b) + b) % b,
  };
}

// --------------- Transpiler ---------------

/**
 * Extract the body of `fn dsp() -> float { BODY }` from the full
 * mimium program. Everything before `fn dsp()` (preamble) is skipped
 * because we implement the helper functions natively in JS.
 *
 * Also handles track functions: `fn trackN() -> float { BODY }`
 * followed by a dsp() that calls them.
 */
function extractDSPBody(code: string): string {
  const dspMatch = code.match(/fn\s+dsp\s*\(\)\s*->\s*float\s*\{([\s\S]*)\}\s*$/);
  if (dspMatch) {
    return dspMatch[1].trim();
  }
  return code.trim();
}

/**
 * Extract track function bodies from the code.
 * Returns a map from function name to body expression.
 */
function extractTrackFunctions(code: string): Map<string, string> {
  const fns = new Map<string, string>();
  const fnRegex = /fn\s+(track\d+)\s*\(\)\s*->\s*float\s*\{([\s\S]*?)\}\s*(?=fn\s|$)/g;
  let match: RegExpExecArray | null = fnRegex.exec(code);
  while (match !== null) {
    fns.set(match[1], match[2].trim());
    match = fnRegex.exec(code);
  }
  return fns;
}

/**
 * Transpile a mimium expression to JavaScript.
 *
 * Handles:
 * - `if COND { A } else { B }` -> ternary
 * - `(let VAR = EXPR; REST)` -> IIFE
 * - `fmod(a, b)` -> proper modulo
 * - All function calls pass through (bound as closure vars)
 */
function transpile(src: string): string {
  let s = src;

  // Normalize whitespace (newlines -> spaces, collapse multiple spaces)
  s = s.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

  // Transpile let-bindings: (let VAR = EXPR; REST)
  // We need to handle these from outermost to innermost
  s = transpileLetBindings(s);

  // Transpile if-else to ternary
  s = transpileIfElse(s);

  // Transpile fmod(a, b) to proper modulo
  s = transpileFmod(s);

  return s;
}

/**
 * Transpile `(let VAR = EXPR; REST)` into JavaScript IIFE.
 * Handles nested let bindings.
 */
function transpileLetBindings(s: string): string {
  // Pattern: find `let X = EXPR;` and convert to IIFE
  // We need to find the let keyword, then the variable name, = sign, expression, semicolon, and rest
  let result = s;
  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 200;

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;

    // Find `( let VAR = ...` pattern
    const letIdx = result.indexOf('let ');
    if (letIdx === -1) break;

    // Check if there's an opening paren before the let (possibly with whitespace)
    let parenIdx = -1;
    for (let i = letIdx - 1; i >= 0; i--) {
      if (result[i] === '(') {
        parenIdx = i;
        break;
      } else if (result[i] !== ' ' && result[i] !== '\t') {
        break;
      }
    }

    if (parenIdx === -1) {
      // No paren wrapper, try a simpler form: `let VAR = EXPR; REST`
      // just do inline let
      const afterLet = result.substring(letIdx + 4);
      const eqIdx = afterLet.indexOf('=');
      if (eqIdx === -1) break;

      const varName = afterLet.substring(0, eqIdx).trim();
      const afterEq = afterLet.substring(eqIdx + 1);
      const semiIdx = findSemicolon(afterEq);
      if (semiIdx === -1) break;

      const expr = afterEq.substring(0, semiIdx).trim();
      const rest = afterEq.substring(semiIdx + 1).trim();

      const replacement = `(function() { var ${varName} = ${expr}; return ${rest}; })()`;
      result = result.substring(0, letIdx) + replacement;
      changed = true;
    } else {
      // Find the matching closing paren for the one at parenIdx
      const afterLet = result.substring(letIdx + 4);
      const eqIdx = afterLet.indexOf('=');
      if (eqIdx === -1) break;

      const varName = afterLet.substring(0, eqIdx).trim();
      const afterEq = afterLet.substring(eqIdx + 1);
      const semiIdx = findSemicolon(afterEq);
      if (semiIdx === -1) break;

      const expr = afterEq.substring(0, semiIdx).trim();
      const restStart = letIdx + 4 + eqIdx + 1 + semiIdx + 1;
      // Find matching close paren starting from parenIdx
      const closeIdx = findMatchingParen(result, parenIdx);
      if (closeIdx === -1) break;

      const rest = result.substring(restStart, closeIdx).trim();
      const replacement = `(function() { var ${varName} = ${expr}; return ${rest}; })()`;
      result = result.substring(0, parenIdx) + replacement + result.substring(closeIdx + 1);
      changed = true;
    }
  }

  return result;
}

/**
 * Find the index of the next semicolon that is not inside nested parentheses or braces.
 */
function findSemicolon(s: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(' || ch === '{') depth++;
    else if (ch === ')' || ch === '}') depth--;
    else if (ch === ';' && depth === 0) return i;
  }
  return -1;
}

/**
 * Find the matching closing parenthesis for the one at position `start`.
 */
function findMatchingParen(s: string, start: number): number {
  const open = s[start];
  const close = open === '(' ? ')' : '}';
  let depth = 1;
  for (let i = start + 1; i < s.length; i++) {
    if (s[i] === open) depth++;
    else if (s[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Transpile `if COND { A } else { B }` to `(COND ? A : B)`.
 * Handles nested if-else expressions.
 */
function transpileIfElse(s: string): string {
  let result = s;
  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 500;

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;

    // Find innermost `if ... { ... } else { ... }` first
    const ifIdx = findInnermostIf(result);
    if (ifIdx === -1) break;

    // Parse: if COND { THEN } else { ELSE }
    const parsed = parseIfElse(result, ifIdx);
    if (!parsed) break;

    const ternary = `(${parsed.cond} ? ${parsed.thenBranch} : ${parsed.elseBranch})`;
    result = result.substring(0, ifIdx) + ternary + result.substring(parsed.endIdx);
    changed = true;
  }

  return result;
}

/**
 * Find the index of an innermost `if` (one that doesn't contain another `if` in its condition).
 */
function findInnermostIf(s: string): number {
  let lastIfIdx = -1;
  let i = 0;
  while (i < s.length) {
    if (s.substring(i, i + 3) === 'if ' || s.substring(i, i + 3) === 'if\t') {
      // Make sure it's not part of a longer identifier
      if (i === 0 || !isIdentChar(s[i - 1])) {
        lastIfIdx = i;
      }
    }
    i++;
  }
  // Go from end to find the innermost (last) if statement
  // Actually, find the last one - it's most likely innermost
  // But we need to find one whose { } blocks don't contain another if
  // Simple approach: find from beginning, pick the first one whose then-block
  // doesn't contain `if `
  i = 0;
  while (i < s.length) {
    if (s.substring(i, i + 3) === 'if ' || s.substring(i, i + 3) === 'if\t') {
      if (i === 0 || !isIdentChar(s[i - 1])) {
        // Check if the then-block contains another if
        const braceIdx = s.indexOf('{', i + 3);
        if (braceIdx !== -1) {
          const closeIdx = findMatchingBrace(s, braceIdx);
          if (closeIdx !== -1) {
            const thenBlock = s.substring(braceIdx + 1, closeIdx);
            if (thenBlock.indexOf('if ') === -1) {
              return i;
            }
          }
        }
      }
    }
    i++;
  }
  // If all if-blocks contain nested ifs, just return the last one (deepest)
  return lastIfIdx;
}

function isIdentChar(ch: string): boolean {
  return /[a-zA-Z0-9_]/.test(ch);
}

/**
 * Find matching closing brace for the one at `start`.
 */
function findMatchingBrace(s: string, start: number): number {
  let depth = 1;
  for (let i = start + 1; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

interface IfElseParsed {
  cond: string;
  thenBranch: string;
  elseBranch: string;
  endIdx: number;
}

function parseIfElse(s: string, ifIdx: number): IfElseParsed | null {
  // Skip "if "
  const pos = ifIdx + 3;

  // Find the opening brace of then-block (condition is everything between `if ` and `{`)
  const thenBraceIdx = s.indexOf('{', pos);
  if (thenBraceIdx === -1) return null;

  const cond = s.substring(pos, thenBraceIdx).trim();

  // Find matching close brace for then-block
  const thenCloseIdx = findMatchingBrace(s, thenBraceIdx);
  if (thenCloseIdx === -1) return null;

  const thenBranch = s.substring(thenBraceIdx + 1, thenCloseIdx).trim();

  // Look for `else`
  const afterThen = thenCloseIdx + 1;
  const remaining = s.substring(afterThen).trimStart();
  const _elseOffset =
    s.length - (s.length - afterThen) + (s.substring(afterThen).length - remaining.length);

  if (!remaining.startsWith('else')) {
    // No else branch; treat as `if cond { A } else { 0.0 }`
    return {
      cond,
      thenBranch,
      elseBranch: '0.0',
      endIdx: thenCloseIdx + 1,
    };
  }

  // Skip "else"
  const elseStartInOriginal = afterThen + (s.substring(afterThen).length - remaining.length);
  let elsePos = elseStartInOriginal + 4; // skip "else"

  // Skip whitespace
  while (elsePos < s.length && (s[elsePos] === ' ' || s[elsePos] === '\t')) {
    elsePos++;
  }

  // Else block opening brace
  if (s[elsePos] !== '{') return null;

  const elseCloseIdx = findMatchingBrace(s, elsePos);
  if (elseCloseIdx === -1) return null;

  const elseBranch = s.substring(elsePos + 1, elseCloseIdx).trim();

  return {
    cond,
    thenBranch,
    elseBranch,
    endIdx: elseCloseIdx + 1,
  };
}

/**
 * Transpile `fmod(a, b)` to `((a % b) + b) % b`.
 */
function transpileFmod(s: string): string {
  let result = s;
  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 200;

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;

    const fmodIdx = result.indexOf('fmod(');
    if (fmodIdx === -1) break;

    // Make sure it's not part of a longer identifier
    if (fmodIdx > 0 && isIdentChar(result[fmodIdx - 1])) continue;

    // Find the matching closing paren
    const openParen = fmodIdx + 4; // index of '('
    const closeParen = findMatchingParen(result, openParen);
    if (closeParen === -1) break;

    // Extract args
    const argsStr = result.substring(openParen + 1, closeParen);
    // Split on top-level comma
    const args = splitArgs(argsStr);
    if (args.length !== 2) break;

    const a = args[0].trim();
    const b = args[1].trim();
    const replacement = `((${a}) % (${b}) + (${b})) % (${b})`;
    result = result.substring(0, fmodIdx) + replacement + result.substring(closeParen + 1);
    changed = true;
  }

  return result;
}

/**
 * Split a comma-separated argument list, respecting parentheses nesting.
 */
function splitArgs(s: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(' || ch === '{') depth++;
    else if (ch === ')' || ch === '}') depth--;
    else if (ch === ',' && depth === 0) {
      args.push(s.substring(start, i));
      start = i + 1;
    }
  }
  args.push(s.substring(start));
  return args;
}

/**
 * Compile a full mimium program into a callable DSP function.
 * Returns a function that takes the state object and builtins, returns a sample value.
 */
function compileMimium(
  code: string,
): ((state: DSPState, builtins: ReturnType<typeof makeBuiltins>) => number) | null {
  if (!code || !code.trim()) return null;

  // Extract track functions (if any)
  const trackFns = extractTrackFunctions(code);

  // Extract the main dsp body
  let dspBody = extractDSPBody(code);

  if (!dspBody || dspBody === '0.0') {
    return () => 0;
  }

  // Inline track function calls: replace `trackN()` with their body
  trackFns.forEach((fnBody, fnName) => {
    const callRegex = new RegExp(`\\b${fnName}\\(\\)`, 'g');
    const transpiledBody = transpile(fnBody);
    dspBody = dspBody.replace(callRegex, `(${transpiledBody})`);
  });

  // Transpile the dsp body
  const jsBody = transpile(dspBody);

  // Build the function
  const paramNames = [
    'state',
    'sinwave',
    'saw',
    'triangle',
    'square',
    'noise',
    'lowpass',
    'highpass',
    'bandpass',
    '_delay',
    'metro',
    'envelope',
    'midi_to_hz',
    'clamp',
    'soft_clip',
    'microphone',
    'sin',
    'cos',
    'floor',
    'abs',
    'pow',
    'random',
    'delay',
    'fmod',
    'now',
    'samplerate',
  ];

  // Safety: reject excessively large generated code (> 100KB)
  if (jsBody.length > 100_000) {
    console.error('[wasm-loader] Generated code too large:', jsBody.length, 'bytes');
    return null;
  }

  try {
    const fn = new Function(...paramNames, `"use strict"; return ${jsBody};`);
    return (st: DSPState, b: ReturnType<typeof makeBuiltins>) => {
      return fn(
        st,
        b.sinwave,
        b.saw,
        b.triangle,
        b.square,
        b.noise,
        b.lowpass,
        b.highpass,
        b.bandpass,
        b._delay,
        b.metro,
        b.envelope,
        b.midi_to_hz,
        b.clamp,
        b.soft_clip,
        b.microphone,
        b.sin,
        b.cos,
        b.floor,
        b.abs,
        b.pow,
        b.random,
        b.delay,
        b.fmod,
        st.now / st.sampleRate,
        st.sampleRate,
      );
    };
  } catch (e) {
    console.error('[wasm-loader] Failed to compile DSP function:', e);
    console.error('[wasm-loader] Transpiled JS body:', jsBody);
    return null;
  }
}

// --------------- Context implementation ---------------

class TranspilerContext implements MimiumContext {
  private sampleRate = 48000;
  private state: DSPState;
  private builtins: ReturnType<typeof makeBuiltins>;
  private dspFn: ((state: DSPState, builtins: ReturnType<typeof makeBuiltins>) => number) | null =
    null;

  constructor() {
    this.state = createState(this.sampleRate);
    this.builtins = makeBuiltins(this.state);
  }

  compile(code: string): void {
    // Atomic swap: only update state if compilation succeeds
    const newFn = compileMimium(code);
    if (newFn !== null) {
      this.state = createState(this.sampleRate);
      this.builtins = makeBuiltins(this.state);
      this.dspFn = newFn;
    }
    // If compilation fails, keep old DSP function running (no audio dropout)
  }

  process(output: Float32Array): void {
    const len = output.length;
    if (!this.dspFn) {
      output.fill(0);
      return;
    }

    const st = this.state;
    const b = this.builtins;
    const fn = this.dspFn;

    for (let i = 0; i < len; i++) {
      // Reset per-sample indices for stateful call-site tracking
      st.delayIdx = 0;
      st.filterIdx = 0;

      try {
        const raw = fn(st, b);
        const sample = Number.isFinite(raw) ? raw : 0;

        // DC blocker: y[n] = x[n] - x[n-1] + 0.995 * y[n-1]
        const dcOut = sample - st.dcX + 0.995 * st.dcY;
        st.dcX = sample;
        st.dcY = dcOut;

        // Soft-clip output to prevent harsh distortion
        output[i] = Math.tanh(dcOut);
      } catch {
        output[i] = 0;
      }

      st.now++;
    }
  }

  get_samplerate(): number {
    return this.sampleRate;
  }

  set_samplerate(rate: number): void {
    this.sampleRate = rate;
    this.state.sampleRate = rate;
  }
}

export function createMimiumContext(): MimiumContext {
  return new TranspilerContext();
}

// Exported for unit testing only -- not part of the public API
export const __test__ = {
  findMatchingParen,
  findMatchingBrace,
  findSemicolon,
  transpile,
  transpileLetBindings,
  transpileIfElse,
  transpileFmod,
  extractDSPBody,
  extractTrackFunctions,
  splitArgs,
};
