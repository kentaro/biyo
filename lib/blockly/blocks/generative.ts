import * as Blockly from 'blockly';

const COLOUR = '#7B68EE';

const BPM_OPTIONS: [string, string][] = [
  ['ゆっくり', '80'],
  ['ふつう', '120'],
  ['はやい', '160'],
  ['すごくはやい', '200'],
];

const OCTAVE_OPTIONS: [string, string][] = [
  ['ひくい', '3'],
  ['ふつう', '4'],
  ['たかい', '5'],
];

const biyo_random_melody = {
  type: 'biyo_random_melody',
  message0: 'ランダムメロディ おんかい %1 はやさ %2 たかさ %3',
  args0: [
    {
      type: 'field_dropdown',
      name: 'SCALE',
      options: [
        ['メジャー', 'major'],
        ['マイナー', 'minor'],
        ['ペンタトニック', 'pentatonic'],
      ] as [string, string][],
    },
    {
      type: 'field_dropdown',
      name: 'BPM',
      options: BPM_OPTIONS,
    },
    {
      type: 'field_dropdown',
      name: 'OCTAVE',
      options: OCTAVE_OPTIONS,
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    'サイコロをふるみたいに、えらんだおんかいからランダムにおとをならすよ！まいかいちがうメロディーがうまれるよ',
  inputsInline: true,
};

const biyo_euclidean = {
  type: 'biyo_euclidean',
  message0: 'ユークリッドリズム ヒット %1 ステップ %2 はやさ %3',
  args0: [
    {
      type: 'field_dropdown',
      name: 'HITS',
      options: [
        ['1', '1'],
        ['2', '2'],
        ['3', '3'],
        ['4', '4'],
        ['5', '5'],
        ['6', '6'],
        ['7', '7'],
        ['8', '8'],
      ] as [string, string][],
    },
    {
      type: 'field_dropdown',
      name: 'STEPS',
      options: [
        ['4', '4'],
        ['5', '5'],
        ['6', '6'],
        ['7', '7'],
        ['8', '8'],
        ['9', '9'],
        ['10', '10'],
        ['11', '11'],
        ['12', '12'],
        ['13', '13'],
        ['14', '14'],
        ['15', '15'],
        ['16', '16'],
      ] as [string, string][],
    },
    {
      type: 'field_dropdown',
      name: 'BPM',
      options: BPM_OPTIONS,
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    'ユークリッドリズム！ヒットをステップにきれいにならべるよ。せかいじゅうのリズムのもとになってるすごいアルゴリズムだよ！',
  inputsInline: true,
};

const biyo_lfo_random = {
  type: 'biyo_lfo_random',
  message0: 'ゆらぎ はやさ %1 はば %2',
  args0: [
    {
      type: 'field_dropdown',
      name: 'SPEED',
      options: [
        ['すごくゆっくり', '0.2'],
        ['ゆっくり', '0.5'],
        ['ふつう', '2'],
        ['はやい', '5'],
        ['すごくはやい', '10'],
      ] as [string, string][],
    },
    {
      type: 'field_dropdown',
      name: 'RANGE',
      options: [
        ['ちいさい', '0.2'],
        ['ふつう', '0.5'],
        ['おおきい', '0.8'],
        ['さいだい', '1.0'],
      ] as [string, string][],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ゆ〜らゆら、なめらかにかわるランダムなうごき！おとのたかさやおおきさにつなげてみよう',
  inputsInline: true,
};

const biyo_probability = {
  type: 'biyo_probability',
  message0: 'たまに %1 かくりつ %2',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'CHANCE',
      options: [
        ['25%', '25'],
        ['50%', '50'],
        ['75%', '75'],
        ['90%', '90'],
      ] as [string, string][],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'おとがとおったりとおらなかったり！かくりつできまるからまいかいちがうリズムになるよ',
  inputsInline: true,
};

const allBlocks = [biyo_random_melody, biyo_euclidean, biyo_lfo_random, biyo_probability];

for (const def of allBlocks) {
  Blockly.Blocks[def.type] = {
    init(this: Blockly.Block) {
      this.jsonInit(def);
    },
  };
}
