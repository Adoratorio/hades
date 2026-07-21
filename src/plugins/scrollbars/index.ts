import { type HadesPlugin } from '../../types.ts';
import type Hades from '../../index.ts';
import type VirtualRender from '../virtual-render/index.ts';
import { TRACK, type ScrollbarsOptions, type Track } from './types.ts';
import style from './style.ts';

class Scrollbars implements HadesPlugin {
  #options: ScrollbarsOptions;
  #context: Hades | null = null;
  #virtual: VirtualRender | undefined = undefined;
  #wrapper: HTMLElement | null = null;
  #style: string = style;
  #styleElement: HTMLStyleElement | null = null;
  #trackX: Track = { wrapper: null, thumb: null, thumbSize: 0, ratio: 0, drag: false };
  #trackY: Track = { wrapper: null, thumb: null, thumbSize: 0, ratio: 0, drag: false };

  // Cache dimensions to avoid layout thrashing
  #cachedWidth = 0;
  #cachedHeight = 0;
  #resizeObserver: ResizeObserver | null = null;

  #drag = false;
  #detectPositionHandler: (event: MouseEvent) => void;
  #dragStartHandler: (event: MouseEvent) => void;
  #dragEndHandler: (event: MouseEvent) => void;

  public name = 'Scrollbars';

  constructor(options: Partial<ScrollbarsOptions> = {}) {
    const defaults: ScrollbarsOptions = {
      viewport:
        typeof document !== 'undefined' ? (document.body as HTMLElement) : ({} as HTMLElement),
      tracks: [TRACK.Y],
    };
    this.#options = { ...defaults, ...options };

    this.#detectPositionHandler = (event: MouseEvent): void => this.#detectPosition(event);
    this.#dragStartHandler = (event: MouseEvent): void => this.#dragStart(event);
    this.#dragEndHandler = (event: MouseEvent): void => this.#dragEnd(event);
  }

