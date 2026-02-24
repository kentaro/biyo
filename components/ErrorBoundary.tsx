'use client';

import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional: custom fallback message (defaults to generic child-friendly text) */
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error Boundary that catches rendering errors and shows a child-friendly
 * error screen instead of crashing the entire app.
 *
 * Must be a class component because React error boundaries require
 * getDerivedStateFromError / componentDidCatch lifecycle methods.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const message = this.props.fallbackMessage ?? 'あれれ？なにかおかしくなっちゃった！';

      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '200px',
            padding: 'var(--sp-6)',
            fontFamily: 'var(--font-main)',
            background: 'var(--c-bg)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: 'var(--sp-4)',
            }}
            aria-hidden="true"
          >
            {'\uD83D\uDE35\u200D\uD83D\uDCAB'}
          </div>
          <div
            style={{
              fontSize: 'var(--fs-lg)',
              fontWeight: 700,
              color: 'var(--c-text)',
              marginBottom: 'var(--sp-3)',
              lineHeight: 1.4,
            }}
          >
            {message}
          </div>
          <div
            style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--c-text-muted)',
              marginBottom: 'var(--sp-5)',
            }}
          >
            ボタンをおしてやりなおしてみてね
          </div>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              background: 'var(--c-preset)',
              color: 'var(--c-text-inverse)',
              border: 'none',
              borderRadius: 'var(--r-md)',
              padding: 'var(--sp-3) var(--sp-6)',
              fontSize: 'var(--fs-md)',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-main)',
              boxShadow: 'var(--shadow-btn)',
            }}
          >
            やりなおす
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
