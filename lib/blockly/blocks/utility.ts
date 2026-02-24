import * as Blockly from 'blockly';

const COLOUR = '#9F6A08';
const NOTES_COLOUR = '#468070';

const ROOT_OPTIONS: [string, string][] = [
  ['ド', 'C'],
  ['ド#', 'C#'],
  ['レ', 'D'],
  ['レ#', 'D#'],
  ['ミ', 'E'],
  ['ファ', 'F'],
  ['ファ#', 'F#'],
  ['ソ', 'G'],
  ['ソ#', 'G#'],
  ['ラ', 'A'],
  ['ラ#', 'A#'],
  ['シ', 'B'],
];

const biyo_scale = {
  type: 'biyo_scale',
  message0: 'おんかい ね %1 しゅるい %2 たかさ %3 はやさ %4',
  args0: [
    {
      type: 'field_dropdown',
      name: 'ROOT',
      options: ROOT_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'SCALE_TYPE',
      options: [
        ['メジャー', 'major'],
        ['マイナー', 'minor'],
        ['ペンタトニック', 'pentatonic'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'OCTAVE',
      options: [
        ['ひくい', '3'],
        ['ふつう', '4'],
        ['たかい', '5'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'SPEED',
      options: [
        ['ゆっくり', '80'],
        ['ふつう', '120'],
        ['はやい', '160'],
      ],
    },
  ],
  output: 'Signal',
  colour: NOTES_COLOUR,
  tooltip:
    'おんかいをじゅんばんにならすよ。メジャーはあかるい、マイナーはかなしい、ペンタトニックはかっこいい！',
  inputsInline: true,
};

const biyo_arpeggio = {
  type: 'biyo_arpeggio',
  message0: 'アルペジオ ね %1 しゅるい %2 はやさ %3',
  args0: [
    {
      type: 'field_dropdown',
      name: 'ROOT',
      options: ROOT_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'TYPE',
      options: [
        ['メジャー', 'major'],
        ['マイナー', 'minor'],
        ['セブンス', '7th'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'SPEED',
      options: [
        ['ゆっくり', '80'],
        ['ふつう', '120'],
        ['はやい', '160'],
        ['すごくはやい', '200'],
      ],
    },
  ],
  output: 'Signal',
  colour: NOTES_COLOUR,
  tooltip: 'わおんのおとをひとつずつじゅんばんにならすよ。きれいなメロディーになるよ！',
  inputsInline: true,
};

const biyo_mix = {
  type: 'biyo_mix',
  message0: '\u307E\u305C\u307E\u305C %1 \u3068 %2 \u30D0\u30E9\u30F3\u30B9 %3',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL_A',
      check: 'Signal',
    },
    {
      type: 'input_value',
      name: 'SIGNAL_B',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'BALANCE',
      options: [
        ['\u3072\u3060\u308A\u304A\u304A\u3081', '0.25'],
        ['\u307E\u3093\u306A\u304B', '0.5'],
        ['\u307F\u304E\u304A\u304A\u3081', '0.75'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '2\u3064\u306E\u97F3\u3092\u307E\u305C\u307E\u305C\uFF01\u30D0\u30E9\u30F3\u30B9\u3067\u3069\u3063\u3061\u3092\u304A\u304A\u304F\u3059\u308B\u304B\u304D\u3081\u308B\u3088',
  inputsInline: true,
};

const biyo_number = {
  type: 'biyo_number',
  message0: '\u3059\u3046\u3058 %1',
  args0: [
    {
      type: 'field_number',
      name: 'VALUE',
      value: 0,
      precision: 0.01,
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u3059\u304D\u306A\u3059\u3046\u3058\u3092\u3044\u308C\u308B\u3088\u3002\u305F\u304B\u3055\u3084\u306F\u3084\u3055\u306B\u3064\u304B\u3048\u308B\u3088\uFF01',
  inputsInline: true,
};

const biyo_note = {
  type: 'biyo_note',
  message0: '\u30C9\u30EC\u30DF %1 \u30AA\u30AF\u30BF\u30FC\u30D6 %2',
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
  colour: NOTES_COLOUR,
  tooltip:
    '\u30C9\u30EC\u30DF\u30D5\u30A1\u30BD\u30E9\u30B7\u304B\u3089\u97F3\u3092\u3048\u3089\u3076\u3088\u3002\u3051\u3093\u3070\u3093\u307F\u305F\u3044\uFF01',
  inputsInline: true,
};

const biyo_chord = {
  type: 'biyo_chord',
  message0: '\u308F\u304A\u3093 \u306D %1 \u3057\u3085\u308B\u3044 %2',
  args0: [
    {
      type: 'field_dropdown',
      name: 'ROOT',
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
      name: 'TYPE',
      options: [
        ['\u30E1\u30B8\u30E3\u30FC', 'major'],
        ['\u30DE\u30A4\u30CA\u30FC', 'minor'],
        ['\u30BB\u30D6\u30F3\u30B9', '7th'],
      ],
    },
  ],
  output: 'Signal',
  colour: NOTES_COLOUR,
  tooltip:
    '3\u3064\u306E\u97F3\u3092\u3044\u3063\u3057\u3087\u306B\u306A\u3089\u3057\u3066\u30CF\u30FC\u30E2\u30CB\u30FC\uFF01\u30E1\u30B8\u30E3\u30FC\u306F\u3042\u304B\u308B\u3044\u3001\u30DE\u30A4\u30CA\u30FC\u306F\u304B\u306A\u3057\u3044\u97F3',
  inputsInline: true,
};

const biyo_multiply = {
  type: 'biyo_multiply',
  message0: '\u304B\u3051\u3056\u3093 %1 \u3068 %2',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL_A',
      check: 'Signal',
    },
    {
      type: 'input_value',
      name: 'SIGNAL_B',
      check: 'Signal',
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '2\u3064\u306E\u97F3\u3092\u304B\u3051\u3042\u308F\u305B\u3066\u3075\u3057\u304E\u306A\u97F3\u3092\u3064\u304F\u308B\u3088\u3002\u30ED\u30DC\u30C3\u30C8\u3063\u307D\u304F\u306A\u308B\uFF01',
  inputsInline: true,
};

const biyo_invert = {
  type: 'biyo_invert',
  message0: '\u3072\u3063\u304F\u308A\u304B\u3048\u3057 %1',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u97F3\u306E\u306A\u307F\u3092\u3072\u3063\u304F\u308A\u304B\u3048\u3059\u3088\u3002\u307E\u305C\u308B\u3068\u304A\u3082\u3057\u308D\u3044\u3053\u3068\u304C\u304A\u304D\u308B\uFF01',
  inputsInline: true,
};

const allBlocks = [
  biyo_mix,
  biyo_number,
  biyo_note,
  biyo_chord,
  biyo_multiply,
  biyo_invert,
  biyo_scale,
  biyo_arpeggio,
];

for (const def of allBlocks) {
  Blockly.Blocks[def.type] = {
    init(this: Blockly.Block) {
      this.jsonInit(def);
    },
  };
}
