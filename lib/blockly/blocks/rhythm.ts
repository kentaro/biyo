import * as Blockly from 'blockly';

const COLOUR = '#3C843C';

const BPM_OPTIONS: [string, string][] = [
  ['\u3086\u3063\u304F\u308A', '80'],
  ['\u3075\u3064\u3046', '120'],
  ['\u306F\u3084\u3044', '160'],
  ['\u3059\u3054\u304F\u306F\u3084\u3044', '200'],
];

const NOTE_DROPDOWN_OPTIONS: [string, string][] = [
  ['\u30C9 (\u3072\u304F\u3044)', '48'],
  ['\u30EC (\u3072\u304F\u3044)', '50'],
  ['\u30DF (\u3072\u304F\u3044)', '52'],
  ['\u30D5\u30A1 (\u3072\u304F\u3044)', '53'],
  ['\u30BD (\u3072\u304F\u3044)', '55'],
  ['\u30E9 (\u3072\u304F\u3044)', '57'],
  ['\u30B7 (\u3072\u304F\u3044)', '59'],
  ['\u30C9', '60'],
  ['\u30EC', '62'],
  ['\u30DF', '64'],
  ['\u30D5\u30A1', '65'],
  ['\u30BD', '67'],
  ['\u30E9', '69'],
  ['\u30B7', '71'],
  ['\u30C9 (\u305F\u304B\u3044)', '72'],
  ['\u30EC (\u305F\u304B\u3044)', '74'],
  ['\u30DF (\u305F\u304B\u3044)', '76'],
];

