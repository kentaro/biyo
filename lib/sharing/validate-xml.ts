/**
 * Workspace XML validation for XSS/injection prevention.
 *
 * All entry points that load untrusted XML (shared URLs, file imports,
 * workspace loading) must call `validateWorkspaceXml()` before passing
 * the XML to Blockly.
 */

/** Maximum allowed XML size in bytes (500 KB). */
export const MAX_XML_SIZE = 500 * 1024;

/**
 * Dangerous HTML/SVG patterns that should never appear in Blockly workspace XML.
 *
 * These are matched case-insensitively against the XML string. The list
 * covers `<script>` tags, inline event handlers (`onload`, `onerror`, etc.),
 * `javascript:` URIs, and `<iframe>` / `<object>` / `<embed>` tags.
 */
const DANGEROUS_PATTERNS: RegExp[] = [
  // Script tags (including variants with whitespace/attributes)
  /<script[\s>/]/i,
  /<\/script\s*>/i,

  // Inline event handlers: on* attributes (e.g. onclick, onerror, onload, ...)
  /\bon[a-z]{2,}\s*=/i,

  // javascript: protocol in attribute values
  /javascript\s*:/i,

  // data: URIs that could contain executable content
  /data\s*:\s*text\/html/i,

  // Dangerous embedding tags
  /<iframe[\s>/]/i,
  /<object[\s>/]/i,
  /<embed[\s>/]/i,
  /<link[\s>/]/i,
  /<style[\s>/]/i,
  /<\/style\s*>/i,
  /<meta[\s>/]/i,
  /<base[\s>/]/i,
  /<form[\s>/]/i,
  /<svg[\s>/]/i,
  /<math[\s>/]/i,
];

/**
 * Known valid block type prefixes in this application.
 * Block types are expected to start with one of these prefixes.
 */
const KNOWN_BLOCK_TYPE_PREFIXES = ['biyo_'];

/**
 * Extract all `type="..."` attribute values from `<block>` and `<shadow>` tags.
 */
function extractBlockTypes(xml: string): string[] {
  const regex = /<(?:block|shadow)\s[^>]*type\s*=\s*["']([^"']+)["']/gi;
  const types: string[] = [];
  let match: RegExpExecArray | null = regex.exec(xml);
  while (match !== null) {
    types.push(match[1]);
    match = regex.exec(xml);
  }
  return types;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate workspace XML to prevent XSS and injection attacks.
 *
 * Returns `{ valid: true }` if the XML is safe to load, or
 * `{ valid: false, reason }` with a human-readable explanation.
 *
 * Checks performed:
 * 1. Non-empty string
 * 2. Size limit (MAX_XML_SIZE)
 * 3. Contains Blockly XML structure (`<xml` or `<block` tags)
 * 4. No dangerous HTML patterns (script tags, event handlers, etc.)
 * 5. All block types use known prefixes
 */
export function validateWorkspaceXml(xml: string): ValidationResult {
  // 1. Must be a non-empty string
  if (typeof xml !== 'string' || xml.trim() === '') {
    return { valid: false, reason: 'XML is empty or not a string' };
  }

  // 2. Size limit
  const byteLength = new TextEncoder().encode(xml).length;
  if (byteLength > MAX_XML_SIZE) {
    return {
      valid: false,
      reason: `XML exceeds maximum size (${byteLength} bytes > ${MAX_XML_SIZE} bytes)`,
    };
  }

  // 3. Must contain Blockly XML structure
  if (!xml.includes('<xml') && !xml.includes('<block')) {
    return {
      valid: false,
      reason: 'XML does not contain Blockly structure (<xml or <block tags)',
    };
  }

  // 4. Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(xml)) {
      return {
        valid: false,
        reason: `XML contains dangerous content matching pattern: ${pattern}`,
      };
    }
  }

  // 5. Validate block types use known prefixes
  const blockTypes = extractBlockTypes(xml);
  for (const blockType of blockTypes) {
    const hasKnownPrefix = KNOWN_BLOCK_TYPE_PREFIXES.some((prefix) => blockType.startsWith(prefix));
    if (!hasKnownPrefix) {
      return {
        valid: false,
        reason: `Unknown block type: "${blockType}" (expected prefix: ${KNOWN_BLOCK_TYPE_PREFIXES.join(', ')})`,
      };
    }
  }

  return { valid: true };
}
