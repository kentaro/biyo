'use client';

import { useCallback, useRef, useState } from 'react';

type Direction = 'horizontal' | 'vertical';

interface ResizeHandleProps {
  direction: Direction;
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
  onDoubleClick?: () => void;
}

export default function ResizeHandle({
  direction,
  onResize,
  onResizeEnd,
  onDoubleClick,
}: ResizeHandleProps) {
  const isDragging = useRef(false);
  const lastPos = useRef(0);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const [focused, setFocused] = useState(false);

  const isHorizontal = direction === 'horizontal';

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isDragging.current = true;
      lastPos.current = isHorizontal ? e.clientX : e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setActive(true);
    },
    [isHorizontal],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const pos = isHorizontal ? e.clientX : e.clientY;
      const delta = pos - lastPos.current;
      if (delta !== 0) {
        onResize(delta);
        lastPos.current = pos;
      }
    },
    [isHorizontal, onResize],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setActive(false);
      onResizeEnd?.();
    },
    [onResizeEnd],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 50 : 10;

      let delta: number | null = null;

      if (isHorizontal) {
        if (e.key === 'ArrowRight') delta = step;
        else if (e.key === 'ArrowLeft') delta = -step;
      } else {
        if (e.key === 'ArrowDown') delta = step;
        else if (e.key === 'ArrowUp') delta = -step;
      }

      if (delta !== null) {
        e.preventDefault();
        onResize(delta);
        onResizeEnd?.();
        return;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        onDoubleClick?.();
      }
    },
    [isHorizontal, onResize, onResizeEnd, onDoubleClick],
  );

  const highlight = hovered || active;

  return (
    // biome-ignore lint/a11y/useSemanticElements: separator role is appropriate for resize handle, <hr> is not suitable
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      role="separator"
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
      aria-valuenow={50}
      aria-label="パネルのおおきさをかえる"
      tabIndex={0}
      title="ひっぱっておおきさをかえられるよ"
      style={{
        position: 'relative',
        flexShrink: 0,
        cursor: isHorizontal ? 'col-resize' : 'row-resize',
        zIndex: 10,
        width: isHorizontal ? 8 : '100%',
        height: isHorizontal ? '100%' : 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        outline: focused ? '2px solid var(--c-preset)' : 'none',
        outlineOffset: -2,
        borderRadius: 4,
      }}
    >
      {/* Visual dot indicator */}
      <div
        style={{
          width: isHorizontal ? 2 : 24,
          height: isHorizontal ? 24 : 2,
          borderRadius: 1,
          background: highlight ? 'var(--c-preset)' : 'var(--c-border)',
          transition: 'background 0.15s ease, transform 0.15s ease',
          transform: highlight ? (isHorizontal ? 'scaleY(1.6)' : 'scaleX(1.6)') : 'scale(1)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
