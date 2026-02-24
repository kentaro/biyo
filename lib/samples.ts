/**
 * 100 Sample songs for biyo workspace.
 * Each sample is a serialized Blockly workspace XML string with category metadata.
 */

export type SampleCategory =
  | 'melody'
  | 'rhythm'
  | 'fun'
  | 'classical'
  | 'game'
  | 'nature'
  | 'space'
  | 'dance'
  | 'robot'
  | 'magic';

export interface Sample {
  key: string;
  name: string;
  category: SampleCategory;
  description: string;
  xml: string;
}

export const CATEGORY_META: Record<SampleCategory, { label: string; emoji: string }> = {
  melody: { label: 'メロディー', emoji: '🎵' },
  rhythm: { label: 'リズム', emoji: '🥁' },
  fun: { label: 'おもしろおと', emoji: '🤪' },
  classical: { label: 'クラシック', emoji: '🎻' },
  game: { label: 'ゲームおんがく', emoji: '🎮' },
  nature: { label: 'しぜん', emoji: '🌿' },
  space: { label: 'うちゅう', emoji: '🚀' },
  dance: { label: 'ダンス', emoji: '💃' },
  robot: { label: 'ロボット', emoji: '🤖' },
  magic: { label: 'まほう', emoji: '✨' },
};

const X = (x: number, y: number) => `x="${x}" y="${y}"`;

