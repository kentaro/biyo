import { describe, expect, it } from 'vitest';
import { MAX_XML_SIZE, validateWorkspaceXml } from '../validate-xml';

// ---------------------------------------------------------------------------
// Valid inputs
// ---------------------------------------------------------------------------

describe('validateWorkspaceXml - valid inputs', () => {
  it('accepts a minimal valid workspace XML', () => {
    const xml = '<xml><block type="biyo_note"></block></xml>';
    const result = validateWorkspaceXml(xml);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('accepts XML with multiple biyo_ block types', () => {
    const xml = '<xml><block type="biyo_sine"></block><block type="biyo_reverb"></block></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(true);
  });

  it('accepts XML with shadow blocks using biyo_ types', () => {
    const xml =
      '<xml><block type="biyo_lowpass"><shadow type="biyo_number"></shadow></block></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(true);
  });

  it('accepts XML with no block/shadow type attributes', () => {
    const xml = '<xml><block/></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(true);
  });

  it('accepts empty workspace wrapper', () => {
    const xml = '<xml></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(true);
  });

  it('accepts XML with field elements and nested structure', () => {
    const xml = `<xml>
      <block type="biyo_note">
        <field name="NOTE">C4</field>
        <field name="DURATION">1</field>
      </block>
    </xml>`;
    expect(validateWorkspaceXml(xml).valid).toBe(true);
  });

  it('accepts XML with only <block (no <xml wrapper)', () => {
    const xml = '<block type="biyo_sine"></block>';
    expect(validateWorkspaceXml(xml).valid).toBe(true);
  });

  it('accepts XML just under the size limit', () => {
    let xml = '<xml>';
    const filler = '<block type="biyo_note"><field name="N">C4</field></block>';
    // Stay under the limit
    while (new TextEncoder().encode(xml).length < MAX_XML_SIZE - 200) {
      xml += filler;
    }
    xml += '</xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Invalid inputs - empty/missing
// ---------------------------------------------------------------------------

describe('validateWorkspaceXml - empty/missing inputs', () => {
  it('rejects empty string', () => {
    const result = validateWorkspaceXml('');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('rejects whitespace-only string', () => {
    const result = validateWorkspaceXml('   ');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('rejects non-Blockly XML (no <xml or <block)', () => {
    const result = validateWorkspaceXml('<div>hello</div>');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Blockly structure');
  });
});

// ---------------------------------------------------------------------------
// Invalid inputs - size
// ---------------------------------------------------------------------------

describe('validateWorkspaceXml - size limit', () => {
  it('rejects XML exceeding MAX_XML_SIZE', () => {
    let xml = '<xml>';
    const filler = '<block type="biyo_note"><field name="N">C4</field></block>';
    while (new TextEncoder().encode(xml).length < MAX_XML_SIZE + 100) {
      xml += filler;
    }
    xml += '</xml>';
    const result = validateWorkspaceXml(xml);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('exceeds maximum size');
  });

  it('exports MAX_XML_SIZE as 500KB', () => {
    expect(MAX_XML_SIZE).toBe(500 * 1024);
  });
});

// ---------------------------------------------------------------------------
// Invalid inputs - XSS / injection patterns
// ---------------------------------------------------------------------------

describe('validateWorkspaceXml - XSS/injection prevention', () => {
  it('rejects <script> tags', () => {
    const xml = '<xml><script>alert("xss")</script><block type="biyo_note"/></xml>';
    const result = validateWorkspaceXml(xml);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('dangerous');
  });

  it('rejects <SCRIPT> tags (case-insensitive)', () => {
    const xml = '<xml><SCRIPT>alert("xss")</SCRIPT><block type="biyo_note"/></xml>';
    const result = validateWorkspaceXml(xml);
    expect(result.valid).toBe(false);
  });

  it('rejects </script> closing tags', () => {
    const xml = '<xml>some text</script><block type="biyo_note"/></xml>';
    const result = validateWorkspaceXml(xml);
    expect(result.valid).toBe(false);
  });

  it('rejects <script with attributes', () => {
    const xml = '<xml><script src="evil.js"></script><block type="biyo_note"/></xml>';
    const result = validateWorkspaceXml(xml);
    expect(result.valid).toBe(false);
  });

  it('rejects onclick event handler', () => {
    const xml = '<xml><block type="biyo_note" onclick="alert(1)"></block></xml>';
    const result = validateWorkspaceXml(xml);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('dangerous');
  });

  it('rejects onerror event handler', () => {
    const xml = '<xml><block type="biyo_note" onerror="fetch(evil)"></block></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects onload event handler', () => {
    const xml = '<xml><block type="biyo_note" onload="alert(1)"></block></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects onmouseover event handler', () => {
    const xml = '<xml><block type="biyo_note" onmouseover="alert(1)"></block></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects onfocus event handler', () => {
    const xml = '<xml><block type="biyo_note" onfocus="alert(1)"></block></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects javascript: URI in content', () => {
    const xml =
      '<xml><block type="biyo_note"><field name="URL">javascript:alert(1)</field></block></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects javascript: URI with spaces', () => {
    const xml =
      '<xml><block type="biyo_note"><field name="URL">javascript :alert(1)</field></block></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects data:text/html URI', () => {
    const xml =
      '<xml><block type="biyo_note"><field>data:text/html,<script>alert(1)</script></field></block></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects <iframe> tag', () => {
    const xml = '<xml><iframe src="https://evil.com"/><block type="biyo_note"/></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects <object> tag', () => {
    const xml = '<xml><object data="evil.swf"/><block type="biyo_note"/></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects <embed> tag', () => {
    const xml = '<xml><embed src="evil.swf"/><block type="biyo_note"/></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects <link> tag', () => {
    const xml = '<xml><link rel="stylesheet" href="evil.css"/><block type="biyo_note"/></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects <style> tag', () => {
    const xml = '<xml><style>body{background:red}</style><block type="biyo_note"/></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects <meta> tag', () => {
    const xml = '<xml><meta http-equiv="refresh"/><block type="biyo_note"/></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects <base> tag', () => {
    const xml = '<xml><base href="https://evil.com"/><block type="biyo_note"/></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects <form> tag', () => {
    const xml = '<xml><form action="evil"><block type="biyo_note"/></form></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects <svg> tag', () => {
    const xml = '<xml><svg onload="alert(1)"/><block type="biyo_note"/></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });

  it('rejects <math> tag (MathML injection)', () => {
    const xml = '<xml><math><block type="biyo_note"/></math></xml>';
    expect(validateWorkspaceXml(xml).valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Invalid inputs - unknown block types
// ---------------------------------------------------------------------------

describe('validateWorkspaceXml - block type validation', () => {
  it('rejects block type without biyo_ prefix', () => {
    const xml = '<xml><block type="custom_evil"></block></xml>';
    const result = validateWorkspaceXml(xml);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Unknown block type');
    expect(result.reason).toContain('custom_evil');
  });

  it('rejects shadow type without biyo_ prefix', () => {
    const xml = '<xml><shadow type="evil_shadow"></shadow></xml>';
    const result = validateWorkspaceXml(xml);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Unknown block type');
  });

  it('rejects mixed valid and invalid block types', () => {
    const xml = '<xml><block type="biyo_sine"></block><block type="malicious_block"></block></xml>';
    const result = validateWorkspaceXml(xml);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('malicious_block');
  });

  it('rejects block type that is a prefix of biyo_ but not starting with it', () => {
    const xml = '<xml><block type="not_biyo_sine"></block></xml>';
    const result = validateWorkspaceXml(xml);
    expect(result.valid).toBe(false);
  });

  it('accepts all known biyo block types', () => {
    const knownTypes = [
      'biyo_sine',
      'biyo_saw',
      'biyo_square',
      'biyo_triangle',
      'biyo_noise',
      'biyo_note',
      'biyo_reverb',
      'biyo_delay',
      'biyo_lowpass',
      'biyo_highpass',
      'biyo_distortion',
      'biyo_gain_up',
      'biyo_gain_down',
      'biyo_number',
      'biyo_bpm',
      'biyo_metro',
      'biyo_kick',
      'biyo_snare',
      'biyo_hihat',
      'biyo_clap',
      'biyo_sequencer',
      'biyo_drum_pattern',
      'biyo_euclidean',
      'biyo_mix',
      'biyo_envelope',
      'biyo_lfo_random',
      'biyo_random_melody',
      'biyo_arpeggio',
      'biyo_chord',
      'biyo_melody',
      'biyo_scale',
    ];

    for (const type of knownTypes) {
      const xml = `<xml><block type="${type}"></block></xml>`;
      const result = validateWorkspaceXml(xml);
      expect(result.valid).toBe(true);
    }
  });
});
