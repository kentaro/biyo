'use client';

import * as Blockly from 'blockly';
import { useCallback, useEffect, useRef, useState } from 'react';
import '@/lib/blockly/blocks';
import { audioEngine } from '@/lib/audio/engine';
import { microphoneManager } from '@/lib/audio/microphone';
import { generateMimiumCode } from '@/lib/blockly/generator/mimium-generator';
import { biyoTheme } from '@/lib/blockly/theme';
import { getToolboxForLevel } from '@/lib/blockly/toolbox';
import { useCompileStore } from '@/lib/stores/compile';
import { isEffectBlock, useExperienceStore } from '@/lib/stores/experience';
import { usePlaybackStore } from '@/lib/stores/playback';
import { useTrackStore } from '@/lib/stores/tracks';
import HelpTooltip from './HelpTooltip';

// Global workspace ref for undo/redo access from Toolbar
let globalWorkspace: Blockly.WorkspaceSvg | null = null;
export function getWorkspace(): Blockly.WorkspaceSvg | null {
  return globalWorkspace;
}

// ---- Signal Flow Animation Overlay ----
// Color map: block type prefix -> particle color (from theme)
// Resolve CSS custom property to actual color value (for canvas rendering)
function getCssVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Lazily resolved color cache (populated on first access)
let _resolvedColors: Record<string, string> | null = null;
function getResolvedColors() {
  if (!_resolvedColors) {
    const source = getCssVar('--c-source');
    const effect = getCssVar('--c-effect');
    const rhythm = getCssVar('--c-rhythm');
    const note = getCssVar('--c-note');
    const utility = getCssVar('--c-utility');
    const preset = getCssVar('--c-preset');
    _resolvedColors = { source, effect, rhythm, note, utility, preset };
  }
  return _resolvedColors;
}

const BLOCK_CATEGORY_COLORS: Record<string, string> = {};

function getBlockColor(blockType: string): string {
  if (BLOCK_CATEGORY_COLORS[blockType]) return BLOCK_CATEGORY_COLORS[blockType];

  const c = getResolvedColors();
  // Determine category by block type prefix mapping
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
  const EFFECT_BLOCKS = [
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
  ];
  const RHYTHM_BLOCKS = [
    'biyo_metro',
    'biyo_sequencer',
    'biyo_melody',
    'biyo_drum_pattern',
    'biyo_envelope',
  ];
  const NOTE_BLOCKS = [
    'biyo_bpm',
    'biyo_piano_note',
    'biyo_note',
    'biyo_chord',
    'biyo_pingpong',
    'biyo_passthrough',
  ];
  const UTILITY_BLOCKS = [
    'biyo_scale',
    'biyo_arpeggio',
    'biyo_mix',
    'biyo_multiply',
    'biyo_number',
    'biyo_invert',
  ];
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

  let color = c.source; // default
  if (SOURCE_BLOCKS.includes(blockType)) color = c.source;
  else if (EFFECT_BLOCKS.includes(blockType)) color = c.effect;
  else if (RHYTHM_BLOCKS.includes(blockType)) color = c.rhythm;
  else if (NOTE_BLOCKS.includes(blockType)) color = c.note;
  else if (UTILITY_BLOCKS.includes(blockType)) color = c.utility;
  else if (PRESET_BLOCKS.includes(blockType)) color = c.preset;

  BLOCK_CATEGORY_COLORS[blockType] = color;
  return color;
}

// Default particle color resolved at runtime from CSS var
function getDefaultParticleColor(): string {
  return getResolvedColors().source;
}

// Cached text-inverse color (white dot at particle center)
let _cachedTextInverse: string | null = null;
function getTextInverseColor(): string {
  if (!_cachedTextInverse) {
    _cachedTextInverse = getCssVar('--c-text-inverse') || '#fff';
  }
  return _cachedTextInverse;
}

/**
 * Convert a color value to an rgba() string with the given alpha.
 * Handles hex (#rgb, #rrggbb, #rrggbbaa) and falls back to canvas parsing.
 */
