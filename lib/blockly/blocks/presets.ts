import * as Blockly from 'blockly';

const COLOUR = '#B050B0';

const biyo_robot_voice = {
  type: 'biyo_robot_voice',
  message0: 'ロボットこえ ぼいん %1',
  args0: [
    {
      type: 'field_dropdown',
      name: 'VOWEL',
      options: [
        ['あ', 'a'],
        ['い', 'i'],
        ['う', 'u'],
        ['え', 'e'],
        ['お', 'o'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ワレワレハ ウチュウジンダ！ロボットがしゃべってるみたいな音だよ',
  inputsInline: true,
};

const biyo_space = {
  type: 'biyo_space',
  message0: 'うちゅう',
  args0: [],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'キラキラ〜ってうちゅうをただよってるみたいなふしぎな音！',
  inputsInline: true,
};

const biyo_water_drop = {
  type: 'biyo_water_drop',
  message0: 'ぽちゃん',
  args0: [],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ぽちゃん！みずのしずくがおちるかわいい音だよ',
  inputsInline: true,
};

const biyo_ghost = {
  type: 'biyo_ghost',
  message0: 'おばけ',
  args0: [],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ヒュ〜ドロドロ〜！おばけがでてきそうなこわ〜い音！',
  inputsInline: true,
};

const biyo_siren = {
  type: 'biyo_siren',
  message0: 'サイレン',
  args0: [],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ウーウー！パトカーみたいなサイレンの音！',
  inputsInline: true,
};

const biyo_laser = {
  type: 'biyo_laser',
  message0: 'レーザー',
  args0: [],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ビビビビ！SFえいがのレーザービームみたいな音！',
  inputsInline: true,
};

const biyo_ufo = {
  type: 'biyo_ufo',
  message0: 'UFO',
  args0: [],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ヒョ〜ン！UFOがとんでいくみたいなふしぎな音だよ',
  inputsInline: true,
};

const biyo_bubbles = {
  type: 'biyo_bubbles',
  message0: 'ぶくぶく',
  args0: [],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ぶくぶくぶく〜！すいちゅうであわがでてるみたいな音！',
  inputsInline: true,
};

const biyo_thunder = {
  type: 'biyo_thunder',
  message0: 'かみなり',
  args0: [],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ゴロゴロ ドカーン！かみなりがおちてくる音！',
  inputsInline: true,
};

const biyo_famicom = {
  type: 'biyo_famicom',
  message0: 'ファミコン わおん %1',
  args0: [
    {
      type: 'field_dropdown',
      name: 'CHORD',
      options: [
        ['ドメジャー', 'C_major'],
        ['レマイナー', 'D_minor'],
        ['ミマイナー', 'E_minor'],
        ['ファメジャー', 'F_major'],
        ['ソメジャー', 'G_major'],
        ['ラマイナー', 'A_minor'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'ピコピコ！むかしのゲームみたいな8ビットの音！',
  inputsInline: true,
};

const biyo_clap = {
  type: 'biyo_clap',
  message0: 'はくしゅ',
  args0: [],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'パチパチパチ！みんなではくしゅ！',
  inputsInline: true,
};

const biyo_snare = {
  type: 'biyo_snare',
  message0: 'スネア',
  args0: [],
  output: 'Signal',
  colour: COLOUR,
  tooltip: 'タンッ！こだいこみたいなスネアドラムの音！',
  inputsInline: true,
};

const allBlocks = [
  biyo_robot_voice,
  biyo_space,
  biyo_water_drop,
  biyo_ghost,
  biyo_siren,
  biyo_laser,
  biyo_ufo,
  biyo_bubbles,
  biyo_thunder,
  biyo_famicom,
  biyo_clap,
  biyo_snare,
];

for (const def of allBlocks) {
  Blockly.Blocks[def.type] = {
    init(this: Blockly.Block) {
      this.jsonInit(def);
    },
  };
}
