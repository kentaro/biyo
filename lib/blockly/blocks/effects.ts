import * as Blockly from 'blockly';

const COLOUR = '#3976C6';

const biyo_lowpass = {
  type: 'biyo_lowpass',
  message0: '\u30E2\u30B3\u30E2\u30B3 %1 \u3064\u3088\u3055 %2 \u304D\u3087\u3046\u3069 %3',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'CUTOFF',
      options: [
        ['\u3061\u3087\u3063\u3068', '3000'],
        ['\u3075\u3064\u3046', '1000'],
        ['\u3059\u3054\u304F', '300'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'RESONANCE',
      options: [
        ['\u3088\u308F\u3044', '0.5'],
        ['\u3075\u3064\u3046', '1'],
        ['\u3064\u3088\u3044', '5'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u97F3\u3092\u3084\u308F\u3089\u304B\u304F\u3059\u308B\u3088\u3002\u3064\u3088\u3055\u3092\u3042\u3052\u308B\u3068\u30E2\u30B3\u30E2\u30B3\u306B\u306A\u308B\u3088\uFF01',
  inputsInline: true,
};

const biyo_highpass = {
  type: 'biyo_highpass',
  message0: '\u30AD\u30E9\u30AD\u30E9 %1 \u3064\u3088\u3055 %2 \u304D\u3087\u3046\u3069 %3',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'CUTOFF',
      options: [
        ['\u3061\u3087\u3063\u3068', '500'],
        ['\u3075\u3064\u3046', '1000'],
        ['\u3059\u3054\u304F', '3000'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'RESONANCE',
      options: [
        ['\u3088\u308F\u3044', '0.5'],
        ['\u3075\u3064\u3046', '1'],
        ['\u3064\u3088\u3044', '5'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u3072\u304F\u3044\u97F3\u3092\u3051\u305A\u3063\u3066\u30AD\u30E9\u30AD\u30E9\u306B\u3059\u308B\u3088\u3002\u3064\u3088\u3055\u3092\u3042\u3052\u308B\u3068\u30B9\u30C3\u30AD\u30EA\uFF01',
  inputsInline: true,
};

const biyo_bandpass = {
  type: 'biyo_bandpass',
  message0: '\u30EF\u30F3\u30EF\u30F3 %1 \u305F\u304B\u3055 %2 \u306F\u3070 %3',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'CENTER',
      options: [
        ['\u3072\u304F\u3044', '300'],
        ['\u3075\u3064\u3046', '1000'],
        ['\u305F\u304B\u3044', '3000'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'WIDTH',
      options: [
        ['\u305B\u307E\u3044', '100'],
        ['\u3075\u3064\u3046', '500'],
        ['\u3072\u308D\u3044', '2000'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u30EF\u30F3\u30EF\u30F3\u3063\u3066\u3057\u3083\u3079\u308B\u307F\u305F\u3044\u306A\u97F3\uFF01\u307E\u3093\u306A\u304B\u306E\u97F3\u3060\u3051\u3068\u304A\u3059\u3088',
  inputsInline: true,
};

const biyo_delay = {
  type: 'biyo_delay',
  message0:
    '\u3084\u307E\u3073\u3053 %1 \u3058\u304B\u3093 %2 \u304F\u308A\u304B\u3048\u3057 %3 \u307E\u305C\u308B %4',
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
        ['\u3075\u3064\u3046', '0.3'],
        ['\u306A\u304C\u3044', '0.6'],
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
  colour: COLOUR,
  tooltip:
    '\u3084\u307E\u3073\u3053\u307F\u305F\u3044\u306B\u97F3\u304C\u304F\u308A\u304B\u3048\u3059\u3088\u3002\u30E4\u30C3\u30DB\u30FC\uFF01',
  inputsInline: true,
};

const biyo_reverb = {
  type: 'biyo_reverb',
  message0:
    '\u304A\u3075\u308D %1 \u3072\u308D\u3055 %2 \u3084\u308F\u3089\u304B\u3055 %3 \u307E\u305C\u308B %4',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'SIZE',
      options: [
        ['\u3061\u3044\u3055\u3044\u3078\u3084', '0.3'],
        ['\u3075\u3064\u3046\u306E\u3078\u3084', '0.6'],
        ['\u304A\u304A\u304D\u3044\u3078\u3084', '0.85'],
        ['\u3069\u3046\u304F\u3064', '1.0'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'DAMPING',
      options: [
        ['\u30AB\u30C1\u30AB\u30C1', '0.2'],
        ['\u3075\u3064\u3046', '0.5'],
        ['\u3075\u308F\u3075\u308F', '0.8'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'MIX',
      options: [
        ['\u3059\u3053\u3057', '0.15'],
        ['\u3075\u3064\u3046', '0.3'],
        ['\u304A\u304A\u304F', '0.6'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u304A\u3075\u308D\u3084\u3069\u3046\u304F\u3064\u3067\u3046\u305F\u3063\u3066\u308B\u307F\u305F\u3044\u306B\u3072\u3073\u304F\u3088\uFF01',
  inputsInline: true,
};

const biyo_tremolo = {
  type: 'biyo_tremolo',
  message0: '\u30D6\u30EB\u30D6\u30EB %1 \u306F\u3084\u3055 %2 \u3075\u304B\u3055 %3',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'SPEED',
      options: [
        ['\u3086\u3063\u304F\u308A', '2'],
        ['\u3075\u3064\u3046', '5'],
        ['\u306F\u3084\u3044', '10'],
        ['\u3059\u3054\u304F\u306F\u3084\u3044', '18'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'DEPTH',
      options: [
        ['\u3059\u3053\u3057', '0.2'],
        ['\u3075\u3064\u3046', '0.5'],
        ['\u3064\u3088\u3044', '0.8'],
        ['\u3059\u3054\u304F', '1.0'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u30D6\u30EB\u30D6\u30EB\u30D6\u30EB\u3063\u3066\u97F3\u304C\u304A\u304A\u304D\u304F\u306A\u3063\u305F\u308A\u3061\u3044\u3055\u304F\u306A\u3063\u305F\u308A\u3059\u308B\u3088\uFF01',
  inputsInline: true,
};

const biyo_autowah = {
  type: 'biyo_autowah',
  message0: '\u3046\u306B\u3087\u3046\u306B\u3087 %1 \u306F\u3084\u3055 %2 \u3075\u304B\u3055 %3',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'SPEED',
      options: [
        ['\u3086\u3063\u304F\u308A', '0.5'],
        ['\u3075\u3064\u3046', '2'],
        ['\u306F\u3084\u3044', '6'],
        ['\u3059\u3054\u304F\u306F\u3084\u3044', '15'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'DEPTH',
      options: [
        ['\u3059\u3053\u3057', '0.2'],
        ['\u3075\u3064\u3046', '0.5'],
        ['\u3064\u3088\u3044', '0.8'],
        ['\u3059\u3054\u304F', '1.0'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u3046\u306B\u3087\u3046\u306B\u3087\u301C\u3063\u3066\u30D5\u30A3\u30EB\u30BF\u30FC\u304C\u3058\u3069\u3046\u3067\u3046\u3054\u304F\u3088\uFF01\u30D5\u30A1\u30F3\u30AD\u30FC\uFF01',
  inputsInline: true,
};

const biyo_vibrato = {
  type: 'biyo_vibrato',
  message0: '\u3050\u306B\u3083\u3050\u306B\u3083 %1 \u306F\u3084\u3055 %2 \u3075\u304B\u3055 %3',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'SPEED',
      options: [
        ['\u3086\u3063\u304F\u308A', '2'],
        ['\u3075\u3064\u3046', '5'],
        ['\u306F\u3084\u3044', '10'],
        ['\u3059\u3054\u304F\u306F\u3084\u3044', '18'],
      ],
    },
    {
      type: 'field_dropdown',
      name: 'DEPTH',
      options: [
        ['\u3059\u3053\u3057', '0.1'],
        ['\u3075\u3064\u3046', '0.3'],
        ['\u3064\u3088\u3044', '0.6'],
        ['\u3059\u3054\u304F', '1.0'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u3050\u306B\u3083\u3050\u306B\u3083\u301C\u3063\u3066\u97F3\u306E\u305F\u304B\u3055\u304C\u3086\u308C\u308B\u3088\u3002\u3046\u305F\u307F\u305F\u3044\uFF01',
  inputsInline: true,
};

const biyo_distortion = {
  type: 'biyo_distortion',
  message0: '\u30D1\u30EA\u30D1\u30EA %1 \u3064\u3088\u3055 %2',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'DRIVE',
      options: [
        ['\u3061\u3087\u3063\u3068', '2'],
        ['\u3075\u3064\u3046', '5'],
        ['\u3064\u3088\u3044', '15'],
        ['\u30AC\u30EA\u30AC\u30EA', '40'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u30D1\u30EA\u30D1\u30EA\u30D0\u30EA\u30D0\u30EA\uFF01\u30ED\u30C3\u30AF\u30AE\u30BF\u30FC\u307F\u305F\u3044\u306B\u3086\u304C\u3080\u3088\uFF01',
  inputsInline: true,
};

const biyo_gain_up = {
  type: 'biyo_gain_up',
  message0: '\u3067\u304B\u3067\u304B %1 \u304A\u304A\u304D\u3055 %2',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'GAIN',
      options: [
        ['\u3061\u3087\u3063\u3068', '1.3'],
        ['\u3075\u3064\u3046', '1.5'],
        ['\u3059\u3054\u304F', '2.5'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u97F3\u3092\u304A\u304A\u304D\u304F\u3059\u308B\u3088\uFF01\u30DC\u30EA\u30E5\u30FC\u30E0\u30A2\u30C3\u30D7\uFF01',
  inputsInline: true,
};

const biyo_gain_down = {
  type: 'biyo_gain_down',
  message0: '\u3061\u3044\u3055\u304F %1 \u3061\u3044\u3055\u3055 %2',
  args0: [
    {
      type: 'input_value',
      name: 'SIGNAL',
      check: 'Signal',
    },
    {
      type: 'field_dropdown',
      name: 'AMOUNT',
      options: [
        ['\u3061\u3087\u3063\u3068', '0.7'],
        ['\u3075\u3064\u3046', '0.5'],
        ['\u3059\u3054\u304F', '0.2'],
      ],
    },
  ],
  output: 'Signal',
  colour: COLOUR,
  tooltip:
    '\u97F3\u3092\u3061\u3044\u3055\u304F\u3059\u308B\u3088\u3002\u304A\u304A\u304D\u3059\u304E\u308B\u3068\u304D\u306B\u3064\u304B\u3063\u3066\u306D',
  inputsInline: true,
};

const biyo_telephone = {
  type: 'biyo_telephone',
  message0: '\u3067\u3093\u308F %1',
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
    '\u3082\u3057\u3082\u3057\uFF1F\u3067\u3093\u308F\u3054\u3057\u307F\u305F\u3044\u306A\u3053\u3082\u3063\u305F\u97F3\u306B\u306A\u308B\u3088\uFF01',
  inputsInline: true,
};

const allBlocks = [
  biyo_lowpass,
  biyo_highpass,
  biyo_bandpass,
  biyo_delay,
  biyo_reverb,
  biyo_tremolo,
  biyo_autowah,
  biyo_vibrato,
  biyo_distortion,
  biyo_gain_up,
  biyo_gain_down,
  biyo_telephone,
];

for (const def of allBlocks) {
  Blockly.Blocks[def.type] = {
    init(this: Blockly.Block) {
      this.jsonInit(def);
    },
  };
}
