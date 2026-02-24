import * as Blockly from 'blockly';

const COLOUR = '#5BA58C';
const RHYTHM_COLOUR = '#59C059';
const EFFECTS_COLOUR = '#4C97FF';
const UTILITY_COLOUR = '#FFAB19';

const biyo_piano_note = {
  type: 'biyo_piano_note',
  message0: '\u304A\u3093\u3077 %1 \u30AA\u30AF\u30BF\u30FC\u30D6 %2',
  args0: [
    {
      type: 'field_dropdown',
      name: 'NOTE',
      options: [
        ['\u30C9', 'C'],
        ['\u30C9#', 'C#'],
        ['\u30EC', 'D'],
        ['\u30EC#', 'D#'],
        ['\u30DF', 'E'],
        ['\u30D5\u30A1', 'F'],
        ['\u30D5\u30A1#', 'F#'],
        ['\u30BD', 'G'],
        ['\u30BD#', 'G#'],
        ['\u30E9', 'A'],
        ['\u30E9#', 'A#'],
        ['\u30B7', 'B'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'OCTAVE',
      options: [
        ['\u3059\u3054\u304F\u3072\u304F\u3044', '2'],
        ['\u3072\u304F\u3044', '3'],
        ['\u3075\u3064\u3046', '4'],
        ['\u305F\u304B\u3044', '5'],
        ['\u3059\u3054\u304F\u305F\u304B\u3044', '6'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u30D4\u30A2\u30CE\u306E\u3051\u3093\u3070\u3093\u307F\u305F\u3044\u306B\u304A\u3093\u3077\u3092\u3048\u3089\u3076\u3088\u3002\u30C9\u30EC\u30DF\u3067\u304B\u3093\u305F\u3093\uFF01',
  inputsInline: true,
};

const biyo_bpm = {
  type: 'biyo_bpm',
  message0: '\u306F\u3084\u3055 %1',
  args0: [
    {
      type: 'field_dropdown',
      name: 'BPM',
      options: [
        ['\u3086\u3063\u304F\u308A', '80'],
        ['\u3075\u3064\u3046', '120'],
        ['\u306F\u3084\u3044', '160'],
        ['\u3059\u3054\u304F\u306F\u3084\u3044', '200'],
      ],
    },
  ],
  output: 'Signal',
  colour: RHYTHM_COLOUR,
  tooltip:
    '\u304D\u3087\u304F\u306E\u306F\u3084\u3055\u3092\u304D\u3081\u308B\u3088\u3002\u3059\u3054\u304F\u306F\u3084\u3044\u3068\u30CE\u30EA\u30CE\u30EA\uFF01',
  inputsInline: true,
};

const biyo_pingpong = {
  type: 'biyo_pingpong',
  message0:
    '\u30D4\u30F3\u30DD\u30F3 %1 \u3058\u304B\u3093 %2 \u304F\u308A\u304B\u3048\u3057 %3 \u307E\u305C\u308B %4',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'TIME',
      options: [
        ['\u307F\u3058\u304B\u3044', '0.1'],
        ['\u3075\u3064\u3046', '0.25'],
        ['\u306A\u304C\u3044', '0.5'],
        ['\u3059\u3054\u304F\u306A\u304C\u3044', '1.0'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'FEEDBACK',
      options: [
        ['\u3059\u3053\u3057', '0.2'],
        ['\u3075\u3064\u3046', '0.4'],
        ['\u305F\u304F\u3055\u3093', '0.7'],
        ['\u305A\u30FC\u3063\u3068', '0.9'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'MIX',
      options: [
        ['\u3059\u3053\u3057', '0.2'],
        ['\u3075\u3064\u3046', '0.5'],
        ['\u304A\u304A\u304F', '0.8'],
      ],
    },
  ],
  output: 'Signal',
  colour: EFFECTS_COLOUR,
  tooltip:
    '\u30D4\u30F3\u30DD\u30F3\u30D4\u30F3\u30DD\u30F3\uFF01\u97F3\u304C\u3072\u3060\u308A\u3068\u307F\u304E\u306B\u306F\u306D\u304B\u3048\u308B\u3088\uFF01',
  inputsInline: true,
};

const biyo_passthrough = {
  type: 'biyo_passthrough',
  message0: '\u305D\u306E\u307E\u307E %1',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
  ],
  output: 'Signal',
  colour: UTILITY_COLOUR,
  tooltip:
    '\u97F3\u3092\u305D\u306E\u307E\u307E\u3068\u304A\u3059\u3088\u3002\u306A\u306B\u3082\u3078\u3093\u304B\u3057\u306A\u3044\uFF01',
  inputsInline: true,
};

const allBlocks = [biyo_piano_note, biyo_bpm, biyo_pingpong, biyo_passthrough];

for (const def of allBlocks) {
  Blockly.Blocks[def.type] = {
    init(this: Blockly.Block) {
      this.jsonInit(def);
    },
  };
}
