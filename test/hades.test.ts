// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Hades, { DIRECTION, EASING, type HermesEvent } from '../src/index.ts';
import { createFakeAion } from './fakeAion.ts';

function wheel(deltaY: number, deltaX = 0): void {
  document.body.dispatchEvent(new WheelEvent('wheel', { deltaY, deltaX, bubbles: true }));
}

const instances: Hades[] = [];
function createHades(options: ConstructorParameters<typeof Hades>[0] = {}): Hades {
  const instance = new Hades(options);
  instances.push(instance);
  return instance;
}
afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
  vi.restoreAllMocks();
});

let aion: ReturnType<typeof createFakeAion>;

beforeEach(() => {
  aion = createFakeAion();
  document.body.innerHTML = '';
});

describe('Hades frame math', () => {
  it('eases towards the wheel target and settles exactly on it', () => {
    const hades = createHades({ aion, easing: { mode: EASING.LINEAR, duration: 100 } });

    wheel(100);
    aion.frame(50);
    expect(hades.amount.y).toBe(50);
    expect(hades.direction.y).toBe(DIRECTION.DOWN);
    expect(hades.still).toBe(false);

    // Converges within about a second instead of asymptotically forever
    for (let i = 0; i < 60; i++) {
      aion.frame(16);
    }
    expect(hades.amount.y).toBe(100);
    expect(hades.velocity.y).toBe(0);
    expect(hades.still).toBe(true);
  });

  it('does not overshoot a scrollTo shorter than one frame', () => {
    const hades = createHades({ aion, easing: { mode: EASING.CUBIC, duration: 1000 } });
    hades.scrollTo({ y: 500 }, 5);

    aion.frame(16);
    expect(hades.amount.y).toBe(500);
    aion.frame(16);
    expect(hades.amount.y).toBe(500);
  });

  it('jumps immediately with a zero duration', () => {
    const hades = createHades({ aion });
    hades.scrollTo({ x: 10, y: 200 }, 0);
    aion.frame(16);
    expect(hades.amount).toEqual({ x: 10, y: 200 });
  });

  it('lets user input interrupt a scrollTo from the rendered position', () => {
    const hades = createHades({ aion, easing: { mode: EASING.LINEAR, duration: 100 } });
    hades.scrollTo({ y: 1000 }, 100);
    aion.frame(50);
    expect(hades.amount.y).toBe(500);

    wheel(10);
    // Target is now rendered position + delta, not the far scrollTo target
    expect(hades.internalAmount.y).toBe(510);
  });

  it('does not swallow the first tick after a still period', () => {
    const hades = createHades({ aion, easing: { mode: EASING.LINEAR, duration: 100 } });
    for (let i = 0; i < 3; i++) {
      aion.frame(16);
    }
    expect(hades.still).toBe(true);

    wheel(100);
    aion.frame(16);
    expect(hades.internalAmount.y).toBe(100);
  });

  it('drops the pending momentum on a reversal unless smoothDirectionChange is on', () => {
    const abrupt = createHades({ aion, easing: { mode: EASING.LINEAR, duration: 100 } });
    wheel(100);
    aion.frame(20);
    wheel(-100);
    aion.frame(20);
    aion.frame(20);
    // Target was reset onto the rendered position as the direction flipped
    expect(abrupt.internalAmount.y).toBeCloseTo(abrupt.amount.y, 5);
    abrupt.destroy();

    const smooth = createHades({
      aion,
      smoothDirectionChange: true,
      easing: { mode: EASING.LINEAR, duration: 100 },
    });
    wheel(100);
    aion.frame(20);
    wheel(-100);
    aion.frame(20);
    aion.frame(20);
    expect(smooth.internalAmount.y).toBe(0);
  });

  it('applies the threshold and the global multiplier', () => {
    const hades = createHades({ aion, threshold: { x: 0, y: 3 }, globalMultiplier: 2 });
    wheel(2);
    expect(hades.internalAmount.y).toBe(0);
    wheel(10);
    expect(hades.internalAmount.y).toBe(20);
  });

  it('applies a new easing duration from the next frame', () => {
    const hades = createHades({ aion, easing: { mode: EASING.LINEAR, duration: 1000 } });
    hades.easing = { mode: EASING.LINEAR, duration: 100 };
    wheel(100);
    aion.frame(50);
    expect(hades.amount.y).toBe(50);
  });
});

describe('Hades plugins', () => {
  it('hands plugins a copy of the event and keeps the Hermes event untouched', () => {
    const hades = createHades({ aion, globalMultiplier: 3 });
    const seen: HermesEvent[] = [];
    const originals: Event[] = [];
    hades.registerPlugin({
      name: 'probe',
      wheel: (_context, event) => {
        originals.push(event.originalEvent);
        return false;
      },
      scroll: (_context, event) => {
        seen.push(event);
      },
    });

    wheel(10);

    expect(seen[0]?.delta.y).toBe(30);
    expect(originals[0]).toHaveProperty('deltaY', 10);
  });

  it('lets a wheel hook prevent the scroll', () => {
    const hades = createHades({ aion });
    hades.registerPlugin({ name: 'blocker', wheel: () => true });
    wheel(100);
    expect(hades.internalAmount.y).toBe(0);
  });

  it('rejects duplicated plugin names and cleans up on destroy', () => {
    const hades = createHades({ aion });
    const plugin = { name: 'probe', destroy: vi.fn(), pause: vi.fn() };
    hades.registerPlugin(plugin);
    expect(() => hades.registerPlugin({ name: 'probe' })).toThrow('already registered');

    hades.destroy();
    expect(plugin.destroy).toHaveBeenCalledTimes(1);
    expect(hades.running).toBe(false);
    expect(aion.queue).toHaveLength(0);
    expect(hades.getPlugin('probe')).toBeUndefined();
  });
});

describe('Hades input validation and motion preference', () => {
  it('validates easing changes and resolves an immediate scroll followed by a smooth scroll', () => {
    const h = createHades({ aion });
    expect(() => {
      h.easing = { duration: -1 };
    }).toThrow(RangeError);
    expect(() => h.scrollTo({ y: Infinity }, 0)).toThrow(RangeError);
    h.scrollTo({ y: 100 }, 0);
    h.scrollTo({ y: 200 }, 1000);
    aion.frame(16);
    expect(h.amount.y).toBeGreaterThan(0);
    expect(h.amount.y).toBeLessThan(200);
    h.easing = { duration: 0 };
    h.scrollTo({ y: 100 }, 0);
    aion.frame(16);
    expect(h.amount.y).toBe(100);
  });
  it('uses immediate movement for an opted-in reduced-motion preference', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const h = createHades({ aion, respectReducedMotion: true });
    h.scrollTo({ y: 100 }, 1000);
    aion.frame(16);
    expect(h.amount.y).toBe(100);
  });
});
