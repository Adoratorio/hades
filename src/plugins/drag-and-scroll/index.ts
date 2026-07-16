import { type HadesPlugin, type Vec2 } from '../../types.ts';
import type Hades from '../../index.ts';
import type LenisRender from '../lenis-render/index.ts';
import type VirtualRender from '../virtual-render/index.ts';
import { type DragAndScrollOptions } from './types.ts';

class DragAndScroll implements HadesPlugin {
  #context: Hades | null = null;
  #options: DragAndScrollOptions;
  #eventNode: HTMLElement | Window | null = null;
  #mouseDownHandler: (event: Event) => void;
  #mouseMoveHandler: (event: Event) => void;
  #mouseUpHandler: (event: Event) => void;
  #isDragging = false;
  #prevPoint: Vec2 = { x: 0, y: 0 };

  public name = 'DragAndScroll';

  constructor(options: Partial<DragAndScrollOptions>) {
    const defaults: DragAndScrollOptions = {
      proxyNode: null,
      changeCursor: false,
      multiplier: 1,
      autoHandleEvents: true,
      smooth: true,
      invert: false,
    };

    this.#options = { ...defaults, ...options };

    this.#mouseDownHandler = (e: Event): void => this.#mouseDown(e as MouseEvent);
    this.#mouseMoveHandler = (e: Event): void => this.#mouseMove(e as MouseEvent);
    this.#mouseUpHandler = (e: Event): void => this.#mouseUp(e as MouseEvent);
  }

  public register(context: Hades): void {
    this.#context = context;

    if (this.#options.autoHandleEvents) {
      this.attach();
    }
  }

  public attach(): void {
    if (this.#isTouchDevice) {
      return;
    }

    let node = this.#context?.root;
    if (this.#options.proxyNode) {
      node = this.#options.proxyNode;
    }

    if (typeof node === 'undefined' || node === null) {
      throw new Error('No context or proxyNode specified for DragAndScroll plugin');
    }

    this.#eventNode = node;

    if (this.#eventNode === window) {
      this.#options.changeCursor = false;
    }

    if (this.#options.changeCursor) {
      (this.#eventNode as HTMLElement).style.cursor = 'grab';
    }

    this.#eventNode?.addEventListener('mousedown', this.#mouseDownHandler);
    this.#eventNode?.addEventListener('mousemove', this.#mouseMoveHandler);
    this.#eventNode?.addEventListener('mouseup', this.#mouseUpHandler);
    this.#eventNode?.addEventListener('mouseleave', this.#mouseUpHandler);
  }

  public detach(): void {
    this.#eventNode?.removeEventListener('mousedown', this.#mouseDownHandler);
    this.#eventNode?.removeEventListener('mousemove', this.#mouseMoveHandler);
    this.#eventNode?.removeEventListener('mouseup', this.#mouseUpHandler);
    this.#eventNode?.removeEventListener('mouseleave', this.#mouseUpHandler);
  }

  #mouseDown(event: MouseEvent): void {
    if (this.#isContextPaused) {
      return;
    }

    this.#isDragging = true;
    this.#prevPoint = { x: event.clientX, y: event.clientY };

    if (this.#options.changeCursor) {
      (this.#eventNode as HTMLElement).style.cursor = 'grabbing';
    }
  }

  #mouseMove(event: MouseEvent): void {
    if (this.#isContextPaused) {
      return;
    }

    const point: Vec2 = { x: event.clientX, y: event.clientY };

    if (this.#isDragging && this.#context !== null) {
      // Calculate the delta
      const delta: Vec2 = {
        x: (this.#prevPoint.x - point.x) * this.#options.multiplier,
        y: (this.#prevPoint.y - point.y) * this.#options.multiplier,
      };

      // Clamp the amount using boundaries
      const tempAmount = {
        x: this.#context.internalAmount.x + (!this.#options.invert ? delta.x : delta.y),
        y: this.#context.internalAmount.y + (!this.#options.invert ? delta.y : delta.x),
      };

      // Boundaries for LenisRender and VirtualRender
      if (this.#context && this.#context.getRenderer()) {
        const renderer = this.#context.getRenderer() as LenisRender | VirtualRender;
        tempAmount.x = Math.min(
          Math.max(renderer.boundaries.min.x, tempAmount.x),
          renderer.boundaries.max.x,
        );
        tempAmount.y = Math.min(
          Math.max(renderer.boundaries.min.y, tempAmount.y),
          renderer.boundaries.max.y,
        );
      }

      // Apply the recalculated amount based on boudnaries
      this.#context?.scrollTo(tempAmount, this.#options.smooth ? this.#context.easing.duration : 0);
    }

    this.#prevPoint = point;
  }

  #mouseUp(_event: MouseEvent): void {
    if (this.#isContextPaused) {
      return;
    }

    this.#isDragging = false;

    if (this.#options.changeCursor) {
      (this.#eventNode as HTMLElement).style.cursor = 'grab';
    }
  }

  public play(): void {
    if (this.#options.changeCursor) {
      (this.#eventNode as HTMLElement).style.cursor = 'grab';
    }
  }

  public pause(): void {
    if (this.#options.changeCursor) {
      (this.#eventNode as HTMLElement).style.cursor = 'unset';
    }
  }

  public destroy(): void {
    if (this.#options.autoHandleEvents) {
      this.detach();
    }
  }

  get #isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  get #isContextPaused(): boolean {
    return !this.#context?.running;
  }
}

export default DragAndScroll;
