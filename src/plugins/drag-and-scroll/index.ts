import { type HadesPlugin, type Vec2 } from '../../types.ts';
import type Hades from '../../index.ts';
import type LenisRender from '../lenis-render/index.ts';
import type VirtualRender from '../virtual-render/index.ts';
import { type DragAndScrollOptions } from './types.ts';

class DragAndScroll implements HadesPlugin {
  #context: Hades | null = null;
  #options: DragAndScrollOptions;
  #eventNode: HTMLElement | Window | null = null;
  #pointerDownHandler: (event: Event) => void;
  #pointerMoveHandler: (event: Event) => void;
  #pointerUpHandler: (event: Event) => void;
  #isDragging = false;
  #prevPoint: Vec2 = { x: 0, y: 0 };

  public name = 'DragAndScroll';

  constructor(options: Partial<DragAndScrollOptions> = {}) {
    const defaults: DragAndScrollOptions = {
      proxyNode: null,
      changeCursor: false,
      multiplier: 1,
      autoHandleEvents: true,
      smooth: true,
      invert: false,
    };
    this.#options = { ...defaults, ...options };

    this.#pointerDownHandler = (e: Event): void => this.#pointerDown(e as PointerEvent);
    this.#pointerMoveHandler = (e: Event): void => this.#pointerMove(e as PointerEvent);
    this.#pointerUpHandler = (e: Event): void => this.#pointerUp(e as PointerEvent);
  }

  public register(context: Hades): void {
    this.#context = context;
    if (this.#options.autoHandleEvents) {
      this.attach();
    }
  }

  public attach(): void {
    let node = this.#context?.root;
    if (this.#options.proxyNode) {
      node = this.#options.proxyNode;
    }
    if (typeof node === 'undefined' || node === null) {
      throw new Error('No context or proxyNode specified for DragAndScroll plugin');
    }

    this.#eventNode = node;

    if (typeof window !== 'undefined' && this.#eventNode === window) {
      this.#options.changeCursor = false;
    }
    if (this.#options.changeCursor) {
      (this.#eventNode as HTMLElement).style.cursor = 'grab';
    }

    this.#eventNode?.addEventListener('pointerdown', this.#pointerDownHandler);
    this.#eventNode?.addEventListener('pointermove', this.#pointerMoveHandler);
    this.#eventNode?.addEventListener('pointerup', this.#pointerUpHandler);
    this.#eventNode?.addEventListener('pointerleave', this.#pointerUpHandler);
  }

  public detach(): void {
    this.#eventNode?.removeEventListener('pointerdown', this.#pointerDownHandler);
    this.#eventNode?.removeEventListener('pointermove', this.#pointerMoveHandler);
    this.#eventNode?.removeEventListener('pointerup', this.#pointerUpHandler);
    this.#eventNode?.removeEventListener('pointerleave', this.#pointerUpHandler);
  }

  #pointerDown(event: PointerEvent): void {
    if (this.#isContextPaused || event.pointerType !== 'mouse') {
      return;
    }
    this.#isDragging = true;
    this.#prevPoint = { x: event.clientX, y: event.clientY };
    if (this.#options.changeCursor) {
      (this.#eventNode as HTMLElement).style.cursor = 'grabbing';
    }
  }

  #pointerMove(event: PointerEvent): void {
    if (this.#isContextPaused || event.pointerType !== 'mouse') {
      return;
    }
    const point: Vec2 = { x: event.clientX, y: event.clientY };

    if (this.#isDragging && this.#context !== null) {
      const delta: Vec2 = {
        x: (this.#prevPoint.x - point.x) * this.#options.multiplier,
        y: (this.#prevPoint.y - point.y) * this.#options.multiplier,
      };

      const tempAmount = {
        x: this.#context.internalAmount.x + (!this.#options.invert ? delta.x : delta.y),
        y: this.#context.internalAmount.y + (!this.#options.invert ? delta.y : delta.x),
      };

      // `getRenderer()` may return NativeRender, which has no boundaries to clamp against
      const renderer = this.#context.getRenderer();
      if (renderer && 'boundaries' in renderer) {
        const { boundaries } = renderer as LenisRender | VirtualRender;
        tempAmount.x = Math.min(Math.max(boundaries.min.x, tempAmount.x), boundaries.max.x);
        tempAmount.y = Math.min(Math.max(boundaries.min.y, tempAmount.y), boundaries.max.y);
      }
      this.#context?.scrollTo(tempAmount, this.#options.smooth ? this.#context.easing.duration : 0);
    }
    this.#prevPoint = point;
  }

  #pointerUp(event: PointerEvent): void {
    if (this.#isContextPaused || event.pointerType !== 'mouse') {
      return;
    }
    this.#isDragging = false;
    if (this.#options.changeCursor) {
      (this.#eventNode as HTMLElement).style.cursor = 'grab';
    }
  }

  public play(): void {
    if (this.#options.changeCursor && this.#eventNode) {
      (this.#eventNode as HTMLElement).style.cursor = 'grab';
    }
  }

  public pause(): void {
    if (this.#options.changeCursor && this.#eventNode) {
      (this.#eventNode as HTMLElement).style.cursor = 'unset';
    }
  }

  public destroy(): void {
    // Always detach: removeEventListener is a no-op when nothing was attached,
    // and skipping it leaked listeners when attach() was called manually.
    this.detach();
  }

  get #isContextPaused(): boolean {
    return !this.#context?.running;
  }
}

export default DragAndScroll;
