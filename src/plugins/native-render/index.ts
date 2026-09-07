import { type HadesPlugin, type Vec2 } from '../../types.ts';
import type Hades from '../../index.ts';
import { getScrollPosition } from '../../utils.ts';
import { type NativeRenderOptions } from './types.ts';

class NativeRender implements HadesPlugin {
  #native: Vec2 = { x: 0, y: 0 };
  #renderPosition: Vec2 = { x: 0, y: 0 };
  #context: Hades | null = null;
  #options: NativeRenderOptions;
  #nativeScrollHandler: (event: Event) => void;

  public name = 'NativeRender';

  constructor(options: Partial<NativeRenderOptions> = {}) {
    const defaults: NativeRenderOptions = {
      scrollNode: typeof window !== 'undefined' ? window : ({} as Window),
    };
    this.#options = { ...defaults, ...options };
    this.#nativeScrollHandler = (e: Event): void => this.#nativeScroll(e);

    if (typeof window !== 'undefined') {
      this.#options.scrollNode.addEventListener('scroll', this.#nativeScrollHandler);
    }
  }

  public register(context: Hades): void {
    this.#context = context;
  }

  public render(context: Hades): void {
    // Reuse a single object instead of allocating one per frame; `scrollTo`
    // reads it synchronously and does not retain the reference.
    this.#renderPosition.x = this.#native.x;
    this.#renderPosition.y = this.#native.y;
    context.scrollTo(this.#renderPosition, 0, true);
  }

  public scrollTo(_context: Hades, position: Partial<Vec2>): void {
    if (typeof window === 'undefined') {
      return;
    }
    // Preserve the axis that was not specified instead of coercing `undefined` to 0
    const node = this.#options.scrollNode;
    const current = getScrollPosition(node);
    node.scrollTo(position.x ?? current.x, position.y ?? current.y);
  }

  #nativeScroll(_event: Event): void {
    if (this.#context && typeof window !== 'undefined') {
      const position = getScrollPosition(this.#options.scrollNode);
      this.#native.x = position.x;
      this.#native.y = position.y;
    }
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      this.#options.scrollNode.removeEventListener('scroll', this.#nativeScrollHandler);
    }
  }

  public get native(): Vec2 {
    return this.#native;
  }
}

export default NativeRender;
