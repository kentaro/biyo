import LZString from 'lz-string';
import { describe, expect, it, vi } from 'vitest';
import { decodeWorkspace, encodeWorkspace } from '../url-codec';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a valid XML string that passes the sanity check in decodeWorkspace */
const SIMPLE_XML = '<xml xmlns="https://blockly.dev"><block type="play_note"></block></xml>';

/** XML with lots of whitespace to exercise minification */
const WHITESPACE_XML = `<xml>
  <block type="play_note">
    <field name="NOTE">C4</field>
  </block>
</xml>`;

/** Generate a very large XML string to exceed MAX_URL_LENGTH (8000) */
function _makeLargeXml(size: number): string {
  const filler = `<block type="x">${'a'.repeat(size)}</block>`;
  return `<xml>${filler}</xml>`;
}

// ---------------------------------------------------------------------------
// encodeWorkspace
// ---------------------------------------------------------------------------

describe('encodeWorkspace', () => {
  it('encodes valid xml and bpm into a hash string', () => {
    const result = encodeWorkspace(SIMPLE_XML, 120);
    expect(result).not.toBeNull();
    expect(result).toMatch(/^#share=.+/);
  });

  it('returns null for empty string', () => {
    expect(encodeWorkspace('', 120)).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(encodeWorkspace('   ', 120)).toBeNull();
  });

  it('returns null for minimal empty xml (<xml></xml>)', () => {
    expect(encodeWorkspace('<xml></xml>', 120)).toBeNull();
  });

  it('returns null for <xml></xml> with surrounding whitespace', () => {
    expect(encodeWorkspace('  <xml></xml>  ', 120)).toBeNull();
  });

  it('returns null when compressed output exceeds MAX_URL_LENGTH (8000)', () => {
    // LZ-string compresses repetitive data well, so we need diverse content
    // to produce a hash that actually exceeds 8000 characters.
    // Generate blocks with unique random-like attribute values.
    let xml = '<xml>';
    for (let i = 0; i < 2000; i++) {
      xml += `<block type="t${i}" id="id${i * 7919}">`; // 7919 is a prime for variety
      xml += `<field name="F${i}">val${(i * 13) % 997}_${(i * 31) % 503}</field>`;
      xml += '</block>';
    }
    xml += '</xml>';
    const result = encodeWorkspace(xml, 120);
    expect(result).toBeNull();
  });

  it('returns null when LZString.compressToEncodedURIComponent returns empty', () => {
    // Mock LZString to return an empty string
    const spy = vi.spyOn(LZString, 'compressToEncodedURIComponent').mockReturnValueOnce('');
    const result = encodeWorkspace(SIMPLE_XML, 120);
    expect(result).toBeNull();
    spy.mockRestore();
  });

  it('minifies whitespace between tags', () => {
    const result = encodeWorkspace(WHITESPACE_XML, 100);
    expect(result).not.toBeNull();

    // Decode and verify whitespace was collapsed
    const decoded = decodeWorkspace(result!);
    expect(decoded).not.toBeNull();
    // The xml should NOT contain ">\n  <" patterns
    expect(decoded?.xml).not.toMatch(/>\s+</);
  });

  it('minifies multiple consecutive spaces', () => {
    const xml = '<xml><block type="play_note">    lots   of   spaces    </block></xml>';
    const result = encodeWorkspace(xml, 100);
    expect(result).not.toBeNull();
    const decoded = decodeWorkspace(result!);
    expect(decoded).not.toBeNull();
    // Multiple spaces should be collapsed to single space
    expect(decoded?.xml).not.toMatch(/\s{2,}/);
  });

  it('preserves the bpm value in the encoded payload', () => {
    const result = encodeWorkspace(SIMPLE_XML, 140);
    const decoded = decodeWorkspace(result!);
    expect(decoded?.bpm).toBe(140);
  });
});

// ---------------------------------------------------------------------------
// decodeWorkspace
// ---------------------------------------------------------------------------

describe('decodeWorkspace', () => {
  it('decodes a valid hash (with leading #)', () => {
    const hash = encodeWorkspace(SIMPLE_XML, 120)!;
    const result = decodeWorkspace(hash);
    expect(result).not.toBeNull();
    expect(result?.bpm).toBe(120);
    expect(result?.xml).toContain('<xml');
  });

  it('decodes a valid hash (without leading #)', () => {
    const hash = encodeWorkspace(SIMPLE_XML, 120)!;
    // Remove the leading '#'
    const result = decodeWorkspace(hash.slice(1));
    expect(result).not.toBeNull();
    expect(result?.bpm).toBe(120);
  });

  it('returns null for empty string', () => {
    expect(decodeWorkspace('')).toBeNull();
  });

  it('returns null for null-ish input (empty string as falsy)', () => {
    // The function checks `if (!hash)` which catches empty strings
    expect(decodeWorkspace('')).toBeNull();
  });

  it('returns null for hash without share= prefix', () => {
    expect(decodeWorkspace('#notashare=abc')).toBeNull();
  });

  it('returns null for hash with only the prefix and no data', () => {
    expect(decodeWorkspace('#share=')).toBeNull();
  });

  it('returns null for corrupted/invalid compressed data', () => {
    expect(decodeWorkspace('#share=totallyInvalidData!!!')).toBeNull();
  });

  it('returns null when decompressed data is not valid JSON', () => {
    // Compress a non-JSON string
    const compressed = LZString.compressToEncodedURIComponent('not json at all');
    expect(decodeWorkspace(`#share=${compressed}`)).toBeNull();
  });

  it('returns null when decompressed JSON is not an object (array)', () => {
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify([1, 2, 3]));
    expect(decodeWorkspace(`#share=${compressed}`)).toBeNull();
  });

  it('returns null when decompressed JSON is null', () => {
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(null));
    expect(decodeWorkspace(`#share=${compressed}`)).toBeNull();
  });

  it('returns null when xml field is missing', () => {
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify({ bpm: 120 }));
    expect(decodeWorkspace(`#share=${compressed}`)).toBeNull();
  });

  it('returns null when bpm field is missing', () => {
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify({ xml: '<xml><block/></xml>' }),
    );
    expect(decodeWorkspace(`#share=${compressed}`)).toBeNull();
  });

  it('returns null when xml is not a string', () => {
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify({ xml: 42, bpm: 120 }),
    );
    expect(decodeWorkspace(`#share=${compressed}`)).toBeNull();
  });

  it('returns null when bpm is not a number', () => {
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify({ xml: '<xml><block/></xml>', bpm: 'fast' }),
    );
    expect(decodeWorkspace(`#share=${compressed}`)).toBeNull();
  });

  it('returns null when xml fails the sanity check (no <xml or <block)', () => {
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify({ xml: '<div>not blockly</div>', bpm: 120 }),
    );
    expect(decodeWorkspace(`#share=${compressed}`)).toBeNull();
  });

  it('accepts xml containing <block without <xml', () => {
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify({ xml: "<block type='play_note'/>", bpm: 100 }),
    );
    const result = decodeWorkspace(`#share=${compressed}`);
    expect(result).not.toBeNull();
    expect(result?.xml).toBe("<block type='play_note'/>");
  });

  it('clamps bpm below 20 to 20', () => {
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify({ xml: '<xml><block/></xml>', bpm: 5 }),
    );
    const result = decodeWorkspace(`#share=${compressed}`);
    expect(result).not.toBeNull();
    expect(result?.bpm).toBe(20);
  });

  it('clamps bpm above 300 to 300', () => {
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify({ xml: '<xml><block/></xml>', bpm: 999 }),
    );
    const result = decodeWorkspace(`#share=${compressed}`);
    expect(result).not.toBeNull();
    expect(result?.bpm).toBe(300);
  });

  it('passes through bpm within valid range unchanged', () => {
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify({ xml: '<xml><block/></xml>', bpm: 150 }),
    );
    const result = decodeWorkspace(`#share=${compressed}`);
    expect(result?.bpm).toBe(150);
  });

  it('returns null when decompression returns null', () => {
    // Mock LZString to return null on decompression
    const spy = vi
      .spyOn(LZString, 'decompressFromEncodedURIComponent')
      .mockReturnValueOnce(null as unknown as string);
    expect(decodeWorkspace('#share=something')).toBeNull();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Round-trip: encode -> decode
// ---------------------------------------------------------------------------

describe('round-trip encode/decode', () => {
  it('returns original xml (minified) and bpm', () => {
    const hash = encodeWorkspace(SIMPLE_XML, 120)!;
    const decoded = decodeWorkspace(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.bpm).toBe(120);
    // The round-tripped xml should be the minified version of the original
    expect(decoded?.xml).toContain('play_note');
    expect(decoded?.xml).toContain('<xml');
  });

  it('preserves xml with special characters (quotes, ampersands)', () => {
    const xml =
      '<xml><block type="note &amp; rest"><field name="val">C#4 &lt; D4</field></block></xml>';
    const hash = encodeWorkspace(xml, 90)!;
    expect(hash).not.toBeNull();
    const decoded = decodeWorkspace(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.xml).toContain('&amp;');
    expect(decoded?.xml).toContain('&lt;');
    expect(decoded?.bpm).toBe(90);
  });

  it('preserves xml with unicode characters', () => {
    const xml =
      '<xml><block type="play_note"><field name="LABEL">\u97f3\u697d\u266a\ud83c\udfb5</field></block></xml>';
    const hash = encodeWorkspace(xml, 100)!;
    expect(hash).not.toBeNull();
    const decoded = decodeWorkspace(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.xml).toContain('\u97f3\u697d');
    expect(decoded?.xml).toContain('\u266a');
  });

  it('preserves various bpm values at range boundaries', () => {
    for (const bpm of [20, 60, 120, 200, 300]) {
      const hash = encodeWorkspace(SIMPLE_XML, bpm)!;
      const decoded = decodeWorkspace(hash);
      expect(decoded?.bpm).toBe(bpm);
    }
  });

  it('collapses inter-tag whitespace during round-trip', () => {
    const hash = encodeWorkspace(WHITESPACE_XML, 100)!;
    const decoded = decodeWorkspace(hash);
    expect(decoded).not.toBeNull();
    // After minification, no whitespace-only gaps between tags
    expect(decoded?.xml).not.toMatch(/>\s+</);
  });
});

// ---------------------------------------------------------------------------
// Edge cases with special characters
// ---------------------------------------------------------------------------

describe('edge cases with special characters in XML', () => {
  it('handles XML with CDATA sections', () => {
    const xml = '<xml><block type="play_note"><![CDATA[some <data>]]></block></xml>';
    const hash = encodeWorkspace(xml, 120)!;
    expect(hash).not.toBeNull();
    const decoded = decodeWorkspace(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.xml).toContain('CDATA');
  });

  it('handles XML with single and double quotes in attributes', () => {
    const xml = `<xml><block type='play_note' label="it's a &quot;test&quot;"></block></xml>`;
    const hash = encodeWorkspace(xml, 100)!;
    expect(hash).not.toBeNull();
    const decoded = decodeWorkspace(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.xml).toContain("it's");
    expect(decoded?.xml).toContain('&quot;');
  });

  it('handles XML with newlines inside attribute values after minification', () => {
    const xml = '<xml><block type="play_note" data="line1\nline2"></block></xml>';
    const hash = encodeWorkspace(xml, 80)!;
    expect(hash).not.toBeNull();
    const decoded = decodeWorkspace(hash);
    expect(decoded).not.toBeNull();
  });

  it('handles XML with deeply nested blocks', () => {
    let xml = '<xml>';
    for (let i = 0; i < 50; i++) {
      xml += `<block type="nest_${i}">`;
    }
    for (let i = 0; i < 50; i++) {
      xml += '</block>';
    }
    xml += '</xml>';
    const hash = encodeWorkspace(xml, 120)!;
    expect(hash).not.toBeNull();
    const decoded = decodeWorkspace(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.xml).toContain('nest_0');
    expect(decoded?.xml).toContain('nest_49');
  });

  it('handles XML with only <block (no <xml wrapper)', () => {
    const xml = '<block type="play_note"><field name="NOTE">C4</field></block>';
    const hash = encodeWorkspace(xml, 120)!;
    expect(hash).not.toBeNull();
    const decoded = decodeWorkspace(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.xml).toContain('<block');
  });
});
