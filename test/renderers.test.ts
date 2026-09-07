// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Hades, { Boundaries } from '../src/index.ts';
import {
  VirtualRender,
  LenisRender,
  NativeRender,
  Scrollbars,
  DragAndScroll,
  StartStop,
} from '../src/plugins/index.ts';
import { createFakeAion } from './fakeAion.ts';

const instances: Hades[] = [];
function setup() {
  const aion = createFakeAion();
  const hades = new Hades({ aion, easing: { duration: 0 } });
  instances.push(hades);
  return { aion, hades };
}
function size(node: HTMLElement, values: Record<string, number>): void {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(node, key, { value, configurable: true });
  }
}
beforeEach(() => {
  document.body.innerHTML = '';
});
afterEach(() => {
  for (const h of instances.splice(0)) {
    h.destroy();
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('VirtualRender', () => {
  it('clamps programmatic destinations and keeps infinite scrolling available', () => {
    const { aion, hades } = setup();
    const p = new VirtualRender({
      autoBoundaries: false,
      boundaries: new Boundaries(0, 0, 0, 100),
    });
    hades.registerPlugin(p);
    hades.scrollTo({ y: 1000 }, 0);
    aion.frame(16);
    expect(hades.amount.y).toBe(100);
    p.infiniteScroll = true;
    hades.scrollTo({ y: 1000 }, 0);
    aion.frame(16);
    expect(hades.amount.y).toBe(1000);
  });

  it('clamps the rendered position after bounds shrink and restores styles', () => {
    const { aion, hades } = setup();
    const node = document.createElement('div');
    node.style.transform = 'scale(1)';
    const p = new VirtualRender({
      scrollNode: node,
      autoBoundaries: false,
      boundaries: new Boundaries(0, 0, 0, 500),
    });
    hades.registerPlugin(p);
    hades.scrollTo({ y: 500 }, 0);
    aion.frame(16);
    p.boundaries = new Boundaries(0, 0, 0, 100);
    aion.frame(16);
    expect(hades.amount.y).toBe(100);
    hades.destroy();
    expect(node.style.transform).toBe('scale(1)');
  });
});

describe('LenisRender', () => {
  it('uses viewport height for window bounds and avoids repeated layout reads', () => {
    const { hades } = setup();
    size(document.body, { scrollHeight: 2000, clientHeight: 2000 });
    Object.defineProperty(document.body, 'scrollHeight', { get: () => 2000, configurable: true });
    const read = vi.spyOn(document.body, 'scrollHeight', 'get');
    const p = new LenisRender();
    hades.registerPlugin(p);
    expect(p.boundaries.max.y).toBe(Math.max(0, 2000 - window.innerHeight));
    const count = read.mock.calls.length;
    expect(p.boundaries.max.y).toBe(2000 - window.innerHeight);
    expect(p.boundaries.max.y).toBe(2000 - window.innerHeight);
    expect(read).toHaveBeenCalledTimes(count);
  });

  it('preserves nested native scroll until the inner scroller reaches its boundary', () => {
    const { hades } = setup();
    const p = new LenisRender();
    hades.registerPlugin(p);
    const outer = document.createElement('div');
    outer.style.overflow = 'auto';
    const inner = document.createElement('div');
    const leaf = document.createElement('span');
    outer.append(inner);
    inner.append(leaf);
    document.body.append(outer);
    size(outer, { scrollHeight: 500, clientHeight: 100 });
    const event = new WheelEvent('wheel', { deltaY: 10, bubbles: true, cancelable: true });
    leaf.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    outer.scrollTop = 400;
    const next = new WheelEvent('wheel', { deltaY: 10, bubbles: true, cancelable: true });
    leaf.dispatchEvent(next);
    expect(next.defaultPrevented).toBe(true);
  });

  it('recalculates bounds for content growth and synchronizes a replacement node', () => {
    const { aion, hades } = setup();
    const node = document.createElement('div');
    size(node, { scrollHeight: 600, clientHeight: 100 });
    const p = new LenisRender({ scrollNode: node });
    hades.registerPlugin(p);
    expect(p.boundaries.max.y).toBe(500);
    size(node, { scrollHeight: 900 });
    p.recalculate();
    expect(p.boundaries.max.y).toBe(800);
    const replacement = document.createElement('div');
    size(replacement, { scrollHeight: 900, clientHeight: 100 });
    replacement.scrollTop = 250;
    p.swapScrollNode(replacement);
    aion.frame(16);
    expect(hades.amount.y).toBe(250);
  });
});

describe('NativeRender', () => {
  it('initializes from an already scrolled element and detaches on destroy', () => {
    const { aion, hades } = setup();
    const node = document.createElement('div');
    node.scrollTop = 250;
    const p = new NativeRender({ scrollNode: node });
    hades.registerPlugin(p);
    aion.frame(16);
    expect(p.native.y).toBe(250);
    expect(hades.amount.y).toBe(250);
    hades.destroy();
    node.scrollTop = 400;
    node.dispatchEvent(new Event('scroll'));
    expect(p.native.y).toBe(250);
  });
});

describe('Scrollbars', () => {
  it('updates thumb position when track length changes without a ratio change', () => {
    const { aion, hades } = setup();
    hades.registerPlugin(
      new VirtualRender({ autoBoundaries: false, boundaries: new Boundaries(0, 0, 0, 1000) }),
    );
    const p = new Scrollbars();
    hades.registerPlugin(p);
    const track = document.querySelector<HTMLElement>('[data-scrollbar="track-y"]')!;
    let length = 500;
    track.getBoundingClientRect = () => new DOMRect(0, 0, 8, length);
    window.dispatchEvent(new Event('resize'));
    hades.scrollTo({ y: 500 }, 0);
    aion.frame(16);
    const thumb = track.querySelector<HTMLElement>('.scrollbar__thumb')!;
    const initial = thumb.style.transform;
    length = 800;
    window.dispatchEvent(new Event('resize'));
    aion.frame(16);
    expect(thumb.style.transform).not.toBe(initial);
  });

  it('supports keyboard scrolling and removes injected UI', () => {
    const { hades } = setup();
    hades.registerPlugin(
      new VirtualRender({ autoBoundaries: false, boundaries: new Boundaries(0, 0, 0, 1000) }),
    );
    hades.registerPlugin(new Scrollbars());
    const track = document.querySelector<HTMLElement>('[role="scrollbar"]')!;
    track.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
    );
    expect(hades.internalAmount.y).toBe(1000);
    hades.destroy();
    expect(document.querySelector('[role="scrollbar"]')).toBeNull();
  });
});

describe('DragAndScroll', () => {
  it('releases pointer capture on pause and restores the original cursor on destroy', () => {
    const { hades } = setup();
    const node = document.createElement('div');
    node.style.cursor = 'crosshair';
    document.body.append(node);
    node.setPointerCapture = vi.fn();
    node.hasPointerCapture = vi.fn(() => true);
    node.releasePointerCapture = vi.fn();
    hades.registerPlugin(new DragAndScroll({ proxyNode: node, changeCursor: true }));
    node.dispatchEvent(
      new PointerEvent('pointerdown', { pointerType: 'mouse', pointerId: 1, button: 0 }),
    );
    expect(node.style.userSelect).toBe('none');
    hades.pause();
    expect(node.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(node.style.userSelect).toBe('');
    hades.destroy();
    expect(node.style.cursor).toBe('crosshair');
  });
});

describe('StartStop', () => {
  it('reports fine-pointer movement and settling with partial callbacks', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    const { aion, hades } = setup();
    const start = vi.fn();
    const stop = vi.fn();
    hades.registerPlugin(new StartStop({ callbacks: { start, stop } }));
    hades.scrollTo({ y: 100 }, 0);
    aion.frame(16);
    aion.frame(16);
    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
