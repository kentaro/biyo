import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useResizableLayout } from '../useResizableLayout';

const STORAGE_KEY = 'biyo-panel-sizes';

const DEFAULTS = {
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

// Create a simple localStorage mock that works reliably across jsdom versions
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

describe('useResizableLayout', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: storageMock,
      writable: true,
    });
  });

  // ----------------------------------------------------------------
  // Initial values
  // ----------------------------------------------------------------
  describe('initial values', () => {
    it('returns default sidebarWidth', () => {
      const { result } = renderHook(() => useResizableLayout());
      expect(result.current.sidebarWidth).toBe(DEFAULTS.sidebarWidth);
    });

    it('returns default bottomHeight', () => {
      const { result } = renderHook(() => useResizableLayout());
      expect(result.current.bottomHeight).toBe(DEFAULTS.bottomHeight);
    });

    it('returns all expected functions', () => {
      const { result } = renderHook(() => useResizableLayout());
      expect(typeof result.current.resizeSidebar).toBe('function');
      expect(typeof result.current.resizeBottom).toBe('function');
      expect(typeof result.current.persistSizes).toBe('function');
      expect(typeof result.current.resetSidebar).toBe('function');
      expect(typeof result.current.resetBottom).toBe('function');
    });
  });

  // ----------------------------------------------------------------
  // Loading from localStorage on init
  // ----------------------------------------------------------------
  describe('loading from localStorage on init', () => {
    it('loads saved sizes from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sidebarWidth: 300, bottomHeight: 200 }));
      const { result } = renderHook(() => useResizableLayout());
      // After the useEffect fires, sizes should reflect localStorage
      expect(result.current.sidebarWidth).toBe(300);
      expect(result.current.bottomHeight).toBe(200);
    });

    it('clamps loaded sidebarWidth below minimum to minimum', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sidebarWidth: 10, bottomHeight: 200 }));
      const { result } = renderHook(() => useResizableLayout());
      expect(result.current.sidebarWidth).toBe(MIN.sidebarWidth);
    });

    it('clamps loaded sidebarWidth above maximum to maximum', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sidebarWidth: 9999, bottomHeight: 200 }));
      const { result } = renderHook(() => useResizableLayout());
      expect(result.current.sidebarWidth).toBe(MAX.sidebarWidth);
    });

    it('clamps loaded bottomHeight below minimum to minimum', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sidebarWidth: 300, bottomHeight: 1 }));
      const { result } = renderHook(() => useResizableLayout());
      expect(result.current.bottomHeight).toBe(MIN.bottomHeight);
    });

    it('clamps loaded bottomHeight above maximum to maximum', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sidebarWidth: 300, bottomHeight: 9999 }));
      const { result } = renderHook(() => useResizableLayout());
      expect(result.current.bottomHeight).toBe(MAX.bottomHeight);
    });

    it('uses defaults when localStorage has invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not-valid-json');
      const { result } = renderHook(() => useResizableLayout());
      expect(result.current.sidebarWidth).toBe(DEFAULTS.sidebarWidth);
      expect(result.current.bottomHeight).toBe(DEFAULTS.bottomHeight);
    });

    it('uses defaults when localStorage is empty', () => {
      const { result } = renderHook(() => useResizableLayout());
      expect(result.current.sidebarWidth).toBe(DEFAULTS.sidebarWidth);
      expect(result.current.bottomHeight).toBe(DEFAULTS.bottomHeight);
    });

    it('uses defaults for missing fields in stored object', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
      const { result } = renderHook(() => useResizableLayout());
      expect(result.current.sidebarWidth).toBe(DEFAULTS.sidebarWidth);
      expect(result.current.bottomHeight).toBe(DEFAULTS.bottomHeight);
    });

    it('uses default for missing sidebarWidth in stored object', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ bottomHeight: 200 }));
      const { result } = renderHook(() => useResizableLayout());
      expect(result.current.sidebarWidth).toBe(DEFAULTS.sidebarWidth);
      expect(result.current.bottomHeight).toBe(200);
    });

    it('uses default for missing bottomHeight in stored object', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sidebarWidth: 300 }));
      const { result } = renderHook(() => useResizableLayout());
      expect(result.current.sidebarWidth).toBe(300);
      expect(result.current.bottomHeight).toBe(DEFAULTS.bottomHeight);
    });

    it('handles localStorage.getItem throwing an error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage error');
      });
      const { result } = renderHook(() => useResizableLayout());
      expect(result.current.sidebarWidth).toBe(DEFAULTS.sidebarWidth);
      expect(result.current.bottomHeight).toBe(DEFAULTS.bottomHeight);
    });
  });

  // ----------------------------------------------------------------
  // resizeSidebar
  // ----------------------------------------------------------------
  describe('resizeSidebar', () => {
    it('updates width with positive delta (narrower)', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        result.current.resizeSidebar(20);
      });
      // sidebarWidth = 220 - 20 = 200
      expect(result.current.sidebarWidth).toBe(200);
    });

    it('updates width with negative delta (wider)', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        result.current.resizeSidebar(-30);
      });
      // sidebarWidth = 220 - (-30) = 250
      expect(result.current.sidebarWidth).toBe(250);
    });

    it('clamps to minimum when delta makes width too small', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        // 220 - 1000 = -780, should clamp to 150
        result.current.resizeSidebar(1000);
      });
      expect(result.current.sidebarWidth).toBe(MIN.sidebarWidth);
    });

    it('clamps to maximum when delta makes width too large', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        // 220 - (-1000) = 1220, should clamp to 500
        result.current.resizeSidebar(-1000);
      });
      expect(result.current.sidebarWidth).toBe(MAX.sidebarWidth);
    });

    it('does not affect bottomHeight', () => {
      const { result } = renderHook(() => useResizableLayout());
      const originalBottom = result.current.bottomHeight;
      act(() => {
        result.current.resizeSidebar(20);
      });
      expect(result.current.bottomHeight).toBe(originalBottom);
    });
  });

  // ----------------------------------------------------------------
  // resizeBottom
  // ----------------------------------------------------------------
  describe('resizeBottom', () => {
    it('updates height with positive delta (shorter)', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        result.current.resizeBottom(20);
      });
      // bottomHeight = 100 - 20 = 80
      expect(result.current.bottomHeight).toBe(80);
    });

    it('updates height with negative delta (taller)', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        result.current.resizeBottom(-50);
      });
      // bottomHeight = 100 - (-50) = 150
      expect(result.current.bottomHeight).toBe(150);
    });

    it('clamps to minimum when delta makes height too small', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        // 100 - 1000 = -900, should clamp to 60
        result.current.resizeBottom(1000);
      });
      expect(result.current.bottomHeight).toBe(MIN.bottomHeight);
    });

    it('clamps to maximum when delta makes height too large', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        // 100 - (-1000) = 1100, should clamp to 400
        result.current.resizeBottom(-1000);
      });
      expect(result.current.bottomHeight).toBe(MAX.bottomHeight);
    });

    it('does not affect sidebarWidth', () => {
      const { result } = renderHook(() => useResizableLayout());
      const originalSidebar = result.current.sidebarWidth;
      act(() => {
        result.current.resizeBottom(20);
      });
      expect(result.current.sidebarWidth).toBe(originalSidebar);
    });
  });

  // ----------------------------------------------------------------
  // persistSizes
  // ----------------------------------------------------------------
  describe('persistSizes', () => {
    it('saves current sizes to localStorage', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        result.current.resizeSidebar(-80); // 220 + 80 = 300
        result.current.resizeBottom(-100); // 100 + 100 = 200
      });
      act(() => {
        result.current.persistSizes();
      });
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.sidebarWidth).toBe(300);
      expect(stored.bottomHeight).toBe(200);
    });

    it('saves default sizes when no changes made', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        result.current.persistSizes();
      });
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.sidebarWidth).toBe(DEFAULTS.sidebarWidth);
      expect(stored.bottomHeight).toBe(DEFAULTS.bottomHeight);
    });

    it('handles localStorage.setItem throwing an error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage full');
      });
      const { result } = renderHook(() => useResizableLayout());
      // Should not throw
      expect(() => {
        act(() => {
          result.current.persistSizes();
        });
      }).not.toThrow();
    });
  });

  // ----------------------------------------------------------------
  // resetSidebar
  // ----------------------------------------------------------------
  describe('resetSidebar', () => {
    it('restores sidebarWidth to default', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        result.current.resizeSidebar(-80); // 300
      });
      expect(result.current.sidebarWidth).toBe(300);
      act(() => {
        result.current.resetSidebar();
      });
      expect(result.current.sidebarWidth).toBe(DEFAULTS.sidebarWidth);
    });

    it('does not affect bottomHeight', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        result.current.resizeBottom(-100); // 200
      });
      act(() => {
        result.current.resetSidebar();
      });
      expect(result.current.bottomHeight).toBe(200);
    });

    it('persists the reset to localStorage', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        result.current.resizeSidebar(-80); // 300
      });
      act(() => {
        result.current.resetSidebar();
      });
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.sidebarWidth).toBe(DEFAULTS.sidebarWidth);
    });
  });

  // ----------------------------------------------------------------
  // resetBottom
  // ----------------------------------------------------------------
  describe('resetBottom', () => {
    it('restores bottomHeight to default', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        result.current.resizeBottom(-100); // 200
      });
      expect(result.current.bottomHeight).toBe(200);
      act(() => {
        result.current.resetBottom();
      });
      expect(result.current.bottomHeight).toBe(DEFAULTS.bottomHeight);
    });

    it('does not affect sidebarWidth', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        result.current.resizeSidebar(-80); // 300
      });
      act(() => {
        result.current.resetBottom();
      });
      expect(result.current.sidebarWidth).toBe(300);
    });

    it('persists the reset to localStorage', () => {
      const { result } = renderHook(() => useResizableLayout());
      act(() => {
        result.current.resizeBottom(-100); // 200
      });
      act(() => {
        result.current.resetBottom();
      });
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.bottomHeight).toBe(DEFAULTS.bottomHeight);
    });
  });
});