const samples: Sample[] = [
  // ===========================
  // メロディー (Melody) - 10 samples
  // ===========================
  {
    key: 'melody_doremi',
    name: 'ドレミのうた',
    category: 'melody',
    description: 'いちばんかんたんなドレミファ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_sequencer" ${X(80, 60)}>
    <field name="BPM">120</field>
    <field name="NOTE1">60</field>
    <field name="NOTE2">62</field>
    <field name="NOTE3">64</field>
    <field name="NOTE4">65</field>
  </block>
</xml>`,
  },
  {
    key: 'melody_solfa_high',
    name: 'たかいドレミ',
    category: 'melody',
    description: 'オクターブうえのドレミファ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_sequencer" ${X(80, 60)}>
    <field name="BPM">120</field>
    <field name="NOTE1">72</field>
    <field name="NOTE2">74</field>
    <field name="NOTE3">76</field>
    <field name="NOTE4">72</field>
  </block>
</xml>`,
  },
  {
    key: 'melody_skip',
    name: 'スキップメロディー',
    category: 'melody',
    description: 'たのしくスキップするおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_sequencer" ${X(80, 60)}>
    <field name="BPM">160</field>
    <field name="NOTE1">60</field>
    <field name="NOTE2">64</field>
    <field name="NOTE3">67</field>
    <field name="NOTE4">72</field>
  </block>
</xml>`,
  },
  {
    key: 'melody_sad',
    name: 'かなしいメロディー',
    category: 'melody',
    description: 'ちょっとせつないきもち',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_sequencer" ${X(80, 60)}>
    <field name="BPM">80</field>
    <field name="NOTE1">69</field>
    <field name="NOTE2">72</field>
    <field name="NOTE3">69</field>
    <field name="NOTE4">65</field>
  </block>
</xml>`,
  },
  {
    key: 'melody_pluck_song',
    name: 'ギターのうた',
    category: 'melody',
    description: 'ポロンポロンとなるギター',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_delay" ${X(200, 60)}>
    <field name="TIME">0.3</field>
    <field name="FEEDBACK">0.4</field>
    <field name="MIX">0.5</field>
    <value name="SIGNAL">
      <block type="biyo_pluck">
        <field name="NOTE">E</field>
        <field name="OCTAVE">4</field>
        <field name="SUSTAIN">1.0</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'melody_vibrato_sine',
    name: 'ゆれるうた',
    category: 'melody',
    description: 'ビブラートのきいたきれいなおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_vibrato" ${X(200, 60)}>
    <field name="SPEED">5</field>
    <field name="DEPTH">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_sine">
        <field name="NOTE">A</field>
        <field name="OCTAVE">4</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'melody_flute',
    name: 'ふえのおと',
    category: 'melody',
    description: 'やさしいふえのねいろ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">0.6</field>
    <field name="DAMPING">0.5</field>
    <field name="MIX">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_vibrato">
        <field name="SPEED">5</field>
        <field name="DEPTH">0.1</field>
        <value name="SIGNAL">
          <block type="biyo_triangle">
            <field name="NOTE">C</field>
            <field name="OCTAVE">5</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'melody_echo_song',
    name: 'やまびこメロディー',
    category: 'melody',
    description: 'やまびこがひびくメロディー',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_pingpong" ${X(280, 60)}>
    <field name="TIME">0.25</field>
    <field name="FEEDBACK">0.4</field>
    <field name="MIX">0.5</field>
    <value name="SIGNAL">
      <block type="biyo_sequencer">
        <field name="BPM">80</field>
        <field name="NOTE1">60</field>
        <field name="NOTE2">67</field>
        <field name="NOTE3">64</field>
        <field name="NOTE4">72</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'melody_happy_march',
    name: 'たのしいこうしんきょく',
    category: 'melody',
    description: 'みんなでこうしんしよう',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_sequencer" ${X(80, 60)}>
    <field name="BPM">120</field>
    <field name="NOTE1">60</field>
    <field name="NOTE2">60</field>
    <field name="NOTE3">67</field>
    <field name="NOTE4">67</field>
  </block>
</xml>`,
  },
  {
    key: 'melody_lullaby',
    name: 'こもりうた',
    category: 'melody',
    description: 'おやすみなさいのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.5</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_lowpass">
        <field name="CUTOFF">1000</field>
        <field name="RESONANCE">1</field>
        <value name="SIGNAL">
          <block type="biyo_sequencer">
            <field name="BPM">80</field>
            <field name="NOTE1">60</field>
            <field name="NOTE2">64</field>
            <field name="NOTE3">67</field>
            <field name="NOTE4">64</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },

  // ===========================
  // リズム (Rhythm) - 10 samples
  // ===========================
  {
    key: 'rhythm_rock',
    name: 'ロックビート',
    category: 'rhythm',
    description: 'ドンタンドンタン！ロックのリズム',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_drum_pattern" ${X(80, 60)}>
    <field name="BPM">120</field>
    <field name="PATTERN">rock</field>
  </block>
</xml>`,
  },
  {
    key: 'rhythm_techno',
    name: 'テクノビート',
    category: 'rhythm',
    description: 'ドンドンドンドン！テクノのリズム',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_drum_pattern" ${X(80, 60)}>
    <field name="BPM">120</field>
    <field name="PATTERN">techno</field>
  </block>
</xml>`,
  },
  {
    key: 'rhythm_jazz',
    name: 'ジャズビート',
    category: 'rhythm',
    description: 'スウィングするジャズのリズム',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_drum_pattern" ${X(80, 60)}>
    <field name="BPM">120</field>
    <field name="PATTERN">jazz</field>
  </block>
</xml>`,
  },
  {
    key: 'rhythm_samba',
    name: 'サンバのリズム',
    category: 'rhythm',
    description: 'みなみのくにのたのしいリズム',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_drum_pattern" ${X(80, 60)}>
    <field name="BPM">80</field>
    <field name="PATTERN">samba</field>
  </block>
</xml>`,
  },
  {
    key: 'rhythm_kick_hihat',
    name: 'キックとハイハット',
    category: 'rhythm',
    description: 'ドンチッドンチッのきほん',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_mix" ${X(280, 60)}>
    <field name="BALANCE">0.5</field>
    <value name="SIGNAL_A">
      <block type="biyo_kick">
        <field name="FREQ">60</field>
      </block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_hihat">
        <field name="LENGTH">0.05</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'rhythm_fast_beat',
    name: 'はやいビート',
    category: 'rhythm',
    description: 'ドキドキするはやいリズム',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_drum_pattern" ${X(80, 60)}>
    <field name="BPM">200</field>
    <field name="PATTERN">rock</field>
  </block>
</xml>`,
  },
  {
    key: 'rhythm_slow_groove',
    name: 'ゆっくりグルーヴ',
    category: 'rhythm',
    description: 'のんびりゆったりリズム',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_drum_pattern" ${X(80, 60)}>
    <field name="BPM">80</field>
    <field name="PATTERN">jazz</field>
  </block>
</xml>`,
  },
  {
    key: 'rhythm_clap_beat',
    name: 'てびょうしリズム',
    category: 'rhythm',
    description: 'パンパンパンパン！てびょうし',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_mix" ${X(280, 60)}>
    <field name="BALANCE">0.5</field>
    <value name="SIGNAL_A">
      <block type="biyo_clap"></block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_kick">
        <field name="FREQ">40</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'rhythm_snare_roll',
    name: 'スネアロール',
    category: 'rhythm',
    description: 'ドドドドド！たいこのロール',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">0.3</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.15</field>
    <value name="SIGNAL">
      <block type="biyo_snare"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'rhythm_metro',
    name: 'メトロノーム',
    category: 'rhythm',
    description: 'カチカチカチ！じかんをきざむ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_metro" ${X(80, 60)}>
    <field name="BPM">120</field>
  </block>
</xml>`,
  },

  // ===========================
  // おもしろおと (Fun Sounds) - 10 samples
  // ===========================
  {
    key: 'fun_siren',
    name: 'パトカーだ！',
    category: 'fun',
    description: 'ウーウー！パトカーがくるよ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_siren" ${X(80, 60)}></block>
</xml>`,
  },
  {
    key: 'fun_laser',
    name: 'レーザービーム',
    category: 'fun',
    description: 'ビビビ！レーザーをうつよ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_delay" ${X(200, 60)}>
    <field name="TIME">0.1</field>
    <field name="FEEDBACK">0.7</field>
    <field name="MIX">0.5</field>
    <value name="SIGNAL">
      <block type="biyo_laser"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'fun_telephone',
    name: 'もしもし',
    category: 'fun',
    description: 'でんわごしのこもったおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_telephone" ${X(200, 60)}>
    <value name="SIGNAL">
      <block type="biyo_sine">
        <field name="NOTE">A</field>
        <field name="OCTAVE">4</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'fun_wobble',
    name: 'うにょうにょ',
    category: 'fun',
    description: 'うにょうにょうごくへんなおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_autowah" ${X(200, 60)}>
    <field name="SPEED">6</field>
    <field name="DEPTH">0.8</field>
    <value name="SIGNAL">
      <block type="biyo_saw">
        <field name="NOTE">A</field>
        <field name="OCTAVE">2</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'fun_ghost',
    name: 'おばけだぞ',
    category: 'fun',
    description: 'ヒュードロドロ！おばけのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(200, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_ghost"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'fun_distort_voice',
    name: 'パリパリボイス',
    category: 'fun',
    description: 'パリパリにゆがんだおもしろいこえ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_distortion" ${X(200, 60)}>
    <field name="DRIVE">15</field>
    <value name="SIGNAL">
      <block type="biyo_robot_voice">
        <field name="VOWEL">a</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'fun_wanwan',
    name: 'ワンワン',
    category: 'fun',
    description: 'いぬみたいにワンワンいうおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_bandpass" ${X(200, 60)}>
    <field name="CENTER">1000</field>
    <field name="WIDTH">500</field>
    <value name="SIGNAL">
      <block type="biyo_saw">
        <field name="NOTE">D</field>
        <field name="OCTAVE">3</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'fun_alarm',
    name: 'めざましどけい',
    category: 'fun',
    description: 'ピピピピ！あさだよ おきて！',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_tremolo" ${X(200, 60)}>
    <field name="SPEED">10</field>
    <field name="DEPTH">1.0</field>
    <value name="SIGNAL">
      <block type="biyo_square">
        <field name="NOTE">B</field>
        <field name="OCTAVE">5</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'fun_deep_voice',
    name: 'おじさんのこえ',
    category: 'fun',
    description: 'ふかーいおじさんみたいなこえ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_lowpass" ${X(200, 60)}>
    <field name="CUTOFF">300</field>
    <field name="RESONANCE">5</field>
    <value name="SIGNAL">
      <block type="biyo_robot_voice">
        <field name="VOWEL">o</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'fun_chipmunk',
    name: 'リスさんのこえ',
    category: 'fun',
    description: 'たかくてかわいいこえ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_highpass" ${X(200, 60)}>
    <field name="CUTOFF">3000</field>
    <field name="RESONANCE">5</field>
    <value name="SIGNAL">
      <block type="biyo_robot_voice">
        <field name="VOWEL">i</field>
      </block>
    </value>
  </block>
</xml>`,
  },

  // ===========================
  // クラシック (Classical) - 10 samples
  // ===========================
  {
    key: 'classical_chord_c',
    name: 'ドメジャーわおん',
    category: 'classical',
    description: 'あかるいドのわおん',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(200, 60)}>
    <field name="SIZE">0.6</field>
    <field name="DAMPING">0.5</field>
    <field name="MIX">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_chord">
        <field name="ROOT">C</field>
        <field name="TYPE">major</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'classical_chord_am',
    name: 'ラマイナーわおん',
    category: 'classical',
    description: 'かなしいラのわおん',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(200, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.5</field>
    <field name="MIX">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_chord">
        <field name="ROOT">A</field>
        <field name="TYPE">minor</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'classical_organ',
    name: 'オルガン',
    category: 'classical',
    description: 'きょうかいのオルガンのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(300, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_tremolo">
        <field name="SPEED">5</field>
        <field name="DEPTH">0.2</field>
        <value name="SIGNAL">
          <block type="biyo_sine">
            <field name="NOTE">C</field>
            <field name="OCTAVE">4</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'classical_harp',
    name: 'ハープ',
    category: 'classical',
    description: 'うつくしいハープのしらべ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">0.6</field>
    <field name="DAMPING">0.5</field>
    <field name="MIX">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_pluck">
        <field name="NOTE">C</field>
        <field name="OCTAVE">5</field>
        <field name="SUSTAIN">1.0</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'classical_slow_melody',
    name: 'ゆったりがくしょう',
    category: 'classical',
    description: 'ゆったりしたクラシックのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(300, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.5</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_lowpass">
        <field name="CUTOFF">3000</field>
        <field name="RESONANCE">1</field>
        <value name="SIGNAL">
          <block type="biyo_sequencer">
            <field name="BPM">80</field>
            <field name="NOTE1">60</field>
            <field name="NOTE2">64</field>
            <field name="NOTE3">67</field>
            <field name="NOTE4">72</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'classical_seventh',
    name: 'セブンスわおん',
    category: 'classical',
    description: 'おしゃれなセブンスのひびき',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(200, 60)}>
    <field name="SIZE">0.6</field>
    <field name="DAMPING">0.5</field>
    <field name="MIX">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_chord">
        <field name="ROOT">G</field>
        <field name="TYPE">7th</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'classical_strings',
    name: 'バイオリンふう',
    category: 'classical',
    description: 'バイオリンみたいなやさしいおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(350, 60)}>
    <field name="SIZE">0.6</field>
    <field name="DAMPING">0.5</field>
    <field name="MIX">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_vibrato">
        <field name="SPEED">5</field>
        <field name="DEPTH">0.1</field>
        <value name="SIGNAL">
          <block type="biyo_lowpass">
            <field name="CUTOFF">3000</field>
            <field name="RESONANCE">1</field>
            <value name="SIGNAL">
              <block type="biyo_saw">
                <field name="NOTE">A</field>
                <field name="OCTAVE">4</field>
              </block>
            </value>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'classical_piano_c',
    name: 'ピアノのド',
    category: 'classical',
    description: 'やさしいピアノのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(200, 60)}>
    <field name="SIZE">0.6</field>
    <field name="DAMPING">0.5</field>
    <field name="MIX">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_piano_note">
        <field name="NOTE">C</field>
        <field name="OCTAVE">4</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'classical_waltz',
    name: 'ワルツ',
    category: 'classical',
    description: 'いち・にい・さんのワルツ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(300, 60)}>
    <field name="SIZE">0.6</field>
    <field name="DAMPING">0.5</field>
    <field name="MIX">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_sequencer">
        <field name="BPM">80</field>
        <field name="NOTE1">60</field>
        <field name="NOTE2">67</field>
        <field name="NOTE3">67</field>
        <field name="NOTE4">60</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'classical_bell',
    name: 'きょうかいのかね',
    category: 'classical',
    description: 'ゴーンとなるおおきなかね',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">1.0</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_pluck">
        <field name="NOTE">C</field>
        <field name="OCTAVE">4</field>
        <field name="SUSTAIN">2.0</field>
      </block>
    </value>
  </block>
</xml>`,
  },

  // ===========================
  // ゲームおんがく (Game Music) - 10 samples
  // ===========================
  {
    key: 'game_famicom_c',
    name: 'ファミコンサウンド',
    category: 'game',
    description: 'ピコピコ！8ビットのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_famicom" ${X(80, 60)}>
    <field name="CHORD">C_major</field>
  </block>
</xml>`,
  },
  {
    key: 'game_square_melody',
    name: 'ゲームBGM',
    category: 'game',
    description: 'むかしのゲームみたいなおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_sequencer" ${X(80, 60)}>
    <field name="BPM">160</field>
    <field name="NOTE1">72</field>
    <field name="NOTE2">76</field>
    <field name="NOTE3">72</field>
    <field name="NOTE4">76</field>
  </block>
</xml>`,
  },
  {
    key: 'game_boss',
    name: 'ボスとうじょう',
    category: 'game',
    description: 'ボスがあらわれた！',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_distortion" ${X(200, 60)}>
    <field name="DRIVE">5</field>
    <value name="SIGNAL">
      <block type="biyo_sequencer">
        <field name="BPM">160</field>
        <field name="NOTE1">48</field>
        <field name="NOTE2">52</field>
        <field name="NOTE3">48</field>
        <field name="NOTE4">53</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'game_coin',
    name: 'コインゲット',
    category: 'game',
    description: 'チャリーン！コインをとったおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_highpass" ${X(200, 60)}>
    <field name="CUTOFF">3000</field>
    <field name="RESONANCE">1</field>
    <value name="SIGNAL">
      <block type="biyo_pluck">
        <field name="NOTE">D</field>
        <field name="OCTAVE">6</field>
        <field name="SUSTAIN">0.2</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'game_gameover',
    name: 'ゲームオーバー',
    category: 'game',
    description: 'ざんねん…ゲームオーバー',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_sequencer" ${X(80, 60)}>
    <field name="BPM">80</field>
    <field name="NOTE1">52</field>
    <field name="NOTE2">50</field>
    <field name="NOTE3">48</field>
    <field name="NOTE4">48</field>
  </block>
</xml>`,
  },
  {
    key: 'game_powerup',
    name: 'パワーアップ',
    category: 'game',
    description: 'つよくなったよ！パワーアップ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_sequencer" ${X(80, 60)}>
    <field name="BPM">200</field>
    <field name="NOTE1">60</field>
    <field name="NOTE2">64</field>
    <field name="NOTE3">67</field>
    <field name="NOTE4">72</field>
  </block>
</xml>`,
  },
  {
    key: 'game_famicom_battle',
    name: 'バトルBGM',
    category: 'game',
    description: 'たたかいのおんがく',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_mix" ${X(300, 60)}>
    <field name="BALANCE">0.5</field>
    <value name="SIGNAL_A">
      <block type="biyo_famicom">
        <field name="CHORD">A_minor</field>
      </block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_drum_pattern">
        <field name="BPM">160</field>
        <field name="PATTERN">rock</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'game_jump',
    name: 'ジャンプ！',
    category: 'game',
    description: 'ぴょーん！ジャンプするおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_highpass" ${X(200, 60)}>
    <field name="CUTOFF">1000</field>
    <field name="RESONANCE">5</field>
    <value name="SIGNAL">
      <block type="biyo_square">
        <field name="NOTE">D</field>
        <field name="OCTAVE">5</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'game_8bit_bass',
    name: '8ビットベース',
    category: 'game',
    description: 'ブンブンなるゲームのベース',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_lowpass" ${X(200, 60)}>
    <field name="CUTOFF">1000</field>
    <field name="RESONANCE">5</field>
    <value name="SIGNAL">
      <block type="biyo_square">
        <field name="NOTE">E</field>
        <field name="OCTAVE">2</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'game_victory',
    name: 'しょうりのファンファーレ',
    category: 'game',
    description: 'やった！かったよ！',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">0.6</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_sequencer">
        <field name="BPM">160</field>
        <field name="NOTE1">67</field>
        <field name="NOTE2">72</field>
        <field name="NOTE3">76</field>
        <field name="NOTE4">72</field>
      </block>
    </value>
  </block>
</xml>`,
  },

  // ===========================
  // しぜん (Nature) - 10 samples
  // ===========================
  {
    key: 'nature_water',
    name: 'みずのしずく',
    category: 'nature',
    description: 'ぽちゃんぽちゃんとおちるみず',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(200, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_water_drop"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'nature_thunder',
    name: 'かみなりさま',
    category: 'nature',
    description: 'ゴロゴロドカーン！かみなり',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(200, 60)}>
    <field name="SIZE">1.0</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_thunder"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'nature_wind',
    name: 'そよかぜ',
    category: 'nature',
    description: 'シューッときもちいいかぜ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_lowpass" ${X(200, 60)}>
    <field name="CUTOFF">1000</field>
    <field name="RESONANCE">1</field>
    <value name="SIGNAL">
      <block type="biyo_filtered_noise">
        <field name="BRIGHTNESS">2000</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'nature_storm',
    name: 'あらし',
    category: 'nature',
    description: 'ゴーゴーふくあらし',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_mix" ${X(280, 60)}>
    <field name="BALANCE">0.25</field>
    <value name="SIGNAL_A">
      <block type="biyo_filtered_noise">
        <field name="BRIGHTNESS">5000</field>
      </block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_thunder"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'nature_bubbles',
    name: 'すいちゅうのあわ',
    category: 'nature',
    description: 'ぶくぶくぶく！みずのなか',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(200, 60)}>
    <field name="SIZE">0.6</field>
    <field name="DAMPING">0.5</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_bubbles"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'nature_rain',
    name: 'あめのおと',
    category: 'nature',
    description: 'しとしとふるあめ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_lowpass" ${X(200, 60)}>
    <field name="CUTOFF">3000</field>
    <field name="RESONANCE">0.5</field>
    <value name="SIGNAL">
      <block type="biyo_noise"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'nature_ocean',
    name: 'うみのおと',
    category: 'nature',
    description: 'ザーッとよせるなみ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_tremolo" ${X(200, 60)}>
    <field name="SPEED">2</field>
    <field name="DEPTH">0.8</field>
    <value name="SIGNAL">
      <block type="biyo_filtered_noise">
        <field name="BRIGHTNESS">2000</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'nature_bird',
    name: 'ことりのうた',
    category: 'nature',
    description: 'ピヨピヨ！ことりがうたうよ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_vibrato" ${X(200, 60)}>
    <field name="SPEED">10</field>
    <field name="DEPTH">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_sine">
        <field name="NOTE">D</field>
        <field name="OCTAVE">6</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'nature_forest',
    name: 'もりのなか',
    category: 'nature',
    description: 'しずかなもりのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(300, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_mix">
        <field name="BALANCE">0.25</field>
        <value name="SIGNAL_A">
          <block type="biyo_water_drop"></block>
        </value>
        <value name="SIGNAL_B">
          <block type="biyo_filtered_noise">
            <field name="BRIGHTNESS">500</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'nature_waterfall',
    name: 'たき',
    category: 'nature',
    description: 'ゴーッとおちるたきのみず',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_gain_down">
        <field name="AMOUNT">0.5</field>
        <value name="SIGNAL">
          <block type="biyo_filtered_noise">
            <field name="BRIGHTNESS">5000</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },

  // ===========================
  // うちゅう (Space) - 10 samples
  // ===========================
  {
    key: 'space_ambient',
    name: 'うちゅうサウンド',
    category: 'space',
    description: 'ふしぎなうちゅうのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(200, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_space"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'space_ufo',
    name: 'UFOがきた',
    category: 'space',
    description: 'ヒョーン！UFOがとんでいく',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_pingpong" ${X(200, 60)}>
    <field name="TIME">0.25</field>
    <field name="FEEDBACK">0.4</field>
    <field name="MIX">0.5</field>
    <value name="SIGNAL">
      <block type="biyo_ufo"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'space_stars',
    name: 'ほしぞら',
    category: 'space',
    description: 'キラキラひかるほしのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_tremolo">
        <field name="SPEED">2</field>
        <field name="DEPTH">0.5</field>
        <value name="SIGNAL">
          <block type="biyo_sine">
            <field name="NOTE">G</field>
            <field name="OCTAVE">5</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'space_blackhole',
    name: 'ブラックホール',
    category: 'space',
    description: 'すべてをのみこむくらいあな',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_lowpass" ${X(280, 60)}>
    <field name="CUTOFF">300</field>
    <field name="RESONANCE">5</field>
    <value name="SIGNAL">
      <block type="biyo_reverb">
        <field name="SIZE">1.0</field>
        <field name="DAMPING">0.2</field>
        <field name="MIX">0.6</field>
        <value name="SIGNAL">
          <block type="biyo_noise"></block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'space_satellite',
    name: 'じんこうえいせい',
    category: 'space',
    description: 'ピピッ…じんこうえいせいのしんごう',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_delay" ${X(200, 60)}>
    <field name="TIME">0.6</field>
    <field name="FEEDBACK">0.7</field>
    <field name="MIX">0.5</field>
    <value name="SIGNAL">
      <block type="biyo_highpass">
        <field name="CUTOFF">3000</field>
        <field name="RESONANCE">5</field>
        <value name="SIGNAL">
          <block type="biyo_square">
            <field name="NOTE">G</field>
            <field name="OCTAVE">6</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'space_nebula',
    name: 'せいうん',
    category: 'space',
    description: 'うつくしいうちゅうのくも',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">1.0</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_lowpass">
        <field name="CUTOFF">1000</field>
        <field name="RESONANCE">1</field>
        <value name="SIGNAL">
          <block type="biyo_detune_saw">
            <field name="NOTE">G</field>
            <field name="OCTAVE">2</field>
            <field name="DETUNE">1</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'space_alien',
    name: 'うちゅうじん',
    category: 'space',
    description: 'ワレワレハウチュウジンダ！',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_vibrato" ${X(200, 60)}>
    <field name="SPEED">10</field>
    <field name="DEPTH">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_robot_voice">
        <field name="VOWEL">u</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'space_moonwalk',
    name: 'つきのうえ',
    category: 'space',
    description: 'ふわふわつきをあるくおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_lowpass">
        <field name="CUTOFF">300</field>
        <field name="RESONANCE">1</field>
        <value name="SIGNAL">
          <block type="biyo_pluck">
            <field name="NOTE">G</field>
            <field name="OCTAVE">3</field>
            <field name="SUSTAIN">2.0</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'space_warp',
    name: 'ワープ',
    category: 'space',
    description: 'ギュイーン！ワープそくど！',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_delay" ${X(200, 60)}>
    <field name="TIME">0.1</field>
    <field name="FEEDBACK">0.9</field>
    <field name="MIX">0.8</field>
    <value name="SIGNAL">
      <block type="biyo_laser"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'space_cosmic',
    name: 'コスモス',
    category: 'space',
    description: 'はてしないうちゅうのひびき',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(300, 60)}>
    <field name="SIZE">1.0</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_mix">
        <field name="BALANCE">0.5</field>
        <value name="SIGNAL_A">
          <block type="biyo_space"></block>
        </value>
        <value name="SIGNAL_B">
          <block type="biyo_sine">
            <field name="NOTE">A</field>
            <field name="OCTAVE">3</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },

  // ===========================
  // ダンス (Dance) - 10 samples
  // ===========================
  {
    key: 'dance_techno_beat',
    name: 'テクノダンス',
    category: 'dance',
    description: 'ドンツクドンツク！おどろう',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_mix" ${X(280, 60)}>
    <field name="BALANCE">0.5</field>
    <value name="SIGNAL_A">
      <block type="biyo_drum_pattern">
        <field name="BPM">120</field>
        <field name="PATTERN">techno</field>
      </block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_sequencer">
        <field name="BPM">120</field>
        <field name="NOTE1">48</field>
        <field name="NOTE2">48</field>
        <field name="NOTE3">55</field>
        <field name="NOTE4">55</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'dance_edm_bass',
    name: 'EDMベース',
    category: 'dance',
    description: 'ブンブンなるダンスのベース',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_lowpass" ${X(200, 60)}>
    <field name="CUTOFF">300</field>
    <field name="RESONANCE">5</field>
    <value name="SIGNAL">
      <block type="biyo_saw">
        <field name="NOTE">A</field>
        <field name="OCTAVE">2</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'dance_disco',
    name: 'ディスコ',
    category: 'dance',
    description: 'キラキラディスコでおどろう',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_mix" ${X(280, 60)}>
    <field name="BALANCE">0.25</field>
    <value name="SIGNAL_A">
      <block type="biyo_drum_pattern">
        <field name="BPM">120</field>
        <field name="PATTERN">rock</field>
      </block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_autowah">
        <field name="SPEED">2</field>
        <field name="DEPTH">0.5</field>
        <value name="SIGNAL">
          <block type="biyo_saw">
            <field name="NOTE">A</field>
            <field name="OCTAVE">3</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'dance_house',
    name: 'ハウスミュージック',
    category: 'dance',
    description: 'ウンツウンツ！ハウスビート',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_mix" ${X(280, 60)}>
    <field name="BALANCE">0.5</field>
    <value name="SIGNAL_A">
      <block type="biyo_kick">
        <field name="FREQ">60</field>
      </block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_hihat">
        <field name="LENGTH">0.02</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'dance_synth_lead',
    name: 'シンセリード',
    category: 'dance',
    description: 'ギュイーンとなるシンセのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_delay" ${X(280, 60)}>
    <field name="TIME">0.3</field>
    <field name="FEEDBACK">0.2</field>
    <field name="MIX">0.2</field>
    <value name="SIGNAL">
      <block type="biyo_autowah">
        <field name="SPEED">2</field>
        <field name="DEPTH">0.8</field>
        <value name="SIGNAL">
          <block type="biyo_detune_saw">
            <field name="NOTE">A</field>
            <field name="OCTAVE">4</field>
            <field name="DETUNE">3</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'dance_drop',
    name: 'ドロップ！',
    category: 'dance',
    description: 'もりあがるドロップのしゅんかん',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_mix" ${X(300, 60)}>
    <field name="BALANCE">0.5</field>
    <value name="SIGNAL_A">
      <block type="biyo_drum_pattern">
        <field name="BPM">160</field>
        <field name="PATTERN">techno</field>
      </block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_distortion">
        <field name="DRIVE">5</field>
        <value name="SIGNAL">
          <block type="biyo_saw">
            <field name="NOTE">A</field>
            <field name="OCTAVE">2</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'dance_clap_beat',
    name: 'クラップビート',
    category: 'dance',
    description: 'パンパンてをたたいておどろう',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_mix" ${X(280, 60)}>
    <field name="BALANCE">0.5</field>
    <value name="SIGNAL_A">
      <block type="biyo_kick">
        <field name="FREQ">60</field>
      </block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_clap"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'dance_trance',
    name: 'トランス',
    category: 'dance',
    description: 'トリップするようなおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_pingpong" ${X(280, 60)}>
    <field name="TIME">0.25</field>
    <field name="FEEDBACK">0.4</field>
    <field name="MIX">0.5</field>
    <value name="SIGNAL">
      <block type="biyo_sequencer">
        <field name="BPM">160</field>
        <field name="NOTE1">60</field>
        <field name="NOTE2">64</field>
        <field name="NOTE3">67</field>
        <field name="NOTE4">71</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'dance_funk_bass',
    name: 'ファンクベース',
    category: 'dance',
    description: 'ブリブリファンキーなベース',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_autowah" ${X(200, 60)}>
    <field name="SPEED">6</field>
    <field name="DEPTH">0.8</field>
    <value name="SIGNAL">
      <block type="biyo_saw">
        <field name="NOTE">E</field>
        <field name="OCTAVE">2</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'dance_rave',
    name: 'レイヴ',
    category: 'dance',
    description: 'もりあがれー！レイヴパーティー',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_mix" ${X(300, 60)}>
    <field name="BALANCE">0.25</field>
    <value name="SIGNAL_A">
      <block type="biyo_drum_pattern">
        <field name="BPM">160</field>
        <field name="PATTERN">techno</field>
      </block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_delay">
        <field name="TIME">0.1</field>
        <field name="FEEDBACK">0.4</field>
        <field name="MIX">0.2</field>
        <value name="SIGNAL">
          <block type="biyo_detune_saw">
            <field name="NOTE">E</field>
            <field name="OCTAVE">4</field>
            <field name="DETUNE">3</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },

  // ===========================
  // ロボット (Robot) - 10 samples
  // ===========================
  {
    key: 'robot_voice_a',
    name: 'ロボットのあ',
    category: 'robot',
    description: 'ロボットが「あ」というよ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_robot_voice" ${X(80, 60)}>
    <field name="VOWEL">a</field>
  </block>
</xml>`,
  },
  {
    key: 'robot_talk',
    name: 'ロボットのおしゃべり',
    category: 'robot',
    description: 'ロボットがはなしかけてくる',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_delay" ${X(200, 60)}>
    <field name="TIME">0.3</field>
    <field name="FEEDBACK">0.2</field>
    <field name="MIX">0.2</field>
    <value name="SIGNAL">
      <block type="biyo_robot_voice">
        <field name="VOWEL">e</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'robot_march',
    name: 'ロボットこうしん',
    category: 'robot',
    description: 'ガシャンガシャン！ロボットがあるく',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_mix" ${X(280, 60)}>
    <field name="BALANCE">0.5</field>
    <value name="SIGNAL_A">
      <block type="biyo_drum_pattern">
        <field name="BPM">80</field>
        <field name="PATTERN">techno</field>
      </block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_distortion">
        <field name="DRIVE">15</field>
        <value name="SIGNAL">
          <block type="biyo_square">
            <field name="NOTE">G</field>
            <field name="OCTAVE">2</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'robot_beep',
    name: 'ロボットビープ',
    category: 'robot',
    description: 'ピッピッ！ロボットのしんごう',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_tremolo" ${X(200, 60)}>
    <field name="SPEED">10</field>
    <field name="DEPTH">1.0</field>
    <value name="SIGNAL">
      <block type="biyo_square">
        <field name="NOTE">G</field>
        <field name="OCTAVE">5</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'robot_multiply',
    name: 'ロボットがっしょう',
    category: 'robot',
    description: 'たくさんのロボットがうたう',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_multiply" ${X(280, 60)}>
    <value name="SIGNAL_A">
      <block type="biyo_robot_voice">
        <field name="VOWEL">o</field>
      </block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_sine">
        <field name="NOTE">C</field>
        <field name="OCTAVE">2</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'robot_factory',
    name: 'ロボットこうじょう',
    category: 'robot',
    description: 'ガチャガチャ！こうじょうのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_distortion" ${X(280, 60)}>
    <field name="DRIVE">15</field>
    <value name="SIGNAL">
      <block type="biyo_bandpass">
        <field name="CENTER">300</field>
        <field name="WIDTH">500</field>
        <value name="SIGNAL">
          <block type="biyo_noise"></block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'robot_metal',
    name: 'きんぞくおん',
    category: 'robot',
    description: 'ガキーン！きんぞくみたいなおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_highpass" ${X(200, 60)}>
    <field name="CUTOFF">3000</field>
    <field name="RESONANCE">5</field>
    <value name="SIGNAL">
      <block type="biyo_noise"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'robot_power_down',
    name: 'でんげんオフ',
    category: 'robot',
    description: 'ロボットのでんげんがきれた',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_lowpass" ${X(200, 60)}>
    <field name="CUTOFF">300</field>
    <field name="RESONANCE">5</field>
    <value name="SIGNAL">
      <block type="biyo_saw">
        <field name="NOTE">G</field>
        <field name="OCTAVE">2</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'robot_transform',
    name: 'へんしん！',
    category: 'robot',
    description: 'ガチャガチャ！ロボットにへんしん',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_delay" ${X(280, 60)}>
    <field name="TIME">0.1</field>
    <field name="FEEDBACK">0.7</field>
    <field name="MIX">0.5</field>
    <value name="SIGNAL">
      <block type="biyo_distortion">
        <field name="DRIVE">15</field>
        <value name="SIGNAL">
          <block type="biyo_saw">
            <field name="NOTE">G</field>
            <field name="OCTAVE">3</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'robot_dance',
    name: 'ロボットダンス',
    category: 'robot',
    description: 'カクカクおどるロボット',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_mix" ${X(300, 60)}>
    <field name="BALANCE">0.5</field>
    <value name="SIGNAL_A">
      <block type="biyo_drum_pattern">
        <field name="BPM">120</field>
        <field name="PATTERN">techno</field>
      </block>
    </value>
    <value name="SIGNAL_B">
      <block type="biyo_telephone">
        <value name="SIGNAL">
          <block type="biyo_robot_voice">
            <field name="VOWEL">u</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },

  // ===========================
  // まほう (Magic) - 10 samples
  // ===========================
  {
    key: 'magic_sparkle',
    name: 'キラキラまほう',
    category: 'magic',
    description: 'キラーン！まほうがひかる',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_highpass">
        <field name="CUTOFF">3000</field>
        <field name="RESONANCE">5</field>
        <value name="SIGNAL">
          <block type="biyo_pluck">
            <field name="NOTE">B</field>
            <field name="OCTAVE">5</field>
            <field name="SUSTAIN">0.5</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'magic_wand',
    name: 'まほうのつえ',
    category: 'magic',
    description: 'シュワーン！つえをふった',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_pingpong" ${X(280, 60)}>
    <field name="TIME">0.25</field>
    <field name="FEEDBACK">0.7</field>
    <field name="MIX">0.5</field>
    <value name="SIGNAL">
      <block type="biyo_vibrato">
        <field name="SPEED">10</field>
        <field name="DEPTH">0.6</field>
        <value name="SIGNAL">
          <block type="biyo_sine">
            <field name="NOTE">D</field>
            <field name="OCTAVE">5</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'magic_potion',
    name: 'まほうのくすり',
    category: 'magic',
    description: 'ぐつぐつ…ふしぎなくすり',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(200, 60)}>
    <field name="SIZE">0.6</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.3</field>
    <value name="SIGNAL">
      <block type="biyo_bubbles"></block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'magic_fairy',
    name: 'ようせい',
    category: 'magic',
    description: 'キラキラとぶようせいのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(300, 60)}>
    <field name="SIZE">0.6</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_tremolo">
        <field name="SPEED">10</field>
        <field name="DEPTH">0.5</field>
        <value name="SIGNAL">
          <block type="biyo_triangle">
            <field name="NOTE">G</field>
            <field name="OCTAVE">5</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'magic_teleport',
    name: 'テレポート',
    category: 'magic',
    description: 'シュン！いっしゅんでいどう',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_delay" ${X(280, 60)}>
    <field name="TIME">0.1</field>
    <field name="FEEDBACK">0.9</field>
    <field name="MIX">0.8</field>
    <value name="SIGNAL">
      <block type="biyo_highpass">
        <field name="CUTOFF">3000</field>
        <field name="RESONANCE">5</field>
        <value name="SIGNAL">
          <block type="biyo_noise"></block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'magic_crystal',
    name: 'まほうのクリスタル',
    category: 'magic',
    description: 'キーンとなるクリスタルのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_pluck">
        <field name="NOTE">G</field>
        <field name="OCTAVE">6</field>
        <field name="SUSTAIN">1.0</field>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'magic_dark',
    name: 'やみのまほう',
    category: 'magic',
    description: 'くらーいやみのちからのおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(280, 60)}>
    <field name="SIZE">1.0</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_lowpass">
        <field name="CUTOFF">300</field>
        <field name="RESONANCE">5</field>
        <value name="SIGNAL">
          <block type="biyo_ghost"></block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'magic_heal',
    name: 'かいふくまほう',
    category: 'magic',
    description: 'キラキラ…きずがなおるおと',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_pingpong" ${X(280, 60)}>
    <field name="TIME">0.1</field>
    <field name="FEEDBACK">0.4</field>
    <field name="MIX">0.5</field>
    <value name="SIGNAL">
      <block type="biyo_reverb">
        <field name="SIZE">0.6</field>
        <field name="DAMPING">0.2</field>
        <field name="MIX">0.6</field>
        <value name="SIGNAL">
          <block type="biyo_triangle">
            <field name="NOTE">C</field>
            <field name="OCTAVE">5</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'magic_enchant',
    name: 'エンチャント',
    category: 'magic',
    description: 'ぶきにまほうをかける',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_delay" ${X(280, 60)}>
    <field name="TIME">0.3</field>
    <field name="FEEDBACK">0.4</field>
    <field name="MIX">0.5</field>
    <value name="SIGNAL">
      <block type="biyo_vibrato">
        <field name="SPEED">5</field>
        <field name="DEPTH">0.3</field>
        <value name="SIGNAL">
          <block type="biyo_detune_saw">
            <field name="NOTE">E</field>
            <field name="OCTAVE">4</field>
            <field name="DETUNE">3</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
  {
    key: 'magic_summon',
    name: 'しょうかんまほう',
    category: 'magic',
    description: 'なにかがよびだされる！',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="biyo_reverb" ${X(300, 60)}>
    <field name="SIZE">0.85</field>
    <field name="DAMPING">0.2</field>
    <field name="MIX">0.6</field>
    <value name="SIGNAL">
      <block type="biyo_mix">
        <field name="BALANCE">0.5</field>
        <value name="SIGNAL_A">
          <block type="biyo_ghost"></block>
        </value>
        <value name="SIGNAL_B">
          <block type="biyo_thunder"></block>
        </value>
      </block>
    </value>
  </block>
</xml>`,
  },
];

// --- Public API ---

export function getSample(key: string): string {
  const s = samples.find((s) => s.key === key);
  return s ? s.xml : '';
}

export function getSampleList(): Sample[] {
  return samples;
}

export function getSamplesByCategory(category: SampleCategory): Sample[] {
  return samples.filter((s) => s.category === category);
}

export function getCategories(): SampleCategory[] {
  return Object.keys(CATEGORY_META) as SampleCategory[];
}
