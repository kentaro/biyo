import * as Blockly from 'blockly';

const COLOUR = '#C44D62';

const NOTE_NAMES: [string, string][] = [
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

const OCTAVE_OPTIONS: [string, string][] = [
  ['すごくひくい', '2'],
  ['ひくい', '3'],
  ['ふつう', '4'],
  ['たかい', '5'],
  ['すごくたかい', '6'],
];

const biyo_sine = {
  type: 'biyo_sine',
  message0: 'ピー おと %1 たかさ %2',
  args0: [
    {
      type: 'field_dropdown',
      name: 'NOTE',
      options: NOTE_NAMES,
    },
    {
      type: 'field_dropdown',
      name: 'OCTAVE',
      options: OCTAVE_OPTIONS,
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'まるくてやさしいピーっていう音だよ。ドレミで音をえらんでね！',
  inputsInline: true,
};

const biyo_saw = {
  type: 'biyo_saw',
  message0: 'ブーン おと %1 たかさ %2',
  args0: [
    {
      type: 'field_dropdown',
      name: 'NOTE',
      options: NOTE_NAMES,
    },
    {
      type: 'field_dropdown',
      name: 'OCTAVE',
      options: OCTAVE_OPTIONS,
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ブーンってなるギザギザの音！ロボットみたいでかっこいいよ',
  inputsInline: true,
};

const biyo_triangle = {
  type: 'biyo_triangle',
  message0: 'ポコポコ おと %1 たかさ %2',
  args0: [
    {
      type: 'field_dropdown',
      name: 'NOTE',
      options: NOTE_NAMES,
    },
    {
      type: 'field_dropdown',
      name: 'OCTAVE',
      options: OCTAVE_OPTIONS,
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ポコポコやさしい音だよ。ふえみたいなかんじ！',
  inputsInline: true,
};

const biyo_square = {
  type: 'biyo_square',
  message0: 'プップー おと %1 たかさ %2',
  args0: [
    {
      type: 'field_dropdown',
      name: 'NOTE',
      options: NOTE_NAMES,
    },
    {
      type: 'field_dropdown',
      name: 'OCTAVE',
      options: OCTAVE_OPTIONS,
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'プップーってゲームっぽい音！むかしのゲームはこの音だったよ',
  inputsInline: true,
};

const biyo_noise = {
  type: 'biyo_noise',
  message0: '\u30B6\u30FC',
  args0: [],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u30C6\u30EC\u30D3\u306E\u3059\u306A\u3042\u3089\u3057\u307F\u305F\u3044\u306A\u30B6\u30FC\u3063\u3066\u3044\u3046\u97F3\uFF01',
  inputsInline: true,
};

const biyo_filtered_noise = {
  type: 'biyo_filtered_noise',
  message0: '\u30B7\u30E3\u30FC \u3042\u304B\u308B\u3055 %1',
  args0: [
    {
      type: 'field_dropdown',
      name: 'BRIGHTNESS',
      options: [
        ['\u304F\u3089\u3044', '500'],
        ['\u3075\u3064\u3046', '2000'],
        ['\u3042\u304B\u308B\u3044', '5000'],
        ['\u30AD\u30E9\u30AD\u30E9', '8000'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u30B7\u30E3\u30FC\u30C3\u3066\u3044\u3046\u304B\u305C\u306E\u97F3\u3002\u3042\u304B\u308B\u3055\u3067\u30AD\u30E9\u30AD\u30E9\u306B\u3082\u30E2\u30B3\u30E2\u30B3\u306B\u3082\u306A\u308B\u3088\uFF01',
  inputsInline: true,
};

const biyo_detune_saw = {
  type: 'biyo_detune_saw',
  message0: 'ビリビリ おと %1 たかさ %2 ずれ %3',
  args0: [
    {
      type: 'field_dropdown',
      name: 'NOTE',
      options: NOTE_NAMES,
    },
    {
      type: 'field_dropdown',
      name: 'OCTAVE',
      options: OCTAVE_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'DETUNE',
      options: [
        ['すこし', '0.5'],
        ['ふつう', '1'],
        ['おおきく', '3'],
        ['ぐにゃぐにゃ', '8'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ビリビリぶあつい音！3つの音がちょっとズレてかっこいいよ',
  inputsInline: true,
};

const biyo_kick = {
  type: 'biyo_kick',
  message0: '\u30C9\u30F3 \u304A\u3082\u3055 %1',
  args0: [
    {
      type: 'field_dropdown',
      name: 'FREQ',
      options: [
        ['\u3075\u304B\u3044', '40'],
        ['\u3075\u3064\u3046', '60'],
        ['\u304B\u308B\u3044', '80'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u30C9\u30F3\u30C9\u30F3\uFF01\u305F\u3044\u3053\u307F\u305F\u3044\u306A\u97F3\u3060\u3088\u3002\u30EA\u30BA\u30E0\u306E\u304D\u307B\u3093\uFF01',
  inputsInline: true,
};

const biyo_hihat = {
  type: 'biyo_hihat',
  message0: '\u30C1\u30C3 \u306A\u304C\u3055 %1',
  args0: [
    {
      type: 'field_dropdown',
      name: 'LENGTH',
      options: [
        ['\u307F\u3058\u304B\u3044', '0.02'],
        ['\u3075\u3064\u3046', '0.05'],
        ['\u306A\u304C\u3044', '0.15'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u30C1\u30C3\u30C1\u30C3\uFF01\u30B7\u30F3\u30D0\u30EB\u307F\u305F\u3044\u306A\u97F3\u3002\u306A\u304C\u3055\u3067\u304B\u308F\u308B\u3088',
  inputsInline: true,
};

const biyo_pluck = {
  type: 'biyo_pluck',
  message0: 'ポン おと %1 たかさ %2 のびる %3',
  args0: [
    {
      type: 'field_dropdown',
      name: 'NOTE',
      options: NOTE_NAMES,
    },
    {
      type: 'field_dropdown',
      name: 'OCTAVE',
      options: OCTAVE_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'SUSTAIN',
      options: [
        ['みじかい', '0.2'],
        ['ふつう', '0.5'],
        ['ながい', '1.0'],
        ['すごくながい', '2.0'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ポンッてはじく音！ギターやハープみたいだよ',
  inputsInline: true,
};

const biyo_microphone = {
  type: 'biyo_microphone',
  message0: '\u30DE\u30A4\u30AF \uD83C\uDFA4',
  args0: [],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u30DE\u30A4\u30AF\u304B\u3089\u304D\u3053\u3048\u308B\u97F3\u3060\u3088\uFF01\u3046\u305F\u3063\u305F\u308A\u3057\u3083\u3079\u3063\u305F\u308A\u3057\u3066\u307F\u3066\u306D',
  inputsInline: true,
};

const allBlocks = [
  biyo_sine,
  biyo_saw,
  biyo_triangle,
  biyo_square,
  biyo_noise,
  biyo_filtered_noise,
  biyo_detune_saw,
  biyo_kick,
  biyo_hihat,
  biyo_pluck,
  biyo_microphone,
];

for (const def of allBlocks) {
  Blockly.Blocks[def.type] = {
    init(this: Blockly.Block) {
      this.jsonInit(def);
    },
  };
}
