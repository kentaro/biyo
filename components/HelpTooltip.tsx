'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface HelpTooltipProps {
  text: string;
}

export default function HelpTooltip({ text }: HelpTooltipProps) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [visible]);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!visible) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', top: 'var(--sp-2)', right: 'var(--sp-2)', zIndex: 20 }}
    >
      <button
        type="button"
        onClick={visible ? dismiss : show}
        aria-label="ヘルプをみる"
        aria-expanded={visible}
        aria-controls="help-tooltip-content"
        style={{
          width: 'var(--btn-sm)',
          height: 'var(--btn-sm)',
          borderRadius: 'var(--r-full)',
          background: 'var(--c-preset)',
          color: 'var(--c-text-inverse)',
          border: 'none',
          fontSize: 'var(--fs-sm)',
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-btn)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease',
          transform: visible ? 'scale(0.9)' : 'scale(1)',
        }}
      >
        ?
      </button>

      {visible && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: tooltip dismiss on click
        <div
          id="help-tooltip-content"
          role="tooltip"
          onClick={dismiss}
          style={{
            position: 'absolute',
            top: 'calc(var(--btn-sm) + var(--sp-2))',
            right: 0,
            background: 'var(--c-preset)',
            color: 'var(--c-text-inverse)',
            padding: 'var(--sp-2) var(--sp-3)',
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 600,
            maxWidth: 'min(300px, 80vw)',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            animation: 'helpBubbleIn 0.2s ease-out',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