const biyo_metro = {
  type: 'biyo_metro',
  message0: '\u30E1\u30C8\u30ED\u30CE\u30FC\u30E0 \u306F\u3084\u3055 %1 %2',
  args0: [
    {
      type: 'field_dropdown',
      name: 'BPM',
      options: BPM_OPTIONS,
    },
    {
      type: 'input_value',
      name: 'NEXT',
      check: 'Signal',
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u30AB\u30C1\u30AB\u30C1\u30AB\u30C1\uFF01\u30EA\u30BA\u30E0\u306B\u3042\u308F\u305B\u3066\u30AF\u30EA\u30C3\u30AF\u304C\u306A\u308B\u3088\u3002\u306F\u3084\u3055\u3092\u304B\u3048\u3066\u306D',
  inputsInline: true,
};

const biyo_sequencer = {
  type: 'biyo_sequencer',
  message0:
    '\u30BF\u30BF\u30BF\u30BF \u306F\u3084\u3055 %1 \u304A\u30681 %2 \u304A\u30682 %3 \u304A\u30683 %4 \u304A\u30684 %5 %6',
  args0: [
    {
      type: 'field_dropdown',
      name: 'BPM',
      options: BPM_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'NOTE1',
      options: NOTE_DROPDOWN_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'NOTE2',
      options: NOTE_DROPDOWN_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'NOTE3',
      options: NOTE_DROPDOWN_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'NOTE4',
      options: NOTE_DROPDOWN_OPTIONS,
    },
    {
      type: 'input_value',
      name: 'NEXT',
      check: 'Signal',
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u30BF\u30BF\u30BF\u30BF\uFF014\u3064\u306E\u97F3\u3092\u3058\u3085\u3093\u3070\u3093\u306B\u306A\u3089\u3059\u3088\u3002\u30E1\u30ED\u30C7\u30A3\u30FC\u304C\u3064\u304F\u308C\u308B\uFF01',
  inputsInline: true,
};

const biyo_drum_pattern = {
  type: 'biyo_drum_pattern',
  message0:
    '\u30C9\u30F3\u30BF\u30F3\u30C9\u30F3\u30BF\u30F3 \u306F\u3084\u3055 %1 \u30D1\u30BF\u30FC\u30F3 %2 %3',
  args0: [
    {
      type: 'field_dropdown',
      name: 'BPM',
      options: BPM_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'PATTERN',
      options: [
        ['\u30ED\u30C3\u30AF', 'rock'],
        ['\u30C6\u30AF\u30CE', 'techno'],
        ['\u30B8\u30E3\u30BA', 'jazz'],
        ['\u30B5\u30F3\u30D0', 'samba'],
      ],
    },
    {
      type: 'input_value',
      name: 'NEXT',
      check: 'Signal',
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u30C9\u30F3\u30BF\u30F3\u30C9\u30F3\u30BF\u30F3\uFF01\u3044\u308D\u3093\u306A\u30C9\u30E9\u30E0\u30D1\u30BF\u30FC\u30F3\u304C\u3048\u3089\u3079\u308B\u3088\u3002\u30ED\u30C3\u30AF\u3084\u30C6\u30AF\u30CE\u306B\u3061\u3087\u3046\u305B\u3093\uFF01',
  inputsInline: true,
};

const MELODY_NOTE_OPTIONS: [string, string][] = [
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
  ['ー', 'REST'],
];

const OCTAVE_OPTIONS: [string, string][] = [
  ['ひくい', '3'],
  ['ふつう', '4'],
  ['たかい', '5'],
];

const biyo_melody = {
  type: 'biyo_melody',
  message0:
    'メロディー たかさ %1 はやさ %2 ♪1 %3 ♪2 %4 ♪3 %5 ♪4 %6 ♪5 %7 ♪6 %8 ♪7 %9 ♪8 %10 %11',
  args0: [
    {
      type: 'field_dropdown',
      name: 'OCTAVE',
      options: OCTAVE_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'BPM',
      options: BPM_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'NOTE1',
      options: MELODY_NOTE_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'NOTE2',
      options: MELODY_NOTE_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'NOTE3',
      options: MELODY_NOTE_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'NOTE4',
      options: MELODY_NOTE_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'NOTE5',
      options: MELODY_NOTE_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'NOTE6',
      options: MELODY_NOTE_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'NOTE7',
      options: MELODY_NOTE_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'NOTE8',
      options: MELODY_NOTE_OPTIONS,
    },
    {
      type: 'input_value',
      name: 'NEXT',
      check: 'Signal',
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    'じぶんだけのメロディーをつくろう！8つのおとをじゅんばんにならすよ。「ー」はおやすみ（むおん）だよ',
  inputsInline: true,
};

const biyo_envelope = {
  type: 'biyo_envelope',
  message0: '\u306A\u3089\u3057\u3066 \u305F\u3061\u3042\u304C\u308A %1 \u306E\u3073\u308B %2 %3',
  args0: [
    {
      type: 'field_dropdown',
      name: 'ATTACK',
      options: [
        ['\u30D1\u30C3\u3068', '0.005'],
        ['\u3075\u3064\u3046', '0.05'],
        ['\u3086\u3063\u304F\u308A', '0.3'],
        ['\u3059\u3054\u304F\u3086\u3063\u304F\u308A', '1.0'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'RELEASE',
      options: [
        ['\u30D1\u30C3\u3068\u304D\u3048\u308B', '0.05'],
        ['\u3075\u3064\u3046', '0.3'],
        ['\u306A\u304C\u304F\u306E\u3073\u308B', '1.0'],
        ['\u3059\u3054\u304F\u306A\u304C\u3044', '3.0'],
      ],
    },
    {
      type: 'input_value',
      name: 'NEXT',
      check: 'Signal',
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u97F3\u306E\u304B\u305F\u3061\u3092\u304D\u3081\u308B\u3088\u3002\u30D1\u30C3\u3068\u3067\u3066\u30B9\u30FC\u30C3\u3068\u304D\u3048\u305F\u308A\u3001\u3086\u3063\u304F\u308A\u3067\u3066\u304D\u305F\u308A\uFF01',
  inputsInline: true,
};

const allBlocks = [biyo_metro, biyo_sequencer, biyo_melody, biyo_drum_pattern, biyo_envelope];

for (const def of allBlocks) {
  Blockly.Blocks[def.type] = {
    init(this: Blockly.Block) {
      this.jsonInit(def);
    },
  };
}
