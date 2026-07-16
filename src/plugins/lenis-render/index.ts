import Boundaries from '../../Boundaries.ts';
import { type HadesPlugin, type HermesEvent } from '../../types.ts';
import type Hades from '../../index.ts';
import { isScrollableElement } from '../../utils.ts';
import { type LenisRenderOptions } from './types.ts';

class LenisRender implements HadesPlugin {
  #context: Hades | null = null;
  #options: LenisRenderOptions;
  #nativeScrollHandler: (event: Event) => void;
  #isValidEvent = false;
  #interval: number | null = null;

  public name = 'LenisRender';

  constructor(options: Partial<LenisRenderOptions>) {
    const defaults: LenisRenderOptions = {
      scrollNode: window,
      renderScroll: true,
    };
    this.#options = { ...defaults, ...options };
    this.#nativeScrollHandler = (e: Event): void => this.#nativeScroll(e);

    if (typeof this.#options.scrollNode === 'undefined') {
      throw new Error('Invalid Scroll Node for Lenis Renderer');
    }

    this.#options.scrollNode.addEventListener('scroll', this.#nativeScrollHandler);
  }

  public register(context: Hades): void {
    this.#context = context;
  }

  public wheel(_context: Hades, event: HermesEvent): boolean {
    // If the node of the event is not the direct child of scrollNode and is a scrollable node
    // need to prevent the lenis scroll to trigger
    if (
      (event.originalEvent.target as HTMLElement).parentNode !== this.#options.scrollNode &&
      isScrollableElement(event.originalEvent.target as HTMLElement)
    ) {
      return true;
    }

    // The published hermes typings still declare `type` as an enum, compare as string
    if ((event.type as string) === 'wheel') {
      event.originalEvent.preventDefault();
      this.#isValidEvent = true;
    } else {
      this.#isValidEvent = false;
    }

    return false;
  }

  public render(context: Hades): void {
    if (this.#options.renderScroll && this.#isValidEvent) {
      this.#options.scrollNode.scrollTo(context.amount.x, context.amount.y);
    }
  }

  public scroll(context: Hades, _event: HermesEvent): void {
    // Clamp the external temp  to be inside the boundaries if not infinite scrolling
    const isWindow = this.#options.scrollNode === window;
    const node = isWindow ? document.body : (this.#options.scrollNode as HTMLElement);
    const bound = {
      x: node.scrollWidth - (isWindow ? window.innerWidth : node.clientWidth),
      y: node.scrollHeight - (isWindow ? window.innerHeight : node.clientHeight),
    };

    context.internalTemp = {
      x: Math.min(Math.max(context.internalTemp.x, 0), bound.x),
      y: Math.min(Math.max(context.internalTemp.y, 0), bound.y),
    };
  }

  #nativeScroll(_event: Event): void {
    if (this.#context && !this.#isValidEvent) {
      const isWindow = this.#options.scrollNode === window;
      this.#context.scrollTo(
        {
          x: isWindow ? window.scrollX : (this.#options.scrollNode as HTMLElement).scrollLeft,
          y: isWindow ? window.scrollY : (this.#options.scrollNode as HTMLElement).scrollTop,
        },
        0,
        true,
      );
    }

    // Temporary (?) fix for native scrollbar click
    if (window) {
      if (this.#interval) {
        window.clearTimeout(this.#interval);
      }
      this.#interval = window.setTimeout(() => {
        this.#isValidEvent = false;
      }, 100);
    }
  }

  public scrollTo(): void {
    this.#isValidEvent = true; // Force the scroll render on mobile
  }

  public destroy(): void {
    if (this.#interval) {
      window.clearTimeout(this.#interval);
    }
    this.#options.scrollNode.removeEventListener('scroll', this.#nativeScrollHandler);
  }

  public startRender(): void {
    this.#options.renderScroll = true;
  }

  public stopRender(): void {
    this.#options.renderScroll = false;
  }

  public swapScrollNode(node: HTMLElement | Window): void {
    node.addEventListener('scroll', this.#nativeScrollHandler);
    this.#options.scrollNode.removeEventListener('scroll', this.#nativeScrollHandler);
    this.#options.scrollNode = node;
  }

  public get boundaries(): Boundaries {
    if (this.#options.scrollNode instanceof Window) {
      return new Boundaries(
        0,
        document.body.scrollWidth - document.body.clientWidth,
        0,
        document.body.scrollHeight - document.body.clientHeight,
      );
    }
    return new Boundaries(
      0,
      (this.#options.scrollNode as HTMLElement).scrollWidth -
        (this.#options.scrollNode as HTMLElement).clientWidth,
      0,
      (this.#options.scrollNode as HTMLElement).scrollHeight -
        (this.#options.scrollNode as HTMLElement).clientHeight,
    );
  }
}

export default LenisRender;
