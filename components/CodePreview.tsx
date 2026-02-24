'use client';

import { useCallback, useMemo, useState } from 'react';
import { useCompileStore } from '@/lib/stores/compile';

/**
 * Simple keyword highlighting for mimium code.
 * Returns an array of React elements with keywords styled differently.
 * Keeps it lightweight -- no external syntax highlighting library needed.
 */
function highlightCode(code: string): React.ReactNode[] {
  // Pattern groups (non-capturing inner groups to keep indexing simple):
  //   match[1] = keyword
  //   match[2] = number literal
  //   match[3] = comment
  const combined =
    /\b(fn|let|if|else|return|self|include)\b|(\b\d+\.?\d*\b)|(\/\/[^\n]*)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(code)) !== null) {
    // Push plain text before the match
    if (match.index > lastIndex) {
      parts.push(code.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // keyword
      parts.push(
        <span key={match.index} style={{ color: 'var(--c-primary)', fontWeight: 700 }}>
          {match[0]}
        </span>,
      );
    } else if (match[2]) {
      // number literal
      parts.push(
        <span key={match.index} style={{ color: 'var(--c-accent)' }}>
          {match[0]}
        </span>,
      );
    } else if (match[3]) {
      // comment
      parts.push(
        <span key={match.index} style={{ color: 'var(--c-text-muted)', fontStyle: 'italic' }}>
          {match[0]}
        </span>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < code.length) {
    parts.push(code.slice(lastIndex));
  }

  return parts;
}

export default function CodePreview() {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const generatedCode = useCompileStore((s) => s.generatedCode);
  const compileError = useCompileStore((s) => s.compileError);

  const highlighted = useMemo(
    () => (generatedCode ? highlightCode(generatedCode) : null),
    [generatedCode],
  );

  const handleCopy = useCallback(async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for environments where clipboard API is unavailable
      const textarea = document.createElement('textarea');
      textarea.value = generatedCode;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        // copy failed silently
      }
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedCode]);

  return (
    <div
      className="flex flex-col h-full bg-[var(--c-surface)] rounded-[var(--r-md)] border border-[var(--c-border)] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div
        className="flex items-center justify-between shrink-0"
        style={{ padding: 'var(--sp-1) var(--sp-3)' }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="hover:bg-[var(--c-surface-alt)] transition-colors flex items-center rounded-[var(--r-sm)]"
          style={{ gap: 'var(--sp-2)', minHeight: 44, padding: '0 var(--sp-1)' }}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'コードをとじる' : 'コードをひらく'}
        >
          <span className="font-black text-[var(--c-text)]" style={{ fontSize: 'var(--fs-xs)' }}>
            つくったおんがくのレシピ
          </span>
          <span
            className="text-[var(--c-text-muted)]"
            style={{ fontSize: 'var(--fs-xs)' }}
            aria-hidden="true"
          >
            {isOpen ? '▼' : '▶'}
          </span>
        </button>
        {isOpen && generatedCode && (
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-[var(--r-sm)] hover:bg-[var(--c-surface-alt)] transition-colors flex items-center justify-center"
            style={{
              fontSize: 'var(--fs-xs)',
              fontWeight: 700,
              padding: '2px var(--sp-2)',
              color: copied ? 'var(--c-ok)' : 'var(--c-text-muted)',
              border: `1px solid ${copied ? 'var(--c-ok)' : 'var(--c-border)'}`,
              minWidth: 44,
              minHeight: 44,
            }}
            aria-label="コードをコピー"
            aria-live="polite"
          >
            {copied ? 'コピーした！' : 'コピー'}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="flex-1 min-h-0 overflow-auto" style={{ backgroundColor: 'var(--c-surface-blockly)' }}>
          {compileError && (
            <div
              style={{
                padding: 'var(--sp-2) var(--sp-3)',
                backgroundColor: 'color-mix(in srgb, var(--c-error) 8%, transparent)',
                borderBottom: '1px solid color-mix(in srgb, var(--c-error) 25%, transparent)',
              }}
              role="alert"
            >
              <p className="font-bold" style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-error)' }}>
                ブロックがたりないかも？ メニューからえらんでつなげてみてね
              </p>
            </div>
          )}
          {generatedCode ? (
            <pre
              className="leading-relaxed select-all"
              style={{
                padding: 'var(--sp-2) var(--sp-3)',
                fontSize: 'var(--fs-sm)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--c-text-sub)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                margin: 0,
              }}
            >
              <code>{highlighted}</code>
            </pre>
          ) : (
            <p
              className="text-center"
              style={{
                padding: 'var(--sp-3)',
                fontSize: 'var(--fs-sm)',
                color: 'var(--c-text-muted)',
              }}
            >
              ブロックをつなげると、ここにコードがでるよ！
            </p>
          )}
        </div>
      )}
    </div>
  );
}
