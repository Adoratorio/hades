import { defaultViewport, hasBoundaries } from '../../utils.ts';
import { type BoundedRenderer, type HadesPlugin } from '../../types.ts';
import type Hades from '../../index.ts';
import { TRACK, type ScrollbarsOptions, type Track } from './types.ts';
import style from './style.ts';

const CLICK_DURATION = 400;
const DRAG_DURATION = 200;

let controlId = 0;

class Scrollbars implements HadesPlugin {
  #controlledNode: HTMLElement | null = null;
  #generatedControlId: string | null = null;
  #options: ScrollbarsOptions;
  #context: Hades | null = null;
  #renderer: BoundedRenderer | null = null;
  #wrapper: HTMLElement | null = null;
  #styleElement: HTMLStyleElement | null = null;
  #tracks: Track[] = [];
  #dragging: Track | null = null;
  #resizeObserver: ResizeObserver | null = null;

  #pointerDown = (event: Event): void => this.#onPointerDown(event as PointerEvent);
  #pointerMove = (event: Event): void => this.#onPointerMove(event as PointerEvent);
  #pointerUp = (event: Event): void => this.#onPointerUp(event as PointerEvent);
  #keydown = (event: Event): void => this.#onKeyDown(event as KeyboardEvent);
  #measure = (): void => this.#updateDimensions();

  public name = 'Scrollbars';

  constructor(options: Partial<ScrollbarsOptions> = {}) {
    const defaults: ScrollbarsOptions = {
      // The document element is never transformed by the renderers, so the
      // fixed wrapper stays in place (unlike `document.body` when it is the
      // VirtualRender scroll node)
      viewport: options.viewport ?? defaultViewport(),
      tracks: [TRACK.Y],
      minThumbSize: 24,
    };
    this.#options = { ...defaults, ...options };
  }

