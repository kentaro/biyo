'use client';

import { useCallback, useState } from 'react';
import { useCompileStore } from '@/lib/stores/compile';

export default function CodePreview() {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const generatedCode = useCompileStore((s) => s.generatedCode);
  const compileError = useCompileStore((s) => s.compileError);

  const handleCopy = useCallback(async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = generatedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
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
          className="hover:bg-[var(--c-surface-alt)] transition-colors flex items-center"
          style={{ gap: 'var(--sp-2)' }}
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
            className="rounded-[var(--r-sm)] hover:bg-[var(--c-surface-alt)] transition-colors"
            style={{
              fontSize: 'var(--fs-xs)',
              fontWeight: 700,
              padding: '2px var(--sp-2)',
              color: copied ? 'var(--c-ok)' : 'var(--c-text-muted)',
              border: `1px solid ${copied ? 'var(--c-ok)' : 'var(--c-border)'}`,
            }}
            aria-label="コードをコピー"
            aria-live="polite"
          >
            {copied ? 'コピーした！' : 'コピー'}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="flex-1 min-h-0 overflow-auto bg-[var(--c-surface-blockly)]">
          {compileError && (
            <div
              style={{ padding: 'var(--sp-2) var(--sp-3)' }}
              className="bg-red-50 border-b border-red-200"
              role="alert"
            >
              <p className="text-[var(--c-error)] font-bold" style={{ fontSize: 'var(--fs-xs)' }}>
                ブロックがたりないかも？ひだりのメニューからえらんでつなげてみてね
              </p>
            </div>
          )}
          <pre
            className="text-[var(--c-text-sub)] whitespace-pre-wrap break-all leading-relaxed select-all"
            style={{
              padding: 'var(--sp-2) var(--sp-3)',
              fontSize: 'var(--fs-xs)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <code>{generatedCode || '// ブロックをつなげるとコードが出るよ！'}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