  public register(context: Hades): void {
    this.#virtual = context.getPlugin('VirtualRender') as VirtualRender;
    if (!this.#virtual) {
      throw new Error('[Hades] Cannot initialize scrollbar without Virtual Render Plugin');
    }
    this.#context = context;

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.#appendStyle();
      this.#appendDom();

      // Initialize the ResizeObserver to refresh the cached dimensions
      if (typeof ResizeObserver !== 'undefined' && this.#wrapper) {
        this.#resizeObserver = new ResizeObserver(() => this.#updateCachedDimensions());
        this.#resizeObserver.observe(this.#options.viewport);
      }
      this.#updateCachedDimensions();

      if (!window.matchMedia('(pointer: coarse) and (hover: none)').matches) {
        this.#attachEvents();
      }
    }
  }

  #updateCachedDimensions(): void {
    if (this.#trackX.wrapper) {
      this.#cachedWidth = this.#trackX.wrapper.getBoundingClientRect().width;
    }
    if (this.#trackY.wrapper) {
      this.#cachedHeight = this.#trackY.wrapper.getBoundingClientRect().height;
    }
  }

  #appendDom(): void {
    const scrollbar = document.createElement('div');
    scrollbar.classList.add('scrollbar__wrapper');
    this.#options.viewport.append(scrollbar);

    this.#options.tracks.forEach((track) => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-scrollbar', `track-${track}`);
      const thumb = document.createElement('div');
      thumb.classList.add('scrollbar__thumb');
      wrapper.append(thumb);
      scrollbar.append(wrapper);

      this.#wrapper = scrollbar;

      if (track === 'x') {
        const thumbSize = thumb.getBoundingClientRect().width;
        this.#trackX = { wrapper, thumb, thumbSize, ratio: 0, drag: false };
      }
      if (track === 'y') {
        const thumbSize = thumb.getBoundingClientRect().height;
        this.#trackY = { wrapper, thumb, thumbSize, ratio: 0, drag: false };
      }
    });
  }

  #appendStyle(): void {
    const styleElement = document.createElement('style');
    styleElement.textContent = this.#style;
    if (document.head) {
      document.head.appendChild(styleElement);
      this.#styleElement = styleElement;
    }
  }

  #attachEvents(): void {
    if (this.#trackX.wrapper !== null && this.#trackX.thumb !== null) {
      this.#trackX.wrapper.addEventListener('click', this.#detectPositionHandler);
      this.#trackX.wrapper.addEventListener('mousedown', this.#dragStartHandler);
    }
    if (this.#trackY.wrapper !== null && this.#trackY.thumb !== null) {
      this.#trackY.wrapper.addEventListener('click', this.#detectPositionHandler);
      this.#trackY.wrapper.addEventListener('mousedown', this.#dragStartHandler);
    }
  }

  public render(): void {
    // Use the cached dimensions instead of calling getBoundingClientRect() every frame
    if (
      this.#context &&
      this.#virtual &&
      this.#trackX.wrapper !== null &&
      this.#trackX.thumb !== null
    ) {
      const maxX = this.#virtual.boundaries.max.x;
      const ratio = maxX > 0 ? this.#context.amount.x / maxX : 0;
      const translate = (this.#cachedWidth - this.#trackX.thumbSize) * ratio;
      this.#trackX.thumb.style.transform = `translate3d(${translate}px, 0px, 0px)`;
      this.#trackX.wrapper.classList.toggle('show', ratio !== this.#trackX.ratio);
      this.#trackX.ratio = ratio;
    }
    if (
      this.#context &&
      this.#virtual &&
      this.#trackY.wrapper !== null &&
      this.#trackY.thumb !== null
    ) {
      const maxY = this.#virtual.boundaries.max.y;
      const ratio = maxY > 0 ? this.#context.amount.y / maxY : 0;
      const translate = (this.#cachedHeight - this.#trackY.thumbSize) * ratio;
      this.#trackY.thumb.style.transform = `translate3d(0px, ${translate}px, 0px)`;
      this.#trackY.wrapper.classList.toggle('show', ratio !== this.#trackY.ratio);
      this.#trackY.ratio = ratio;
    }
  }

  #detectPosition(event: MouseEvent): void {
    const duration = event.type === 'click' ? 400 : 200;
    if (
      this.#context &&
      this.#virtual &&
      ((event.type === 'click' && (event.target as HTMLElement).dataset.scrollbar === 'track-y') ||
        (event.type === 'mousemove' && this.#drag && this.#trackY.drag))
    ) {
      if (this.#trackY.wrapper !== null && this.#trackY.thumb !== null && this.#cachedHeight > 0) {
        this.#context.scrollTo(
          { y: (event.clientY / this.#cachedHeight) * this.#virtual.boundaries.max.y },
          duration,
        );
      }
    }
    if (
      this.#context &&
      this.#virtual &&
      ((event.type === 'click' && (event.target as HTMLElement).dataset.scrollbar === 'track-x') ||
        (event.type === 'mousemove' && this.#drag && this.#trackX.drag))
    ) {
      if (this.#trackX.wrapper !== null && this.#trackX.thumb !== null && this.#cachedWidth > 0) {
        this.#context.scrollTo(
          { x: (event.clientX / this.#cachedWidth) * this.#virtual.boundaries.max.x },
          duration,
        );
      }
    }
  }

  #dragStart(event: MouseEvent): void {
    this.#drag = true;
    if (this.#trackY.wrapper !== null && this.#trackY.thumb !== null) {
      this.#trackY.wrapper.classList.add('show');
      this.#trackY.drag =
        ((event.target as HTMLElement).parentNode as HTMLElement).dataset.scrollbar === 'track-y';
    }
    if (this.#trackX.wrapper !== null && this.#trackX.thumb !== null) {
      this.#trackX.wrapper.classList.add('show');
      this.#trackX.drag =
        ((event.target as HTMLElement).parentNode as HTMLElement).dataset.scrollbar === 'track-x';
    }
    document.body.addEventListener('mousemove', this.#detectPositionHandler);
    document.body.addEventListener('mouseup', this.#dragEndHandler);
    document.addEventListener('mouseleave', this.#dragEndHandler);
    document.body.addEventListener('mouseleave', this.#dragEndHandler);
  }

  #dragEnd(_event: MouseEvent): void {
    this.#drag = false;
    if (this.#trackY.wrapper !== null && this.#trackY.thumb !== null) {
      this.#trackY.wrapper.classList.remove('show');
      this.#trackY.drag = false;
    }
    if (this.#trackX.wrapper !== null && this.#trackX.thumb !== null) {
      this.#trackX.wrapper.classList.remove('show');
      this.#trackX.drag = false;
    }
    document.body.removeEventListener('mousemove', this.#detectPositionHandler);
    document.body.removeEventListener('mouseup', this.#dragEndHandler);
    document.removeEventListener('mouseleave', this.#dragEndHandler);
    document.body.removeEventListener('mouseleave', this.#dragEndHandler);
  }

  public destroy(): void {
    if (this.#resizeObserver !== null) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }
    if (typeof document !== 'undefined') {
      if (this.#trackX.wrapper !== null && this.#trackX.thumb !== null) {
        this.#trackX.wrapper.removeEventListener('click', this.#detectPositionHandler);
        this.#trackX.wrapper.removeEventListener('mousedown', this.#dragStartHandler);
      }
      if (this.#trackY.wrapper !== null && this.#trackY.thumb !== null) {
        this.#trackY.wrapper.removeEventListener('click', this.#detectPositionHandler);
        this.#trackY.wrapper.removeEventListener('mousedown', this.#dragStartHandler);
      }
      document.body.removeEventListener('mousemove', this.#detectPositionHandler);
      document.body.removeEventListener('mouseup', this.#dragEndHandler);
      document.removeEventListener('mouseleave', this.#dragEndHandler);
      document.body.removeEventListener('mouseleave', this.#dragEndHandler);

      if (this.#styleElement !== null) {
        this.#styleElement.remove();
        this.#styleElement = null;
      }
      if (this.#wrapper !== null) {
        this.#wrapper.remove();
      }
    }
  }
}

export default Scrollbars;
