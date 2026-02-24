import type React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// A component that throws during rendering
function ThrowingComponent({ message }: { message: string }): React.JSX.Element {
  throw new Error(message);
}

// A component that renders normally
function GoodComponent() {
  return <div>OK</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws', () => {
    // Suppress React error boundary console noise in test output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent message="test crash" />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('あれれ？なにかおかしくなっちゃった！')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'やりなおす' })).toBeInTheDocument();

    spy.mockRestore();
  });

  it('renders custom fallback message when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallbackMessage="エディタでエラーがおきちゃった！">
        <ThrowingComponent message="editor crash" />
      </ErrorBoundary>,
    );

    expect(screen.getByText('エディタでエラーがおきちゃった！')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('logs error details to console', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent message="debug info" />
      </ErrorBoundary>,
    );

    // componentDidCatch calls console.error twice (error + component stack)
    const calls = errorSpy.mock.calls;
    const errorLogCall = calls.find(
      (call) => call[0] === '[ErrorBoundary] Caught error:' && call[1] instanceof Error,
    );
    expect(errorLogCall).toBeDefined();
    expect((errorLogCall![1] as Error).message).toBe('debug info');

    const stackLogCall = calls.find((call) => call[0] === '[ErrorBoundary] Component stack:');
    expect(stackLogCall).toBeDefined();

    errorSpy.mockRestore();
  });

  it('reload button calls window.location.reload', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent message="reload test" />
      </ErrorBoundary>,
    );

    screen.getByRole('button', { name: 'やりなおす' }).click();
    expect(reloadMock).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });
});
