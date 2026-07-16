import { type HadesPlugin, type Vec2 } from '../../types.ts';
import type Hades from '../../index.ts';
import { type NativeRenderOptions } from './types.ts';

class NativeRender implements HadesPlugin {
  #native: Vec2 = { x: 0, y: 0 };

  #context: Hades | null = null;
  #options: NativeRenderOptions;
  #nativeScrollHandler: (event: Event) => void;

  public name = 'NativeRender';

  constructor(options: Partial<NativeRenderOptions>) {
    const defaults: NativeRenderOptions = {
      scrollNode: window,
    };

    this.#options = { ...defaults, ...options };
    this.#nativeScrollHandler = (e: Event): void => this.#nativeScroll(e);

    this.#options.scrollNode.addEventListener('scroll', this.#nativeScrollHandler);
  }

  public register(context: Hades): void {
    this.#context = context;
  }

  public render(context: Hades): void {
    // Use the render cycle to write hades internal amount
    context.scrollTo(
      {
        x: this.#native.x,
        y: this.#native.y,
      },
      0,
      true,
    ); // Prevent the call for plugin scrollTo
  }

  public scrollTo(_context: Hades, position: Partial<Vec2>): void {
    // Keep the raw (possibly undefined) values as per original runtime behaviour
    this.#options.scrollNode.scrollTo(position.x as number, position.y as number);
  }

  #nativeScroll(_event: Event): void {
    if (this.#context) {
      const isWindow = this.#options.scrollNode === window;
      this.#native = {
        x: isWindow ? window.scrollX : (this.#options.scrollNode as HTMLElement).scrollLeft,
        y: isWindow ? window.scrollY : (this.#options.scrollNode as HTMLElement).scrollTop,
      };
    }
  }

  public destroy(): void {
    this.#options.scrollNode.removeEventListener('scroll', this.#nativeScrollHandler);
  }

  // Common getters for some internal props

  public get native(): Vec2 {
    return this.#native;
  }
}

export default NativeRender;
