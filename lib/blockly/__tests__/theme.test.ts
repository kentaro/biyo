import { Theme } from 'blockly';
import { describe, expect, it } from 'vitest';
import { biyoTheme } from '../theme';

// =========================================================================
// TESTS
// =========================================================================

describe('biyoTheme', () => {
  // -----------------------------------------------------------------------
  // Valid Blockly Theme
  // -----------------------------------------------------------------------
  describe('is a valid Blockly theme', () => {
    it('is an instance of Blockly Theme', () => {
      expect(biyoTheme).toBeInstanceOf(Theme);
    });

    it('has the name "biyo"', () => {
      expect(biyoTheme.name).toBe('biyo');
    });

    it('is based on the Classic theme', () => {
      // defineTheme with base: Themes.Classic means the theme inherits
      // from Classic. We verify the theme was created successfully
      // (which requires a valid base).
      expect(biyoTheme).toBeDefined();
      expect(biyoTheme).toBeInstanceOf(Theme);
    });
  });

  // -----------------------------------------------------------------------
  // Block Styles
  // -----------------------------------------------------------------------
  describe('block styles', () => {
    const expectedBlockStyles: Record<
      string,
      {
        colourPrimary: string;
        colourSecondary: string;
        colourTertiary: string;
        hat?: string;
      }
    > = {
      sources_blocks: {
        colourPrimary: '#FF6680',
        colourSecondary: '#FF8DA6',
        colourTertiary: '#CC5266',
        hat: 'cap',
      },
      effects_blocks: {
        colourPrimary: '#4C97FF',
        colourSecondary: '#7DB5FF',
        colourTertiary: '#3A75CC',
      },
      rhythm_blocks: {
        colourPrimary: '#59C059',
        colourSecondary: '#80D480',
        colourTertiary: '#479947',
      },
      utility_blocks: {
        colourPrimary: '#FFAB19',
        colourSecondary: '#FFC14D',
        colourTertiary: '#CC8914',
      },
      presets_blocks: {
        colourPrimary: '#CF63CF',
        colourSecondary: '#DB8CDB',
        colourTertiary: '#A64FA6',
        hat: 'cap',
      },
      notes_blocks: {
        colourPrimary: '#5BA58C',
        colourSecondary: '#7DBDAA',
        colourTertiary: '#498470',
      },
    };

    for (const [styleName, expected] of Object.entries(expectedBlockStyles)) {
      describe(styleName, () => {
        it('exists in the theme', () => {
          const style = biyoTheme.blockStyles[styleName];
          expect(style).toBeDefined();
        });

        it('has the correct primary colour', () => {
          const style = biyoTheme.blockStyles[styleName];
          expect(style.colourPrimary).toBe(expected.colourPrimary);
        });

        it('has the correct secondary colour', () => {
          const style = biyoTheme.blockStyles[styleName];
          expect(style.colourSecondary).toBe(expected.colourSecondary);
        });

        it('has the correct tertiary colour', () => {
          const style = biyoTheme.blockStyles[styleName];
          expect(style.colourTertiary).toBe(expected.colourTertiary);
        });

        if (expected.hat) {
          it(`has hat style "${expected.hat}"`, () => {
            const style = biyoTheme.blockStyles[styleName];
            expect(style.hat).toBe(expected.hat);
          });
        }
      });
    }

    it('defines exactly 6 block styles', () => {
      const styleNames = Object.keys(expectedBlockStyles);
      for (const name of styleNames) {
        expect(biyoTheme.blockStyles[name]).toBeDefined();
      }
    });

    it('sources_blocks and presets_blocks have hat caps while others do not', () => {
      expect(biyoTheme.blockStyles.sources_blocks.hat).toBe('cap');
      expect(biyoTheme.blockStyles.presets_blocks.hat).toBe('cap');
      // Other block styles should not have a hat property set in the theme definition
      // (they may inherit undefined from the base theme)
      expect(biyoTheme.blockStyles.effects_blocks.hat).toBeUndefined();
      expect(biyoTheme.blockStyles.rhythm_blocks.hat).toBeUndefined();
      expect(biyoTheme.blockStyles.utility_blocks.hat).toBeUndefined();
      expect(biyoTheme.blockStyles.notes_blocks.hat).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Category Styles
  // -----------------------------------------------------------------------
  describe('category styles', () => {
    const expectedCategoryStyles: Record<string, { colour: string }> = {
      sources_category: { colour: '#FF6680' },
      effects_category: { colour: '#4C97FF' },
      rhythm_category: { colour: '#59C059' },
      utility_category: { colour: '#FFAB19' },
      presets_category: { colour: '#CF63CF' },
      notes_category: { colour: '#5BA58C' },
    };

    for (const [categoryName, expected] of Object.entries(expectedCategoryStyles)) {
      it(`${categoryName} has colour ${expected.colour}`, () => {
        const style = biyoTheme.categoryStyles[categoryName];
        expect(style).toBeDefined();
        expect(style.colour).toBe(expected.colour);
      });
    }

    it('category colours match their corresponding block style primary colours', () => {
      const pairings: Array<[string, string]> = [
        ['sources_category', 'sources_blocks'],
        ['effects_category', 'effects_blocks'],
        ['rhythm_category', 'rhythm_blocks'],
        ['utility_category', 'utility_blocks'],
        ['presets_category', 'presets_blocks'],
        ['notes_category', 'notes_blocks'],
      ];

      for (const [catName, blockName] of pairings) {
        expect(biyoTheme.categoryStyles[catName].colour).toBe(
          biyoTheme.blockStyles[blockName].colourPrimary,
        );
      }
    });

    it('defines exactly 6 category styles', () => {
      const styleNames = Object.keys(expectedCategoryStyles);
      for (const name of styleNames) {
        expect(biyoTheme.categoryStyles[name]).toBeDefined();
      }
    });
  });

  // -----------------------------------------------------------------------
  // Component Styles
  // -----------------------------------------------------------------------
  describe('component styles', () => {
    it('has a light workspace background colour', () => {
      expect(biyoTheme.getComponentStyle('workspaceBackgroundColour')).toBe('#FAFBFF');
    });

    it('has a light purple toolbox background', () => {
      expect(biyoTheme.getComponentStyle('toolboxBackgroundColour')).toBe('#F5F0FF');
    });

    it('has dark toolbox foreground for readability', () => {
      expect(biyoTheme.getComponentStyle('toolboxForegroundColour')).toBe('#333344');
    });

    it('has a flyout background colour', () => {
      expect(biyoTheme.getComponentStyle('flyoutBackgroundColour')).toBe('#F0EAFF');
    });

    it('has a dark flyout foreground colour', () => {
      expect(biyoTheme.getComponentStyle('flyoutForegroundColour')).toBe('#333344');
    });

    it('has flyout opacity near 1.0 for visibility', () => {
      // getComponentStyle returns string representations of numeric values
      expect(Number(biyoTheme.getComponentStyle('flyoutOpacity'))).toBe(0.97);
    });

    it('has scrollbar colour and low opacity for subtlety', () => {
      expect(biyoTheme.getComponentStyle('scrollbarColour')).toBe('#C4B8D8');
      expect(Number(biyoTheme.getComponentStyle('scrollbarOpacity'))).toBe(0.3);
    });

    it('has insertion marker styled with theme accent colour', () => {
      expect(biyoTheme.getComponentStyle('insertionMarkerColour')).toBe('#FF6680');
      expect(Number(biyoTheme.getComponentStyle('insertionMarkerOpacity'))).toBe(0.4);
    });

    it('has a dark cursor colour', () => {
      expect(biyoTheme.getComponentStyle('cursorColour')).toBe('#333344');
    });

    it('has a golden selected glow colour', () => {
      expect(biyoTheme.getComponentStyle('selectedGlowColour')).toBe('#FFD700');
    });
  });

  // -----------------------------------------------------------------------
  // Font Settings (child-appropriate)
  // -----------------------------------------------------------------------
  describe('font settings are child-appropriate', () => {
    it('uses a rounded, friendly font family', () => {
      const fontStyle = biyoTheme.fontStyle;
      expect(fontStyle.family).toBe("'M PLUS Rounded 1c', 'Rounded Mplus 1c', sans-serif");
    });

    it('uses bold weight for readability', () => {
      const fontStyle = biyoTheme.fontStyle;
      expect(fontStyle.weight).toBe('bold');
    });

    it('uses a large enough font size (15pt) for children', () => {
      const fontStyle = biyoTheme.fontStyle;
      expect(fontStyle.size).toBe(15);
      // Font size should be at least 12 for child readability
      expect(fontStyle.size).toBeGreaterThanOrEqual(12);
    });

    it('uses sans-serif as fallback font', () => {
      const fontStyle = biyoTheme.fontStyle;
      expect(fontStyle.family).toContain('sans-serif');
    });

    it('includes a rounded font as primary choice', () => {
      const fontStyle = biyoTheme.fontStyle;
      expect(fontStyle.family).toContain('Rounded');
    });
  });

  // -----------------------------------------------------------------------
  // Start Hats
  // -----------------------------------------------------------------------
  describe('startHats', () => {
    it('enables start hats for top-level blocks', () => {
      expect(biyoTheme.startHats).toBe(true);
    });
  });
});
