import { type Aion } from '../src/types.ts';

// Minimal stand-in for the Aion engine: frames run only when `frame()` is called
export function createFakeAion(): Aion & { frame: (delta: number) => void } {
  const handlers = new Map<string, (delta: number, frameId: number) => void>();
  let frameId = 0;
  const fake = {
    stopped: true,
    queue: [],
    start: () => {
      fake.stopped = false;
    },
    stop: () => {
      fake.stopped = true;
    },
    add: (handler: (delta: number, frameId: number) => void, id = `h_${handlers.size}`) => {
      handlers.set(id, handler);
      return id;
    },
    remove: (id: string) => {
      handlers.delete(id);
    },
    has: (id: string) => handlers.has(id),
    frame: (delta: number) => {
      handlers.forEach((handler) => handler(delta, frameId));
      frameId += 1;
    },
  };
  return fake as unknown as Aion & { frame: (delta: number) => void };
}
