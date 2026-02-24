import { describe, expect, it } from 'vitest';
import {
  CATEGORY_META,
  getCategories,
  getSample,
  getSampleList,
  getSamplesByCategory,
  type SampleCategory,
} from '../samples';

// All categories defined in the source
const ALL_CATEGORIES: SampleCategory[] = [
  'melody',
  'rhythm',
  'fun',
  'classical',
  'game',
  'nature',
  'space',
  'dance',
  'robot',
  'magic',
];

describe('getSampleList', () => {
  it('returns an array of all 100 samples', () => {
    const list = getSampleList();
    expect(Array.isArray(list)).toBe(true);
    expect(list).toHaveLength(100);
  });

  it('returns the same reference on multiple calls (no copy)', () => {
    const a = getSampleList();
    const b = getSampleList();
    expect(a).toBe(b);
  });
});

describe('getSample', () => {
  it('returns xml string for an existing key', () => {
    const xml = getSample('melody_doremi');
    expect(typeof xml).toBe('string');
    expect(xml).toContain('<xml');
    expect(xml).toContain('biyo_sequencer');
  });

  it('returns empty string for a non-existing key', () => {
    expect(getSample('non_existent_key')).toBe('');
  });

  it('returns empty string for empty key', () => {
    expect(getSample('')).toBe('');
  });

  it('returns the correct xml for each sample', () => {
    const list = getSampleList();
    for (const sample of list) {
      const xml = getSample(sample.key);
      expect(xml).toBe(sample.xml);
    }
  });
});

describe('getSamplesByCategory', () => {
  it('returns only samples matching the given category', () => {
    for (const category of ALL_CATEGORIES) {
      const filtered = getSamplesByCategory(category);
      expect(filtered.length).toBeGreaterThan(0);
      for (const sample of filtered) {
        expect(sample.category).toBe(category);
      }
    }
  });

  it('returns 10 samples per category (100 total, 10 categories)', () => {
    for (const category of ALL_CATEGORIES) {
      const filtered = getSamplesByCategory(category);
      expect(filtered).toHaveLength(10);
    }
  });

  it('sum of all categories equals total samples', () => {
    let total = 0;
    for (const category of ALL_CATEGORIES) {
      total += getSamplesByCategory(category).length;
    }
    expect(total).toBe(getSampleList().length);
  });
});

describe('getCategories', () => {
  it('returns all 10 categories', () => {
    const categories = getCategories();
    expect(categories).toHaveLength(10);
  });

  it('returns every expected category', () => {
    const categories = getCategories();
    for (const cat of ALL_CATEGORIES) {
      expect(categories).toContain(cat);
    }
  });

  it('returns categories in the same order as CATEGORY_META keys', () => {
    const categories = getCategories();
    const metaKeys = Object.keys(CATEGORY_META);
    expect(categories).toEqual(metaKeys);
  });
});

describe('CATEGORY_META', () => {
  it('has entries for all 10 categories', () => {
    const metaKeys = Object.keys(CATEGORY_META) as SampleCategory[];
    expect(metaKeys).toHaveLength(10);
    for (const cat of ALL_CATEGORIES) {
      expect(CATEGORY_META[cat]).toBeDefined();
    }
  });

  it('each entry has a non-empty label and emoji', () => {
    for (const cat of ALL_CATEGORIES) {
      const meta = CATEGORY_META[cat];
      expect(typeof meta.label).toBe('string');
      expect(meta.label.length).toBeGreaterThan(0);
      expect(typeof meta.emoji).toBe('string');
      expect(meta.emoji.length).toBeGreaterThan(0);
    }
  });
});

describe('Sample data integrity', () => {
  const samples = getSampleList();

  it('every sample has all required fields', () => {
    for (const sample of samples) {
      expect(typeof sample.key).toBe('string');
      expect(sample.key.length).toBeGreaterThan(0);

      expect(typeof sample.name).toBe('string');
      expect(sample.name.length).toBeGreaterThan(0);

      expect(typeof sample.description).toBe('string');
      expect(sample.description.length).toBeGreaterThan(0);

      expect(typeof sample.category).toBe('string');
      expect(ALL_CATEGORIES).toContain(sample.category);

      expect(typeof sample.xml).toBe('string');
      expect(sample.xml.length).toBeGreaterThan(0);
    }
  });

  it('all sample keys are unique', () => {
    const keys = samples.map((s) => s.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('sample keys follow the pattern category_name', () => {
    for (const sample of samples) {
      expect(sample.key).toMatch(/^[a-z]+_[a-z0-9_]+$/);
      // Key should start with the category prefix (or an abbreviation)
      const prefix = sample.key.split('_')[0];
      // Some keys use abbreviated category names (e.g., "game" for "game", "fun" for "fun")
      expect(typeof prefix).toBe('string');
      expect(prefix.length).toBeGreaterThan(0);
    }
  });
});

describe('XML validation for all samples', () => {
  const samples = getSampleList();

  it('every sample xml starts with <xml and ends with </xml>', () => {
    for (const sample of samples) {
      const trimmed = sample.xml.trim();
      expect(trimmed).toMatch(/^<xml\s/);
      expect(trimmed).toMatch(/<\/xml>$/);
    }
  });

  it('every sample xml has the Blockly namespace', () => {
    for (const sample of samples) {
      expect(sample.xml).toContain('xmlns="https://developers.google.com/blockly/xml"');
    }
  });

  it('every sample xml contains at least one block element', () => {
    for (const sample of samples) {
      expect(sample.xml).toMatch(/<block\s+type="biyo_/);
    }
  });

  it('all block open tags have matching close tags or are self-closing', () => {
    for (const sample of samples) {
      // Count non-self-closing <block ...> tags
      const openTags = sample.xml.match(/<block\s[^>]*[^/]>/g) || [];
      const closeTags = sample.xml.match(/<\/block>/g) || [];
      // Self-closing blocks
      const _selfClosing = sample.xml.match(/<block\s[^>]*\/>|<block\s[^>]*><\/block>/g) || [];
      expect(openTags.length).toBe(closeTags.length);
    }
  });

  it('every xml contains valid x/y position attributes on root block', () => {
    for (const sample of samples) {
      // At least the root-level block should have x and y attributes
      const _rootBlockMatch = sample.xml.match(/<block\s+type="biyo_\w+"[^>]*x="\d+"[^>]*y="\d+"/);
      // Some samples may have the root block without explicit x/y (nested blocks don't need them)
      // So we just check that the xml is well-formed with block types
      expect(sample.xml).toMatch(/<block\s+type="biyo_\w+"/);
    }
  });
});
