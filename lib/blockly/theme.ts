import { Theme, Themes } from 'blockly';

export const biyoTheme = Theme.defineTheme('biyo', {
  name: 'biyo',
  base: Themes.Classic as Theme,
  blockStyles: {
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
    generative_blocks: {
      colourPrimary: '#7B68EE',
      colourSecondary: '#9D8DF2',
      colourTertiary: '#6253BE',
    },
  },
  categoryStyles: {
    sources_category: { colour: '#FF6680' },
    effects_category: { colour: '#4C97FF' },
    rhythm_category: { colour: '#59C059' },
    utility_category: { colour: '#FFAB19' },
    presets_category: { colour: '#CF63CF' },
    notes_category: { colour: '#5BA58C' },
    generative_category: { colour: '#7B68EE' },
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
    insertionMarkerColour: '#FF6680',
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