function colorWithAlpha(color: string, alpha: number): string {
  // Fast path for 6-digit hex
  const hex6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (hex6) {
    return `rgba(${Number.parseInt(hex6[1], 16)},${Number.parseInt(hex6[2], 16)},${Number.parseInt(hex6[3], 16)},${alpha})`;
  }
  // 3-digit hex
  const hex3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(color);
  if (hex3) {
    const r = Number.parseInt(hex3[1] + hex3[1], 16);
    const g = Number.parseInt(hex3[2] + hex3[2], 16);
    const b = Number.parseInt(hex3[3] + hex3[3], 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  // Fallback: use a temporary canvas to parse the color
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('canvas');
    tmp.width = tmp.height = 1;
    const tctx = tmp.getContext('2d');
    if (tctx) {
      tctx.fillStyle = color;
      tctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = tctx.getImageData(0, 0, 1, 1).data;
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }
  return color;
}

/** Check if user prefers reduced motion (cached per session) */
let _prefersReducedMotion: boolean | null = null;
function prefersReducedMotion(): boolean {
  if (_prefersReducedMotion === null) {
    _prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return _prefersReducedMotion;
}

const MAX_PARTICLES_GLOBAL = 100; // absolute upper bound
const MAX_PARTICLES_PER_EDGE = 3; // at most 3 concurrent per edge
const PARTICLE_SPEED = 0.008; // progress per frame (0..1)
const PARTICLE_RADIUS = 4;
const PARTICLE_SPAWN_INTERVAL = 18; // frames between spawns per edge

interface ConnectionEdge {
  /** Source block output connection (workspace coords) */
  srcX: number;
  srcY: number;
  /** Target block input connection (workspace coords) */
  dstX: number;
  dstY: number;
  /** Particle color */
  color: string;
}

interface Particle {
  edge: ConnectionEdge;
  /** Progress along the edge, 0..1 */
  t: number;
  /** Per-particle radius variation */
  radius: number;
}

/**
 * Collects all signal-flow connection edges from the workspace.
 * An edge exists where a block's output connection is plugged into
 * another block's input_value connection.
 */
function collectEdges(workspace: Blockly.WorkspaceSvg): ConnectionEdge[] {
  const edges: ConnectionEdge[] = [];
  const allBlocks = workspace.getAllBlocks(false);

  for (const block of allBlocks) {
    // Skip blocks that are in the flyout
    if (block.isInFlyout) continue;

    // For each input connection on this block
    const inputs = block.inputList;
    for (const input of inputs) {
      const conn = input.connection;
      if (!conn) continue;
      // Only value inputs (type 1 = INPUT_VALUE)
      if (conn.type !== Blockly.ConnectionType.INPUT_VALUE) continue;

      const targetConn = conn.targetConnection;
      if (!targetConn) continue;

      // targetConn is the output connection of the source block
      const sourceBlock = targetConn.getSourceBlock();
      const color = getBlockColor(sourceBlock.type) || getDefaultParticleColor();

      edges.push({
        srcX: targetConn.x,
        srcY: targetConn.y,
        dstX: conn.x,
        dstY: conn.y,
        color,
      });
    }
  }

  return edges;
}

/**
 * Convert workspace coordinates to pixel coordinates on the canvas overlay.
 */
function wsToPixel(
  wx: number,
  wy: number,
  workspace: Blockly.WorkspaceSvg,
  canvasRect: DOMRect,
): { px: number; py: number } {
  const parentSvg = workspace.getParentSvg();
  const svgRect = parentSvg.getBoundingClientRect();
  const origin = workspace.getOriginOffsetInPixels();
  const scale = workspace.scale;

  const px = origin.x + wx * scale - (canvasRect.left - svgRect.left);
  const py = origin.y + wy * scale - (canvasRect.top - svgRect.top);
  return { px, py };
}

function SignalFlowOverlay({
  workspaceRef,
  containerRef,
}: {
  workspaceRef: React.RefObject<Blockly.WorkspaceSvg | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const frameCountRef = useRef(0);
  const cachedEdgesRef = useRef<ConnectionEdge[]>([]);
  const spawnIndexRef = useRef(0); // round-robin spawn index

  // Listen for reduced-motion preference changes at runtime
  const reducedMotionRef = useRef(prefersReducedMotion());
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      _prefersReducedMotion = e.matches;
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      // Stop animation and clear
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = 0;
      }
      particlesRef.current = [];
      cachedEdgesRef.current = [];
      frameCountRef.current = 0;
      spawnIndexRef.current = 0;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    // Start animation loop
    const animate = () => {
      const canvas = canvasRef.current;
      const workspace = workspaceRef.current;
      const container = containerRef.current;
      if (!canvas || !workspace || !container) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      // Resize canvas to match container
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cw = Math.round(rect.width);
      const ch = Math.round(rect.height);
      if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
        canvas.style.width = `${cw}px`;
        canvas.style.height = `${ch}px`;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      // Collect edges periodically (~0.5s at 60fps) for perf
      frameCountRef.current++;
      const frame = frameCountRef.current;

      if (frame % 30 === 1 || cachedEdgesRef.current.length === 0) {
        cachedEdgesRef.current = collectEdges(workspace);
      }

      const edges = cachedEdgesRef.current;
      const canvasRect = canvas.getBoundingClientRect();

      // --- Reduced-motion: static indicators only, no animated particles ---
      if (reducedMotionRef.current) {
        for (const edge of edges) {
          const src = wsToPixel(edge.srcX, edge.srcY, workspace, canvasRect);
          const dst = wsToPixel(edge.dstX, edge.dstY, workspace, canvasRect);

          // Connection line
          ctx.beginPath();
          ctx.moveTo(src.px, src.py);
          ctx.lineTo(dst.px, dst.py);
          ctx.strokeStyle = colorWithAlpha(edge.color, 0.25);
          ctx.lineWidth = 2;
          ctx.stroke();

          // Static dot at midpoint to indicate signal flow
          const mx = (src.px + dst.px) / 2;
          const my = (src.py + dst.py) / 2;
          ctx.beginPath();
          ctx.arc(mx, my, PARTICLE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = colorWithAlpha(edge.color, 0.6);
          ctx.fill();
        }
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      // --- Full animation mode ---

      // Scale max particles based on edge count to keep perf in check
      const maxParticles = Math.min(
        MAX_PARTICLES_GLOBAL,
        Math.max(6, edges.length * MAX_PARTICLES_PER_EDGE),
      );

      // Spawn new particles using round-robin to distribute fairly across edges
      if (edges.length > 0 && frame % PARTICLE_SPAWN_INTERVAL === 0) {
        const edgeParticleCounts = new Map<ConnectionEdge, number>();
        for (const p of particlesRef.current) {
          edgeParticleCounts.set(p.edge, (edgeParticleCounts.get(p.edge) ?? 0) + 1);
        }

        const startIdx = spawnIndexRef.current;
        for (let i = 0; i < edges.length; i++) {
          if (particlesRef.current.length >= maxParticles) break;
          const idx = (startIdx + i) % edges.length;
          const edge = edges[idx];
          const count = edgeParticleCounts.get(edge) ?? 0;
          if (count < MAX_PARTICLES_PER_EDGE) {
            particlesRef.current.push({
              edge,
              t: 0,
              radius: PARTICLE_RADIUS + (Math.random() - 0.5) * 2,
            });
          }
        }
        spawnIndexRef.current = (startIdx + 1) % Math.max(1, edges.length);
      }

      // Cache the text-inverse color outside the per-particle loop
      const textInverse = getTextInverseColor();
      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.t += PARTICLE_SPEED;
        if (p.t > 1) continue; // particle reached destination

        const src = wsToPixel(p.edge.srcX, p.edge.srcY, workspace, canvasRect);
        const dst = wsToPixel(p.edge.dstX, p.edge.dstY, workspace, canvasRect);

        // Eased interpolation with slight arc
        const t = p.t;
        const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        const xBase = src.px + (dst.px - src.px) * ease;
        const yBase = src.py + (dst.py - src.py) * ease;
        // Add a slight arc perpendicular to the line
        const dx = dst.px - src.px;
        const dy = dst.py - src.py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const arcHeight = Math.min(dist * 0.15, 20);
        const arcOffset = Math.sin(t * Math.PI) * arcHeight;
        // Normal direction (perpendicular to src->dst)
        const nx = dist > 0 ? -dy / dist : 0;
        const ny = dist > 0 ? dx / dist : 0;
        const xFinal = xBase + ny * arcOffset;
        const yFinal = yBase + nx * arcOffset;

        // Pulsing alpha for liveliness
        const alpha = 0.6 + 0.4 * Math.sin(t * Math.PI);

        // Draw glow (using proper rgba for reliable color parsing)
        ctx.beginPath();
        ctx.arc(xFinal, yFinal, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = colorWithAlpha(p.edge.color, 0.125);
        ctx.fill();

        // Draw particle
        ctx.beginPath();
        ctx.arc(xFinal, yFinal, p.radius, 0, Math.PI * 2);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.edge.color;
        ctx.fill();

        // Draw bright center
        ctx.beginPath();
        ctx.arc(xFinal, yFinal, p.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = textInverse;
        ctx.globalAlpha = alpha * 0.8;
        ctx.fill();

        ctx.globalAlpha = 1;

        alive.push(p);
      }
      particlesRef.current = alive;

      // Draw faint connection lines for all edges
      if (edges.length > 0) {
        for (const edge of edges) {
          const src = wsToPixel(edge.srcX, edge.srcY, workspace, canvasRect);
          const dst = wsToPixel(edge.dstX, edge.dstY, workspace, canvasRect);

          ctx.beginPath();
          ctx.moveTo(src.px, src.py);
          ctx.lineTo(dst.px, dst.py);
          ctx.strokeStyle = colorWithAlpha(edge.color, 0.094);
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = 0;
      }
    };
  }, [isPlaying, workspaceRef, containerRef]);

  if (!isPlaying) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      tabIndex={-1}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}

// ---- Microphone permission prompt ----
function MicPermissionDialog({
  status,
  message,
  onAllow,
  onDismiss,
}: {
  status: 'prompt' | 'denied' | 'unavailable' | 'error';
  message: string;
  onAllow: () => void;
  onDismiss: () => void;
}) {
  const isPrompt = status === 'prompt';

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss pattern
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss pattern
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-overlay-bg)',
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isPrompt ? 'マイクをつかっていい？' : 'マイクがつかえないよ'}
        style={{
          background: 'var(--c-surface)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-6)',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center',
          maxWidth: '320px',
          fontFamily: 'var(--font-main)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: 'var(--sp-3)' }} aria-hidden="true">
          {isPrompt ? '\uD83C\uDFA4' : '\uD83D\uDE22'}
        </div>
        <div
          style={{
            fontSize: 'var(--fs-lg)',
            fontWeight: 700,
            color: 'var(--c-text)',
            marginBottom: 'var(--sp-3)',
          }}
        >
          {isPrompt
            ? '\u30DE\u30A4\u30AF\u3092\u3064\u304B\u3063\u3066\u3044\u3044\uFF1F'
            : message}
        </div>
        {isPrompt && (
          <div
            style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--c-text-muted)',
              marginBottom: 'var(--sp-4)',
              lineHeight: 1.5,
            }}
          >
            {
              '\u3042\u306A\u305F\u306E\u3053\u3048\u3084\u304A\u3068\u3092\u30D6\u30ED\u30C3\u30AF\u3067\u3078\u3093\u3057\u3093\u3067\u304D\u308B\u3088\uFF01'
            }
            <br />
            {'\u300C\u3044\u3044\u3088\u300D\u3092\u304A\u3057\u3066\u306D\u3002'}
          </div>
        )}
        <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center' }}>
          {isPrompt ? (
            <>
              <button
                type="button"
                onClick={onAllow}
                style={{
                  background: 'var(--c-source)',
                  color: 'var(--c-text-inverse)',
                  border: 'none',
                  borderRadius: 'var(--r-md)',
                  padding: 'var(--sp-2) var(--sp-5)',
                  fontSize: 'var(--fs-md)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-main)',
                }}
              >
                {'\u3044\u3044\u3088\uFF01'}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                style={{
                  background: 'var(--c-surface)',
                  color: 'var(--c-text-muted)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 'var(--r-md)',
                  padding: 'var(--sp-2) var(--sp-5)',
                  fontSize: 'var(--fs-md)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-main)',
                }}
              >
                {'\u3042\u3068\u3067'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onDismiss}
              style={{
                background: 'var(--c-surface)',
                color: 'var(--c-text)',
                border: '1px solid var(--c-border)',
                borderRadius: 'var(--r-md)',
                padding: 'var(--sp-2) var(--sp-5)',
                fontSize: 'var(--fs-md)',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-main)',
              }}
            >
              わかった
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockEditorInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flashClass, setFlashClass] = useState('');
  const [isEmpty, setIsEmpty] = useState(true);
  const [connectionHint, setConnectionHint] = useState('');
  const [micDialog, setMicDialog] = useState<{
    show: boolean;
    status: 'prompt' | 'denied' | 'unavailable' | 'error';
    message: string;
  }>({ show: false, status: 'prompt', message: '' });
  const micRequestedRef = useRef(false);
  // Track when we just cleared a pending append to skip the workspace reload
  const justAppendedRef = useRef(false);

  const activeTrackId = useTrackStore((s) => s.activeTrackId);
  const updateTrackWorkspace = useTrackStore((s) => s.updateTrackWorkspace);
  const _workspaceVersion = useTrackStore((s) => s.workspaceVersion);
  const pendingAppendXml = useTrackStore((s) => s.pendingAppendXml);
  const clearPendingAppend = useTrackStore((s) => s.clearPendingAppend);
  const getTrack = useTrackStore((s) => s.getTrack);
  const setGeneratedCode = useCompileStore((s) => s.setGeneratedCode);
  const setTrackCode = useCompileStore((s) => s.setTrackCode);
  const setStatus = useCompileStore((s) => s.setStatus);

  // Experience system
  const experienceLevel = useExperienceStore((s) => s.level);
  const incrementBlocksPlaced = useExperienceStore((s) => s.incrementBlocksPlaced);
  const addEffectUsed = useExperienceStore((s) => s.addEffectUsed);
  const loadFromStorage = useExperienceStore((s) => s.loadFromStorage);
  const prevLevelRef = useRef(experienceLevel);

  // Load experience from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Update toolbox when experience level changes
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    if (prevLevelRef.current === experienceLevel) return;
    prevLevelRef.current = experienceLevel;

    const newToolbox = getToolboxForLevel(experienceLevel);
    workspace.updateToolbox(newToolbox);
  }, [experienceLevel]);

  // Track block creation for experience system (separate from debounced handler)
  const onExperienceTrack = useCallback(
    (event: Blockly.Events.Abstract) => {
      if (event.type === Blockly.Events.BLOCK_CREATE) {
        const createEvent = event as Blockly.Events.BlockCreate;
        if (createEvent.json?.type) {
          const blockType = createEvent.json.type as string;
          incrementBlocksPlaced();
          if (isEffectBlock(blockType)) {
            addEffectUsed(blockType);
          }
          // Detect microphone block placement and prompt for permission
          if (
            blockType === 'biyo_microphone' &&
            !micRequestedRef.current &&
            !microphoneManager.isActive()
          ) {
            micRequestedRef.current = true;
            setMicDialog({ show: true, status: 'prompt', message: '' });
          }
        }
      }
    },
    [incrementBlocksPlaced, addEffectUsed],
  );

  // Handle mic permission: user clicked "Allow"
  const handleMicAllow = useCallback(async () => {
    setMicDialog((d) => ({ ...d, show: false }));
    const ctx = audioEngine.getAudioContext() ?? undefined;
    const unsub = microphoneManager.onStatusChange((status, message) => {
      if (status === 'denied' || status === 'unavailable' || status === 'error') {
        setMicDialog({ show: true, status, message });
      }
      // On "granted", mic is active and no dialog needed
    });
    await microphoneManager.start(ctx);
    unsub();
  }, []);

  // Handle mic dialog dismiss
  const handleMicDismiss = useCallback(() => {
    setMicDialog((d) => ({ ...d, show: false }));
  }, []);

  // Stop mic when component unmounts
  useEffect(() => {
    return () => {
      if (microphoneManager.isActive()) {
        microphoneManager.stop();
      }
    };
  }, []);

  const onWorkspaceChange = useCallback(() => {
    if (!workspaceRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const workspace = workspaceRef.current;
      if (!workspace) return;

      const topBlocks = workspace.getTopBlocks(false);
      setIsEmpty(topBlocks.length === 0);

      // Check for connection hints
      const allBlocks = workspace.getAllBlocks(false);
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
        'biyo_microphone',
      ];
      const hasSourceOnly =
        allBlocks.some((b) => sourceTypes.includes(b.type)) &&
        !allBlocks.some((b) => b.type.startsWith('biyo_') && !sourceTypes.includes(b.type));
      if (hasSourceOnly && allBlocks.length > 0) {
        setConnectionHint('エフェクトブロックをつなげてみよう！');
      } else {
        setConnectionHint('');
      }

      try {
        const code = generateMimiumCode(workspace);
        setGeneratedCode(code);
        if (activeTrackId) {
          setTrackCode(activeTrackId, code);
        }
        setStatus('ready');
        setFlashClass('animate-border-flash-green');
        setTimeout(() => setFlashClass(''), 600);
      } catch {
        setStatus('error');
        setFlashClass('animate-border-flash-red');
        setTimeout(() => setFlashClass(''), 600);
      }

      const xml = Blockly.Xml.workspaceToDom(workspace);
      const xmlText = Blockly.Xml.domToText(xml);
      if (activeTrackId) {
        updateTrackWorkspace(activeTrackId, xmlText);
      }
    }, 300);
  }, [activeTrackId, updateTrackWorkspace, setGeneratedCode, setTrackCode, setStatus]);

  useEffect(() => {
    if (!containerRef.current) return;

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Use experience-level-aware toolbox
    const currentLevel = useExperienceStore.getState().level;
    const initialToolbox = getToolboxForLevel(currentLevel);

    // Set Japanese locale for Blockly context menu (child-friendly hiragana)
    // Only override Msg keys for items we keep visible in the context menu.
    Blockly.Msg.DELETE_BLOCK = 'ブロックをけす';
    Blockly.Msg.DELETE_X_BLOCKS = '%1このブロックをけす';
    Blockly.Msg.DELETE_ALL_BLOCKS = 'ぜんぶのブロックをけす (%1こ)';
    Blockly.Msg.DUPLICATE_BLOCK = 'ブロックをコピーする';
    Blockly.Msg.UNDO = 'もどす';
    Blockly.Msg.REDO = 'やりなおす';
    Blockly.Msg.CLEAN_UP = 'ブロックをせいりする';

    // Remove confusing context menu items for children.
    // Using ContextMenuRegistry.unregister() removes items globally from BOTH
    // workspace-level (right-click on empty space) AND block-level (right-click
    // on a block) context menus. The previous approach using
    // workspace.configureContextMenu only filtered workspace-level menus.
    const confusingMenuIds = [
      'blockCollapseExpand', // Collapse/expand individual block
      'blockDisable', // Disable/enable block
      'blockInline', // External/inline inputs
      'blockComment', // Add/remove comment
      'blockHelp', // Help (no help pages configured)
      'collapseWorkspace', // Collapse all blocks (workspace menu)
      'expandWorkspace', // Expand all blocks (workspace menu)
    ];
    const registry = Blockly.ContextMenuRegistry.registry;
    for (const id of confusingMenuIds) {
      if (registry.getItem(id)) {
        registry.unregister(id);
      }
    }

    let workspace: Blockly.WorkspaceSvg;
    try {
      workspace = Blockly.inject(containerRef.current, {
        toolbox: initialToolbox,
        theme: biyoTheme,
        grid: {
          spacing: 20,
          length: 3,
          colour: getCssVar('--c-blockly-grid') || '#e8e4f0',
          snap: true,
        },
        zoom: {
          controls: true,
          wheel: true,
          pinch: true,
          startScale: isTouchDevice ? 0.85 : 0.9,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2,
        },
        trashcan: true,
        move: { scrollbars: true, drag: true, wheel: true },
        renderer: 'zelos',
        sounds: false,
      });
    } catch (e) {
      console.error('[BlockEditor] Blockly.inject failed:', e);
      setStatus('error');
      return;
    }

    // On touch devices, increase block text size for easier reading
    if (isTouchDevice) {
      const theme = workspace.getTheme();
      theme.setFontStyle({
        family: "'M PLUS Rounded 1c', 'Rounded Mplus 1c', sans-serif",
        weight: 'bold',
        size: 16,
      });
      workspace.setTheme(theme);
    }

    // Monkey-patch trashcan's setLidOpen to toggle a CSS class.
    // Blockly's .blocklyDragging class is on the dragged *block*, not on a
    // parent of the trashcan, so we cannot use `.blocklyDragging .blocklyTrash`
    // in CSS. Instead we add/remove `.blocklyTrashLidOpen` on the trashcan's
    // SVG group element when the lid opens/closes (triggered by onDragOver/onDragExit).
    const trashcan = workspace.trashcan;
    if (trashcan) {
      const origSetLidOpen = trashcan.setLidOpen.bind(trashcan);
      trashcan.setLidOpen = (state: boolean) => {
        origSetLidOpen(state);
        // Access the SVG group via the trashcan's DOM
        const svgGroup = (trashcan as unknown as { svgGroup?: SVGElement }).svgGroup;
        if (svgGroup) {
          if (state) {
            svgGroup.classList.add('blocklyTrashLidOpen');
          } else {
            svgGroup.classList.remove('blocklyTrashLidOpen');
          }
        }
      };
    }

    // Reposition trashcan to bottom-center of workspace
    const repositionTrashcan = () => {
      if (!trashcan) return;
      const svgGroup = (trashcan as unknown as { svgGroup?: SVGElement }).svgGroup;
      if (!svgGroup || !containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      // Trashcan SVG is ~47px wide; center it horizontally
      const trashWidth = 47;
      const centerX = containerWidth / 2 - trashWidth / 2;
      // Keep the Y from Blockly's default (bottom of workspace)
      const currentTransform = svgGroup.getAttribute('transform') || '';
      const yMatch = currentTransform.match(/translate\([^,]+,\s*([^)]+)\)/);
      const y = yMatch ? yMatch[1] : '0';
      svgGroup.setAttribute('transform', `translate(${centerX}, ${y})`);
    };

    // Initial position + reposition on Blockly resize
    setTimeout(repositionTrashcan, 100);

    workspaceRef.current = workspace;
    globalWorkspace = workspace;
    workspace.addChangeListener(onWorkspaceChange);
    workspace.addChangeListener(onExperienceTrack);

    // Resize Blockly when container size changes (e.g. panel drag)
    const resizeObserver = new ResizeObserver(() => {
      if (workspaceRef.current) {
        Blockly.svgResize(workspaceRef.current);
        repositionTrashcan();
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      workspace.removeChangeListener(onWorkspaceChange);
      workspace.removeChangeListener(onExperienceTrack);
      workspace.dispose();
      workspaceRef.current = null;
      globalWorkspace = null;
    };
  }, [onWorkspaceChange, onExperienceTrack, setStatus]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || !activeTrackId) return;

    // Append mode: just add blocks without clearing
    if (pendingAppendXml) {
      try {
        const xml = Blockly.utils.xml.textToDom(pendingAppendXml);
        Blockly.Xml.domToWorkspace(xml, workspace);

        // Save workspace immediately so the track state is up-to-date
        const fullXml = Blockly.Xml.workspaceToDom(workspace);
        const xmlText = Blockly.Xml.domToText(fullXml);
        updateTrackWorkspace(activeTrackId, xmlText);

        // Generate code for the newly appended blocks
        try {
          const code = generateMimiumCode(workspace);
          setGeneratedCode(code);
          if (activeTrackId) {
            setTrackCode(activeTrackId, code);
          }
          setStatus('ready');
        } catch {
          setStatus('error');
        }

        setIsEmpty(false);
      } catch (e) {
        console.warn('[BlockEditor] Append XML parse error:', e);
        setStatus('error');
      }
      justAppendedRef.current = true;
      clearPendingAppend();
      return;
    }

    // Skip reload if we just cleared a pending append (prevents flash)
    if (justAppendedRef.current) {
      justAppendedRef.current = false;
      return;
    }

    const track = getTrack(activeTrackId);
    if (!track) return;

    workspace.removeChangeListener(onWorkspaceChange);
    workspace.clear();

    if (track.workspaceXml) {
      try {
        const xml = Blockly.utils.xml.textToDom(track.workspaceXml);
        Blockly.Xml.domToWorkspace(xml, workspace);
      } catch (e) {
        console.warn('[BlockEditor] Track XML parse error:', e);
      }
    }

    setIsEmpty(workspace.getTopBlocks(false).length === 0);
    workspace.addChangeListener(onWorkspaceChange);

    try {
      const code = generateMimiumCode(workspace);
      setGeneratedCode(code);
      if (activeTrackId) {
        setTrackCode(activeTrackId, code);
      }
      setStatus('ready');
    } catch {
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTrackId,
    getTrack,
    onWorkspaceChange,
    setGeneratedCode,
    setTrackCode,
    setStatus,
    pendingAppendXml,
    clearPendingAppend,
    updateTrackWorkspace,
  ]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        className={`w-full h-full rounded-[var(--r-md)] border border-[var(--c-border)] ${flashClass}`}
        style={{ overflow: 'hidden', position: 'relative' }}
      />
      <SignalFlowOverlay workspaceRef={workspaceRef} containerRef={containerRef} />
      {micDialog.show && (
        <MicPermissionDialog
          status={micDialog.status}
          message={micDialog.message}
          onAllow={handleMicAllow}
          onDismiss={handleMicDismiss}
        />
      )}
      <HelpTooltip text="ブロックをドラッグしてつなげよう！" />
      {connectionHint && !isEmpty && (
        <div
          style={{
            position: 'absolute',
            bottom: 'var(--sp-3)',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 10,
            background: 'var(--c-effect)',
            color: 'var(--c-text-inverse)',
            borderRadius: 'var(--r-md)',
            padding: 'var(--sp-2) var(--sp-4)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 600,
            boxShadow: 'var(--shadow-md)',
            animation: 'hintPulse 2s ease-in-out infinite',
            maxWidth: '90vw',
            textAlign: 'center',
          }}
        >
          {connectionHint}
        </div>
      )}
      {isEmpty && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10,
            background: 'color-mix(in srgb, var(--c-surface) 85%, transparent)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--sp-5) var(--sp-6)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center',
            animation: 'emptyHintPulse 3s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes emptyHintPulse {
              0%, 100% { opacity: 0.9; }
              50% { opacity: 0.6; }
            }
          `}</style>
          <div
            style={{
              fontFamily: 'var(--font-main)',
              fontSize: 'var(--fs-md)',
              fontWeight: 700,
              color: 'var(--c-text)',
              maxWidth: '80vw',
              lineHeight: 1.4,
            }}
          >
            ブロックをえらんでつなげてみよう！
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlockEditor() {
  return <BlockEditorInner />;
}
