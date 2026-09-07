import { type HadesPlugin, type Vec2 } from '../../types.ts';
import type Hades from '../../index.ts';
import { hasBoundaries, isWindow } from '../../utils.ts';
import { type DragAndScrollOptions } from './types.ts';

class DragAndScroll implements HadesPlugin {
  #context: Hades | null = null;
  #options: DragAndScrollOptions;
  #eventNode: HTMLElement | Window | null = null;
  #pointerDownHandler = (e: Event): void => this.#pointerDown(e as PointerEvent);
  #pointerMoveHandler = (e: Event): void => this.#pointerMove(e as PointerEvent);
  #pointerUpHandler = (e: Event): void => this.#pointerUp(e as PointerEvent);
  // Native image/link dragging would take over the gesture
  #dragStartHandler = (e: Event): void => {
    if (this.#isDragging) {
      e.preventDefault();
    }
  };
  #isDragging = false;
  #userSelect = '';
  #originalCursor = '';
  #pointerId: number | null = null;
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
  }

  public register(context: Hades): void {
    this.#context = context;
    if (this.#options.autoHandleEvents) {
      this.attach();
    }
  }

  public attach(): void {
    const node = this.#options.proxyNode ?? this.#context?.root;
    if (typeof node === 'undefined' || node === null) {
      throw new Error('[Hades] No context or proxyNode specified for DragAndScroll plugin');
    }

    if (this.#eventNode === node) {
      return;
    }
    this.detach();
    this.#eventNode = node;
    if (!isWindow(node)) {
      this.#originalCursor = node.style.cursor;
    }

    if (isWindow(node)) {
      this.#options.changeCursor = false;
    }
    this.#setCursor('grab');

    node.addEventListener('pointerdown', this.#pointerDownHandler);
    node.addEventListener('pointermove', this.#pointerMoveHandler);
    node.addEventListener('pointerup', this.#pointerUpHandler);
    node.addEventListener('pointercancel', this.#pointerUpHandler);
    node.addEventListener('dragstart', this.#dragStartHandler);
  }

  public detach(): void {
    const node = this.#eventNode;
    if (node === null) {
      return;
    }
    node.removeEventListener('pointerdown', this.#pointerDownHandler);
    node.removeEventListener('pointermove', this.#pointerMoveHandler);
    node.removeEventListener('pointerup', this.#pointerUpHandler);
    node.removeEventListener('pointercancel', this.#pointerUpHandler);
    node.removeEventListener('dragstart', this.#dragStartHandler);
    this.#endDrag();
    if (!isWindow(node) && this.#options.changeCursor) {
      node.style.cursor = this.#originalCursor;
    }
    this.#eventNode = null;
  }

  // Text selection is disabled only for the duration of a drag: preventing the
  // pointerdown default would also stop form controls from getting focus
  #startDrag(): void {
    this.#isDragging = true;
    if (this.#eventNode && !isWindow(this.#eventNode)) {
      this.#userSelect = this.#eventNode.style.userSelect;
      this.#eventNode.style.userSelect = 'none';
    }
    this.#setCursor('grabbing');
  }

  #endDrag(): void {
    if (!this.#isDragging) {
      return;
    }
    this.#isDragging = false;
    if (
      this.#pointerId !== null &&
      this.#eventNode &&
      !isWindow(this.#eventNode) &&
      this.#eventNode.hasPointerCapture(this.#pointerId)
    ) {
      this.#eventNode.releasePointerCapture(this.#pointerId);
    }
    this.#pointerId = null;
    if (this.#eventNode && !isWindow(this.#eventNode)) {
      this.#eventNode.style.userSelect = this.#userSelect;
    }
    this.#setCursor('grab');
  }

  #setCursor(cursor: string): void {
    if (this.#options.changeCursor && this.#eventNode && !isWindow(this.#eventNode)) {
      this.#eventNode.style.cursor = cursor;
    }
  }

  // Pointer capture keeps the drag alive when the pointer leaves the node;
  // `window` cannot capture, so there the drag simply ends on pointerup
  #capture(event: PointerEvent, capture: boolean): void {
    const node = this.#eventNode;
    if (node === null || isWindow(node)) {
      return;
    }
    if (capture) {
      node.setPointerCapture(event.pointerId);
    } else if (node.hasPointerCapture(event.pointerId)) {
      node.releasePointerCapture(event.pointerId);
    }
  }

  #pointerDown(event: PointerEvent): void {
    if (this.#isContextPaused || event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }
    this.#pointerId = event.pointerId;
    this.#prevPoint = { x: event.clientX, y: event.clientY };
    this.#capture(event, true);
    this.#startDrag();
  }

  #pointerMove(event: PointerEvent): void {
    if (
      this.#isContextPaused ||
      event.pointerType !== 'mouse' ||
      (this.#isDragging && event.pointerId !== this.#pointerId)
    ) {
      return;
    }
    const point: Vec2 = { x: event.clientX, y: event.clientY };

    if (this.#isDragging && this.#context !== null) {
      const delta: Vec2 = {
        x: (this.#prevPoint.x - point.x) * this.#options.multiplier,
        y: (this.#prevPoint.y - point.y) * this.#options.multiplier,
      };

      const tempAmount = {
        x: this.#context.internalAmount.x + (this.#options.invert ? delta.y : delta.x),
        y: this.#context.internalAmount.y + (this.#options.invert ? delta.x : delta.y),
      };

      // NativeRender has no boundaries to clamp against
      const renderer = this.#context.getRenderer();
      if (hasBoundaries(renderer)) {
        const { boundaries } = renderer;
        tempAmount.x = Math.min(Math.max(boundaries.min.x, tempAmount.x), boundaries.max.x);
        tempAmount.y = Math.min(Math.max(boundaries.min.y, tempAmount.y), boundaries.max.y);
      }
      this.#context.scrollTo(tempAmount, this.#options.smooth ? this.#context.easing.duration : 0);
    }
    this.#prevPoint = point;
  }

  #pointerUp(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || !this.#isDragging || event.pointerId !== this.#pointerId) {
      return;
    }
    this.#capture(event, false);
    this.#endDrag();
  }

  public play(): void {
    this.#setCursor('grab');
  }

  public pause(): void {
    this.#endDrag();
    this.#setCursor('unset');
  }

  public destroy(): void {
    // Always detach: removeEventListener is a no-op when nothing was attached,
    // and skipping it leaked listeners when attach() was called manually.
    this.detach();
    this.#context = null;
  }

  get #isContextPaused(): boolean {
    return !this.#context?.running;
  }
}

export default DragAndScroll;
