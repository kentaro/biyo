'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'biyo-panel-sizes';

interface PanelSizes {
  sidebarWidth: number;
  bottomHeight: number;
}

const DEFAULTS: PanelSizes = {
  sidebarWidth: 220,
  bottomHeight: 100,
};

const MIN = {
  sidebarWidth: 150,
  bottomHeight: 60,
};

const MAX = {
  sidebarWidth: 500,
  bottomHeight: 400,
};

function loadSizes(): PanelSizes {
  /* v8 ignore start */
  if (typeof window === 'undefined') return DEFAULTS;
  /* v8 ignore stop */
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PanelSizes>;
      return {
        sidebarWidth: clamp(
          parsed.sidebarWidth ?? DEFAULTS.sidebarWidth,
          MIN.sidebarWidth,
          MAX.sidebarWidth,
        ),
        bottomHeight: clamp(
          parsed.bottomHeight ?? DEFAULTS.bottomHeight,
          MIN.bottomHeight,
          MAX.bottomHeight,
        ),
      };
    }
  } catch {
    // ignore
  }
  return DEFAULTS;
}

function saveSizes(sizes: PanelSizes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
  } catch {
    // ignore
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useResizableLayout() {
  const [sizes, setSizes] = useState<PanelSizes>(DEFAULTS);
  const initialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    setSizes(loadSizes());
    initialized.current = true;
  }, []);

  const resizeSidebar = useCallback((delta: number) => {
    setSizes((prev) => ({
      ...prev,
      sidebarWidth: clamp(
        prev.sidebarWidth - delta, // negative delta = wider sidebar (drag left)
        MIN.sidebarWidth,
        MAX.sidebarWidth,
      ),
    }));
  }, []);

  const resizeBottom = useCallback((delta: number) => {
    setSizes((prev) => ({
      ...prev,
      bottomHeight: clamp(
        prev.bottomHeight - delta, // negative delta = taller bottom (drag up)
        MIN.bottomHeight,
        MAX.bottomHeight,
      ),
    }));
  }, []);

  const persistSizes = useCallback(() => {
    setSizes((current) => {
      saveSizes(current);
      return current;
    });
  }, []);

  const resetSidebar = useCallback(() => {
    setSizes((prev) => {
      const next = { ...prev, sidebarWidth: DEFAULTS.sidebarWidth };
      saveSizes(next);
      return next;
    });
  }, []);

  const resetBottom = useCallback(() => {
    setSizes((prev) => {
      const next = { ...prev, bottomHeight: DEFAULTS.bottomHeight };
      saveSizes(next);
      return next;
    });
  }, []);

  return {
    sidebarWidth: sizes.sidebarWidth,
    bottomHeight: sizes.bottomHeight,
    resizeSidebar,
    resizeBottom,
    persistSizes,
    resetSidebar,
    resetBottom,
  };
}
