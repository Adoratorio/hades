// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Hades, { DIRECTION, EASING, type HermesEvent } from '../src/index.ts';
import { createFakeAion } from './fakeAion.ts';

function wheel(deltaY: number, deltaX = 0): void {
  document.body.dispatchEvent(new WheelEvent('wheel', { deltaY, deltaX, bubbles: true }));
}

let aion: ReturnType<typeof createFakeAion>;

beforeEach(() => {
  aion = createFakeAion();
  document.body.innerHTML = '';
});

describe('Hades frame math', () => {
  it('eases towards the wheel target and settles exactly on it', () => {
    const hades = new Hades({ aion, easing: { mode: EASING.LINEAR, duration: 100 } });

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
    const hades = new Hades({ aion, easing: { mode: EASING.CUBIC, duration: 1000 } });
    hades.scrollTo({ y: 500 }, 5);

    aion.frame(16);
    expect(hades.amount.y).toBe(500);
    aion.frame(16);
    expect(hades.amount.y).toBe(500);
  });

  it('jumps immediately with a zero duration', () => {
    const hades = new Hades({ aion });
    hades.scrollTo({ x: 10, y: 200 }, 0);
    aion.frame(16);
    expect(hades.amount).toEqual({ x: 10, y: 200 });
  });

  it('lets user input interrupt a scrollTo from the rendered position', () => {
    const hades = new Hades({ aion, easing: { mode: EASING.LINEAR, duration: 100 } });
    hades.scrollTo({ y: 1000 }, 100);
    aion.frame(50);
    expect(hades.amount.y).toBe(500);

    wheel(10);
    // Target is now rendered position + delta, not the far scrollTo target
    expect(hades.internalAmount.y).toBe(510);
  });

  it('does not swallow the first tick after a still period', () => {
    const hades = new Hades({ aion, easing: { mode: EASING.LINEAR, duration: 100 } });
    for (let i = 0; i < 3; i++) {
      aion.frame(16);
    }
    expect(hades.still).toBe(true);

    wheel(100);
    aion.frame(16);
    expect(hades.internalAmount.y).toBe(100);
  });

  it('drops the pending momentum on a reversal unless smoothDirectionChange is on', () => {
    const abrupt = new Hades({ aion, easing: { mode: EASING.LINEAR, duration: 100 } });
    wheel(100);
    aion.frame(20);
    wheel(-100);
    aion.frame(20);
    aion.frame(20);
    // Target was reset onto the rendered position as the direction flipped
    expect(abrupt.internalAmount.y).toBeCloseTo(abrupt.amount.y, 5);
    abrupt.destroy();

    const smooth = new Hades({
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
    const hades = new Hades({ aion, threshold: { x: 0, y: 3 }, globalMultiplier: 2 });
    wheel(2);
    expect(hades.internalAmount.y).toBe(0);
    wheel(10);
    expect(hades.internalAmount.y).toBe(20);
  });

  it('applies a new easing duration from the next frame', () => {
    const hades = new Hades({ aion, easing: { mode: EASING.LINEAR, duration: 1000 } });
    hades.easing = { mode: EASING.LINEAR, duration: 100 };
    wheel(100);
    aion.frame(50);
    expect(hades.amount.y).toBe(50);
  });
});

describe('Hades plugins', () => {
  it('hands plugins a copy of the event and keeps the Hermes event untouched', () => {
    const hades = new Hades({ aion, globalMultiplier: 3 });
    const seen: HermesEvent[] = [];
    let original: WheelEvent | null = null;
    hades.registerPlugin({
      name: 'probe',
      wheel: (_context, event) => {
        original = event.originalEvent as WheelEvent;
        return false;
      },
      scroll: (_context, event) => {
        seen.push(event);
      },
    });

    wheel(10);

    expect(seen[0]?.delta.y).toBe(30);
    expect(original?.deltaY).toBe(10);
  });

  it('lets a wheel hook prevent the scroll', () => {
    const hades = new Hades({ aion });
    hades.registerPlugin({ name: 'blocker', wheel: () => true });
    wheel(100);
    expect(hades.internalAmount.y).toBe(0);
  });

  it('rejects duplicated plugin names and cleans up on destroy', () => {
    const hades = new Hades({ aion });
    const plugin = { name: 'probe', destroy: vi.fn(), pause: vi.fn() };
    hades.registerPlugin(plugin);
    expect(() => hades.registerPlugin({ name: 'probe' })).toThrow('already registered');

    hades.destroy();
    expect(plugin.destroy).toHaveBeenCalledTimes(1);
    expect(hades.running).toBe(false);
    expect(aion.has('hades-frame-0')).toBe(false);
    expect(hades.getPlugin('probe')).toBeUndefined();
  });
});
