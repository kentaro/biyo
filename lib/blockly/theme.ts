import { Theme, Themes } from 'blockly';

export const biyoTheme = Theme.defineTheme('biyo', {
  name: 'biyo',
  base: Themes.Classic as Theme,
  blockStyles: {
    sources_blocks: {
      colourPrimary: '#C44D62',
      colourSecondary: '#D4768A',
      colourTertiary: '#9D3E4E',
      hat: 'cap',
    },
    effects_blocks: {
      colourPrimary: '#3976C6',
      colourSecondary: '#6A9AD6',
      colourTertiary: '#2E5E9E',
    },
    rhythm_blocks: {
      colourPrimary: '#3C843C',
      colourSecondary: '#6AA66A',
      colourTertiary: '#306A30',
    },
    utility_blocks: {
      colourPrimary: '#9F6A08',
      colourSecondary: '#BF8E3A',
      colourTertiary: '#7F5506',
    },
    presets_blocks: {
      colourPrimary: '#B050B0',
      colourSecondary: '#C47CC4',
      colourTertiary: '#8D408D',
      hat: 'cap',
    },
    notes_blocks: {
      colourPrimary: '#468070',
      colourSecondary: '#72A396',
      colourTertiary: '#38665A',
    },
    generative_blocks: {
      colourPrimary: '#7060E0',
      colourSecondary: '#9488E8',
      colourTertiary: '#5A4DB3',
    },
  },
  categoryStyles: {
    sources_category: { colour: '#C44D62' },
    effects_category: { colour: '#3976C6' },
    rhythm_category: { colour: '#3C843C' },
    utility_category: { colour: '#9F6A08' },
    presets_category: { colour: '#B050B0' },
    notes_category: { colour: '#468070' },
    generative_category: { colour: '#7060E0' },
  },
  componentStyles: {
    workspaceBackgroundColour: '#FAFBFF',
    toolboxBackgroundColour: '#F5F0FF',
    toolboxForegroundColour: '#333344',
    flyoutBackgroundColour: '#F0EAFF',
    flyoutForegroundColour: '#333344',
    flyoutOpacity: 0.97,
    scrollbarColour: '#C4B8D8',
    scrollbarOpacity: 0.3,
    insertionMarkerColour: '#C44D62',
    insertionMarkerOpacity: 0.4,
    cursorColour: '#333344',
    selectedGlowColour: '#FFD700',
  },
  fontStyle: {
    family: "'M PLUS Rounded 1c', 'Rounded Mplus 1c', sans-serif",
    weight: 'bold',
    size: 15,
  },
  startHats: true,
});
