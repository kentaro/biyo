import LZString from 'lz-string';
import { validateWorkspaceXml } from './validate-xml';

/** Maximum URL length considered safe for sharing (most browsers support ~2000+) */
const MAX_URL_LENGTH = 8000;

/** Prefix used in the URL hash fragment */
const SHARE_PREFIX = 'share=';

interface WorkspaceData {
  xml: string;
  bpm: number;
}

/**
 * Minify workspace XML by collapsing whitespace between tags.
 *
 * Only removes whitespace that appears between a closing `>` and an opening `<`.
 * Content inside tags (attribute values, text nodes) is left intact so that
 * round-tripping does not corrupt user data.
 */
function minifyXml(xml: string): string {
  return xml
    .replace(/>\s+</g, '><') // collapse whitespace between tags
    .trim();
}

/**
 * Encode workspace state (XML + BPM) into a URL hash fragment.
 *
 * Format: `#share=<lz-string compressed, URI-encoded base64>`
 * The payload is JSON `{ xml, bpm }` -> minified -> LZString.compressToEncodedURIComponent
 *
 * Returns the full hash string (including `#`), or `null` if the workspace
 * is empty or the resulting URL would exceed a safe length.
 */
export function encodeWorkspace(xml: string, bpm: number): string | null {
  if (!xml || xml.trim() === '' || xml.trim() === '<xml></xml>') {
    return null;
  }

  const payload: WorkspaceData = {
    xml: minifyXml(xml),
    bpm,
  };

  const json = JSON.stringify(payload);
  const compressed = LZString.compressToEncodedURIComponent(json);

  if (!compressed) {
    return null;
  }

  const hash = `#${SHARE_PREFIX}${compressed}`;

  // Check if the full URL would be too long
  // We use hash length as a proxy; the caller adds it to the origin+path
  if (hash.length > MAX_URL_LENGTH) {
    return null;
  }

  return hash;
}

/**
 * Decode a workspace from a URL hash fragment.
 *
 * Accepts the full `window.location.hash` string (with or without leading `#`).
 * Returns `{ xml, bpm }` on success, or `null` if the hash is not a valid share link
 * or the data is corrupt.
 */
export function decodeWorkspace(hash: string): WorkspaceData | null {
  if (!hash) return null;

  // Strip leading '#' if present
  const stripped = hash.startsWith('#') ? hash.slice(1) : hash;

  if (!stripped.startsWith(SHARE_PREFIX)) {
    return null;
  }

  const compressed = stripped.slice(SHARE_PREFIX.length);
  if (!compressed) return null;

  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;

    const data: unknown = JSON.parse(json);

    // Validate shape
    if (typeof data !== 'object' || data === null || !('xml' in data) || !('bpm' in data)) {
      return null;
    }

    const { xml, bpm } = data as { xml: unknown; bpm: unknown };

    if (typeof xml !== 'string' || typeof bpm !== 'number' || !Number.isFinite(bpm)) {
      return null;
    }

    // Validate XML for safety (XSS, injection, structure)
    const validation = validateWorkspaceXml(xml);
    if (!validation.valid) {
      return null;
    }

    // Clamp BPM to valid range
    const safeBpm = Math.max(20, Math.min(300, bpm));

    return { xml, bpm: safeBpm };
  } catch {
    // JSON parse error, decompression error, etc.
    return null;
  }
}
