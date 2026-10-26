import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardViewport } from '@/hooks/useKeyboardViewport';

// A controllable stand-in for window.visualViewport (jsdom has none).
function installVisualViewport({ height, offsetTop = 0, scale = 1 }) {
  const target = new EventTarget();
  const vv = { height, offsetTop, scale, addEventListener: target.addEventListener.bind(target), removeEventListener: target.removeEventListener.bind(target) };
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true });
  return {
    set(patch) { Object.assign(vv, patch); target.dispatchEvent(new Event('resize')); },
  };
}

describe('useKeyboardViewport', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 1; });
    Object.defineProperty(window, 'innerHeight', { value: 664, configurable: true });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete window.visualViewport;
  });

  it('is closed while the visual viewport fills the layout viewport', () => {
    installVisualViewport({ height: 664 });
    const { result } = renderHook(() => useKeyboardViewport());
    expect(result.current.open).toBe(false);
  });

  it('opens with the visible height and offset when the keyboard shrinks the visual viewport', () => {
    const vv = installVisualViewport({ height: 664 });
    const { result } = renderHook(() => useKeyboardViewport());
    act(() => vv.set({ height: 410, offsetTop: 48 }));
    expect(result.current).toEqual({ open: true, height: 410, offsetTop: 48 });
    act(() => vv.set({ height: 664, offsetTop: 0 }));
    expect(result.current.open).toBe(false);
  });

  it('ignores small changes such as the Safari toolbar collapsing', () => {
    const vv = installVisualViewport({ height: 664 });
    const { result } = renderHook(() => useKeyboardViewport());
    act(() => vv.set({ height: 600 }));
    expect(result.current.open).toBe(false);
  });

  it('does not mistake a pinch-zoom for the keyboard', () => {
    const vv = installVisualViewport({ height: 664 });
    const { result } = renderHook(() => useKeyboardViewport());
    act(() => vv.set({ height: 300, scale: 2 }));
    expect(result.current.open).toBe(false);
  });

  it('stays closed when visualViewport is unavailable', () => {
    delete window.visualViewport;
    const { result } = renderHook(() => useKeyboardViewport());
    expect(result.current.open).toBe(false);
  });
});
