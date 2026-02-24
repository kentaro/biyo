'use client';

import { useCallback, useState } from 'react';
import { useTrackStore } from '@/lib/stores/tracks';

interface SurpriseButtonProps {
  onSurprise?: () => void;
}

interface Preset {
  name: string;
  xml: string;
}

// Each preset is a workspace XML that creates connected blocks.
// IMPORTANT: All <field> values MUST exactly match a valid dropdown option
// defined in lib/blockly/blocks/*.ts, otherwise Blockly will reject the block.
const PRESETS: Preset[] = [
  {
    name: 'ねむれるもりのうた',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_sine" x="80" y="80">
        <field name="NOTE">C</field>
        <field name="OCTAVE">4</field>
        <value name="NEXT">
          <block type="biyo_reverb">
            <field name="SIZE">0.6</field>
            <field name="DAMPING">0.5</field>
            <field name="MIX">0.3</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'ゆめのなかのふえ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_triangle" x="80" y="80">
        <field name="NOTE">E</field>
        <field name="OCTAVE">4</field>
        <value name="NEXT">
          <block type="biyo_reverb">
            <field name="SIZE">0.85</field>
            <field name="DAMPING">0.5</field>
            <field name="MIX">0.6</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'おしゃべりロボ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_square" x="80" y="80">
        <field name="NOTE">G</field>
        <field name="OCTAVE">3</field>
        <value name="NEXT">
          <block type="biyo_distortion">
            <field name="DRIVE">5</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'ガリガリこうじょう',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_saw" x="80" y="80">
        <field name="NOTE">D</field>
        <field name="OCTAVE">3</field>
        <value name="NEXT">
          <block type="biyo_distortion">
            <field name="DRIVE">15</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'ほしぞらさんぽ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_space" x="80" y="80">
        <value name="NEXT">
          <block type="biyo_delay">
            <field name="TIME">0.6</field>
            <field name="FEEDBACK">0.7</field>
            <field name="MIX">0.5</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'とんでけUFO',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_ufo" x="80" y="80">
        <value name="NEXT">
          <block type="biyo_reverb">
            <field name="SIZE">0.85</field>
            <field name="DAMPING">0.2</field>
            <field name="MIX">0.6</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'ドキドキドラム',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_kick" x="80" y="80">
        <field name="FREQ">60</field>
        <value name="NEXT">
          <block type="biyo_reverb">
            <field name="SIZE">0.3</field>
            <field name="DAMPING">0.8</field>
            <field name="MIX">0.15</field>
          </block>
        </value>
      </block>
      <block type="biyo_hihat" x="80" y="200">
        <field name="LENGTH">0.05</field>
        <value name="NEXT">
          <block type="biyo_delay">
            <field name="TIME">0.1</field>
            <field name="FEEDBACK">0.4</field>
            <field name="MIX">0.5</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'まほうのじゅもん',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_noise" x="80" y="80">
        <value name="NEXT">
          <block type="biyo_autowah">
            <field name="SPEED">2</field>
            <field name="DEPTH">0.8</field>
            <value name="NEXT">
              <block type="biyo_tremolo">
                <field name="SPEED">5</field>
                <field name="DEPTH">0.8</field>
              </block>
            </value>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'ぐにゃぐにゃスライム',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_filtered_noise" x="80" y="80">
        <field name="BRIGHTNESS">2000</field>
        <value name="NEXT">
          <block type="biyo_autowah">
            <field name="SPEED">6</field>
            <field name="DEPTH">0.5</field>
            <value name="NEXT">
              <block type="biyo_vibrato">
                <field name="SPEED">10</field>
                <field name="DEPTH">0.6</field>
              </block>
            </value>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'ピコピコぼうけん',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_famicom" x="80" y="80">
        <field name="CHORD">C_major</field>
        <value name="NEXT">
          <block type="biyo_delay">
            <field name="TIME">0.3</field>
            <field name="FEEDBACK">0.2</field>
            <field name="MIX">0.2</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'しんやのおばけやしき',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_ghost" x="80" y="80">
        <value name="NEXT">
          <block type="biyo_reverb">
            <field name="SIZE">1.0</field>
            <field name="DAMPING">0.2</field>
            <field name="MIX">0.6</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'うみのそこたんけん',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_bubbles" x="80" y="80">
        <value name="NEXT">
          <block type="biyo_reverb">
            <field name="SIZE">0.85</field>
            <field name="DAMPING">0.8</field>
            <field name="MIX">0.6</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'かみなりさまのダンス',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_thunder" x="80" y="80">
        <value name="NEXT">
          <block type="biyo_distortion">
            <field name="DRIVE">15</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'ビビビレーザーたいけつ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_laser" x="80" y="80">
        <value name="NEXT">
          <block type="biyo_delay">
            <field name="TIME">0.3</field>
            <field name="FEEDBACK">0.7</field>
            <field name="MIX">0.5</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
  {
    name: 'あめのひのぽちゃぽちゃ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="biyo_water_drop" x="80" y="80">
        <value name="NEXT">
          <block type="biyo_reverb">
            <field name="SIZE">0.85</field>
            <field name="DAMPING">0.5</field>
            <field name="MIX">0.6</field>
          </block>
        </value>
      </block>
    </xml>`,
  },
];

export default function SurpriseButton({ onSurprise }: SurpriseButtonProps) {
  const [spinning, setSpinning] = useState(false);
  const [lastIndex, setLastIndex] = useState(-1);
  const appendWorkspaceXml = useTrackStore((s) => s.appendWorkspaceXml);

  const handleClick = useCallback(() => {
    if (spinning) return;

    // Pick a random preset, avoiding the same one twice
    let idx: number;
    do {
      idx = Math.floor(Math.random() * PRESETS.length);
    } while (idx === lastIndex && PRESETS.length > 1);
    setLastIndex(idx);

    const preset = PRESETS[idx];

    // Trigger spin animation
    setSpinning(true);
    setTimeout(() => setSpinning(false), 600);

    // Append the preset blocks into workspace (don't replace!)
    appendWorkspaceXml(preset.xml);

    onSurprise?.();
  }, [spinning, lastIndex, appendWorkspaceXml, onSurprise]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`surprise-btn ${spinning ? 'surprise-btn-spin' : ''}`}
      aria-label="おまかせ - ランダムなブロックをつくる"
      style={{
        fontFamily: 'var(--font-main)',
        fontSize: 'var(--fs-xs)',
        fontWeight: 700,
        color: 'var(--c-text-inverse)',
        background: 'linear-gradient(135deg, var(--c-preset), var(--c-source))',
        border: 'none',
        borderRadius: 'var(--r-sm)',
        padding: 'var(--sp-1) var(--sp-3)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        boxShadow: 'var(--shadow-btn)',
        position: 'relative',
        overflow: 'hidden',
        height: 36,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      おまかせ &#x2728;
    </button>
  );
}