  public register(context: Hades): void {
    const renderer = context.getRenderer();
    if (!hasBoundaries(renderer)) {
      throw new Error(
        '[Hades] Scrollbars needs a renderer exposing boundaries (VirtualRender or LenisRender) registered first',
      );
    }
    this.#renderer = renderer;
    this.#context = context;

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const { scrollNode } = renderer as { scrollNode?: unknown };
    if (scrollNode instanceof HTMLElement && scrollNode.contains(this.#options.viewport)) {
      throw new Error(
        '[Hades] Scrollbars viewport must not be inside the renderer scroll node: the transform would move the scrollbars with the content',
      );
    }

    const controlled = scrollNode instanceof HTMLElement ? scrollNode : document.documentElement;
    if (!controlled.id) {
      let id: string;
      do {
        id = `hades-scroll-content-${++controlId}`;
      } while (document.getElementById(id));
      controlled.id = id;
      this.#generatedControlId = id;
    }
    this.#controlledNode = controlled;
    this.#appendStyle();
    this.#appendDom();

    if (typeof ResizeObserver !== 'undefined' && this.#wrapper) {
      this.#resizeObserver = new ResizeObserver(this.#measure);
      this.#resizeObserver.observe(this.#wrapper);
    }
    window.addEventListener('resize', this.#measure, { passive: true });
    this.#updateDimensions();

    if (!window.matchMedia('(pointer: coarse) and (hover: none)').matches) {
      this.#attachEvents();
    }
  }

  #updateDimensions(): void {
    for (const track of this.#tracks) {
      const rect = track.wrapper.getBoundingClientRect();
      track.length = track.axis === TRACK.X ? rect.width : rect.height;
      // Force the thumb to be sized again on the next render
      track.max = -1;
      delete track.translation;
    }
  }

  #appendDom(): void {
    const wrapper = document.createElement('div');
    wrapper.classList.add('scrollbar__wrapper');
    this.#options.viewport.append(wrapper);
    this.#wrapper = wrapper;

    this.#tracks = this.#options.tracks.map((axis) => {
      const trackWrapper = document.createElement('div');
      trackWrapper.setAttribute('data-scrollbar', `track-${axis}`);
      trackWrapper.setAttribute('role', 'scrollbar');
      if (this.#controlledNode) {
        trackWrapper.setAttribute('aria-controls', this.#controlledNode.id);
      }
      trackWrapper.setAttribute(
        'aria-label',
        axis === TRACK.X ? 'Horizontal scroll' : 'Vertical scroll',
      );
      trackWrapper.setAttribute('aria-orientation', axis === TRACK.X ? 'horizontal' : 'vertical');
      trackWrapper.setAttribute('aria-valuemin', '0');
      trackWrapper.setAttribute('aria-valuemax', '0');
      trackWrapper.setAttribute('aria-valuenow', '0');
      trackWrapper.tabIndex = 0;
      const thumb = document.createElement('div');
      thumb.classList.add('scrollbar__thumb');
      trackWrapper.append(thumb);
      wrapper.append(trackWrapper);
      return {
        axis,
        wrapper: trackWrapper,
        thumb,
        length: 0,
        thumbSize: 0,
        max: -1,
        ratio: 0,
        shown: false,
      };
    });
  }

  #appendStyle(): void {
    const styleElement = document.createElement('style');
    styleElement.textContent = style;
    document.head.appendChild(styleElement);
    this.#styleElement = styleElement;
  }

  #attachEvents(): void {
    for (const track of this.#tracks) {
      track.wrapper.addEventListener('keydown', this.#keydown);
      track.wrapper.addEventListener('pointerdown', this.#pointerDown);
      track.wrapper.addEventListener('pointermove', this.#pointerMove);
      track.wrapper.addEventListener('pointerup', this.#pointerUp);
      track.wrapper.addEventListener('pointercancel', this.#pointerUp);
    }
  }

  #detachEvents(): void {
    for (const track of this.#tracks) {
      track.wrapper.removeEventListener('keydown', this.#keydown);
      track.wrapper.removeEventListener('pointerdown', this.#pointerDown);
      track.wrapper.removeEventListener('pointermove', this.#pointerMove);
      track.wrapper.removeEventListener('pointerup', this.#pointerUp);
      track.wrapper.removeEventListener('pointercancel', this.#pointerUp);
    }
  }

  // Thumb length proportional to the visible fraction of the content
  #sizeThumb(track: Track, max: number): void {
    if (track.max === max) {
      return;
    }
    track.max = max;
    track.wrapper.setAttribute('aria-valuemax', String(max));
    track.wrapper.tabIndex = max > 0 ? 0 : -1;
    const content = track.length + max;
    const size = content > 0 ? (track.length * track.length) / content : track.length;
    track.thumbSize = Math.min(track.length, Math.max(this.#options.minThumbSize, size));
    if (track.axis === TRACK.X) {
      track.thumb.style.width = `${track.thumbSize}px`;
    } else {
      track.thumb.style.height = `${track.thumbSize}px`;
    }
  }

  public render(): void {
    if (!this.#context || !this.#renderer) {
      return;
    }
    const { amount } = this.#context;
    const { min, max } = this.#renderer.boundaries;

    for (const track of this.#tracks) {
      const isX = track.axis === TRACK.X;
      const axisMin = isX ? min.x : min.y;
      const axisMax = (isX ? max.x : max.y) - axisMin;
      this.#sizeThumb(track, axisMax);

      const ratio =
        axisMax > 0
          ? Math.min(1, Math.max(0, ((isX ? amount.x : amount.y) - axisMin) / axisMax))
          : 0;
      const translate = (track.length - track.thumbSize) * ratio;
      if (translate !== track.translation) {
        track.thumb.style.transform = isX
          ? `translate3d(${translate}px, 0px, 0px)`
          : `translate3d(0px, ${translate}px, 0px)`;
        if (ratio !== track.ratio) {
          this.#show(track, true);
        }
        track.ratio = ratio;
        track.translation = translate;
        track.wrapper.setAttribute(
          'aria-valuenow',
          String(Math.round((isX ? amount.x : amount.y) - axisMin)),
        );
      }
    }
  }

  public preFrame(): void {
    // Hide the tracks again once the scroll has settled (dragging keeps them visible)
    if (this.#context?.still && this.#dragging === null) {
      for (const track of this.#tracks) {
        this.#show(track, false);
      }
    }
  }

  #show(track: Track, shown: boolean): void {
    if (track.shown === shown) {
      return;
    }
    track.shown = shown;
    track.wrapper.classList.toggle('show', shown);
  }

  #trackFromEvent(event: PointerEvent): Track | undefined {
    return this.#tracks.find((track) => track.wrapper === event.currentTarget);
  }

  // Scroll so that the thumb is centred on the pointer position along the track
  #scrollToPointer(track: Track, event: PointerEvent, duration: number): void {
    if (!this.#context || !this.#renderer || track.length <= track.thumbSize) {
      return;
    }
    const isX = track.axis === TRACK.X;
    const rect = track.wrapper.getBoundingClientRect();
    const position =
      (isX ? event.clientX - rect.left : event.clientY - rect.top) - track.thumbSize / 2;
    const ratio = Math.min(1, Math.max(0, position / (track.length - track.thumbSize)));
    const { min, max } = this.#renderer.boundaries;
    this.#context.scrollTo(
      isX ? { x: min.x + ratio * (max.x - min.x) } : { y: min.y + ratio * (max.y - min.y) },
      duration,
    );
  }

  #onKeyDown(event: KeyboardEvent): void {
    if (
      !this.#context ||
      !this.#renderer ||
      !this.#context.running ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }
    const track = this.#tracks.find((item) => item.wrapper === event.currentTarget);
    if (!track) {
      return;
    }
    const isX = track.axis === TRACK.X;
    const { min, max } = this.#renderer.boundaries;
    const current = isX ? this.#context.amount.x : this.#context.amount.y;
    const steps: Record<string, number> = {
      PageUp: -track.length,
      PageDown: track.length,
      [isX ? 'ArrowLeft' : 'ArrowUp']: -40,
      [isX ? 'ArrowRight' : 'ArrowDown']: 40,
    };
    let target: number;
    if (event.key === 'Home') {
      target = isX ? min.x : min.y;
    } else if (event.key === 'End') {
      target = isX ? max.x : max.y;
    } else {
      const step = steps[event.key];
      if (step === undefined) {
        return;
      }
      target = current + step;
    }
    event.preventDefault();
    event.stopPropagation();
    target = Math.min(Math.max(target, isX ? min.x : min.y), isX ? max.x : max.y);
    this.#context.scrollTo(isX ? { x: target } : { y: target }, CLICK_DURATION);
  }

  #onPointerDown(event: PointerEvent): void {
    const track = this.#trackFromEvent(event);
    if (!track || event.button !== 0 || !this.#context?.running) {
      return;
    }
    event.preventDefault();
    this.#dragging = track;
    track.wrapper.setPointerCapture(event.pointerId);
    this.#show(track, true);
    // Pressing on the track (not on the thumb) jumps there first
    if (event.target !== track.thumb) {
      this.#scrollToPointer(track, event, CLICK_DURATION);
    }
  }

  #onPointerMove(event: PointerEvent): void {
    const track = this.#trackFromEvent(event);
    if (!track || this.#dragging !== track) {
      return;
    }
    this.#scrollToPointer(track, event, DRAG_DURATION);
  }

  #onPointerUp(event: PointerEvent): void {
    const track = this.#trackFromEvent(event);
    if (!track || this.#dragging !== track) {
      return;
    }
    this.#dragging = null;
    if (track.wrapper.hasPointerCapture(event.pointerId)) {
      track.wrapper.releasePointerCapture(event.pointerId);
    }
  }

  public destroy(): void {
    if (
      this.#controlledNode &&
      this.#generatedControlId &&
      this.#controlledNode.id === this.#generatedControlId
    ) {
      this.#controlledNode.removeAttribute('id');
    }
    this.#controlledNode = null;
    this.#generatedControlId = null;
    if (this.#resizeObserver !== null) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.#measure);
    }
    this.#detachEvents();
    this.#styleElement?.remove();
    this.#styleElement = null;
    this.#wrapper?.remove();
    this.#wrapper = null;
    this.#tracks = [];
    this.#dragging = null;
    this.#context = null;
    this.#renderer = null;
  }
}

export default Scrollbars;
