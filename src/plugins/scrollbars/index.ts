import Hades from '../../';
import VirtualRender from '../virtual-render';
import { HadesPlugin } from '../../declarations';
import style from './style';
import { ScrollbarsOptions, TRACK, Track } from './declarations';

class Scrollbars implements HadesPlugin {
  private options: ScrollbarsOptions;
  private context: Hades | null = null;
  private virtual: VirtualRender | undefined = undefined;
  private wrapper: HTMLElement | null = null;
  private style: string = style;
  private trackX: Track = { wrapper: null, thumb: null, thumbSize: 0, ratio: 0, drag: false, };
  private trackY: Track = { wrapper: null, thumb: null, thumbSize: 0, ratio: 0, drag: false, };

  private drag: Boolean = false;

  private detectPositionHandler: any;
  private dragStartHandler: any;
  private dragEndHandler: any;

  public name: string = 'Scrollbars'

  constructor(options: Partial<ScrollbarsOptions>) {
    const defaults: ScrollbarsOptions = {
      viewport: document.body as HTMLElement,
      tracks: [TRACK.Y],
    };
    this.options = { ...defaults, ...options };

    this.detectPositionHandler = (event: MouseEvent) => this.detectPosition(event);
    this.dragStartHandler = (event: MouseEvent) => this.dragStart(event);
    this.dragEndHandler = (event: MouseEvent) => this.dragEnd(event);
  }

  public register(context: Hades): void {
    this.virtual = (context.getPlugin('VirtualRender') as VirtualRender);

    if (!this.virtual) {
      throw new Error('Cannot initialize scrollbar without Virtual Render Plugin');
    }

    this.context = context;

    this.appendStyle();
    this.appendDom();

    if (!window.matchMedia('(pointer: coarse) and (hover: none)').matches) {
      this.attachEvents();
    }
  };

  private appendDom(): void {
    const scrollbar = document.createElement('div');
    scrollbar.classList.add('scrollbar__wrapper');
    this.options.viewport.append(scrollbar);

    this.options.tracks.forEach((track) => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-scrollbar', `track-${track}`);

      const thumb = document.createElement('div');
      thumb.classList.add('scrollbar__thumb');

      wrapper.append(thumb);
      scrollbar.append(wrapper);

      this.wrapper = scrollbar;

      if (track === 'x') {
        const thumbSize = thumb.getBoundingClientRect().width;

        this.trackX = {
          wrapper,
          thumb,
          thumbSize,
          ratio: 0,
          drag: false,
        };
      }
      if (track === 'y') {
        const thumbSize = thumb.getBoundingClientRect().height;

        this.trackY = {
          wrapper,
          thumb,
          thumbSize,
          ratio: 0,
          drag: false,
        };
      }
    });
  };

  private appendStyle(): void {
    const style = document.createElement('style');
    style.id = 'hades-style';
    style.textContent = this.style;

    if (document.head) document.head.appendChild(style);
  };

  private attachEvents(): void {
    if (this.trackX.wrapper !== null && this.trackX.thumb !== null) {
      this.trackX.wrapper.addEventListener('click', this.detectPositionHandler);
      this.trackX.wrapper.addEventListener('mousedown', this.dragStartHandler);
    }
    if (this.trackY.wrapper !== null && this.trackY.thumb !== null) {
      this.trackY.wrapper.addEventListener('click', this.detectPositionHandler);
      this.trackY.wrapper.addEventListener('mousedown', this.dragStartHandler);
    }
  }

  public render(): void {
    if (this.context && this.virtual && (this.trackX.wrapper !== null && this.trackX.thumb !== null)) {
      const ratio = this.context.amount.x / this.virtual.boundaries.max.x;
      const { width } = this.trackX.wrapper.getBoundingClientRect();

      const translate = (width - this.trackX.thumbSize) * ratio;

      this.trackX.thumb.style.transform = `translate3d(${translate}px, 0px, 0px)`;

      if (ratio === this.trackX.ratio) {
        this.trackX.wrapper.classList.remove('show');
      } else {
        this.trackX.wrapper.classList.add('show');
      }
      this.trackX.ratio = ratio;
    }

    if (this.context && this.virtual && (this.trackY.wrapper !== null && this.trackY.thumb !== null)) {
      const ratio = this.context.amount.y / this.virtual.boundaries.max.y;
      const { height } = this.trackY.wrapper.getBoundingClientRect();

      const translate = (height - this.trackY.thumbSize) * ratio;

      this.trackY.thumb.style.transform = `translate3d(0px, ${translate}px, 0px)`;

      if (ratio === this.trackY.ratio) {
        this.trackY.wrapper.classList.remove('show');
      } else {
        this.trackY.wrapper.classList.add('show');
      }
      this.trackY.ratio = ratio;
    }
  };

  private detectPosition(event: MouseEvent): void {
    const duration = event.type === 'click' ? 400 : 200;

    if (
      this.context && this.virtual && (
        (event.type === 'click' && (<HTMLElement>event.target).dataset.scrollbar === 'track-y')
        || (event.type === 'mousemove' && this.drag && this.trackY.drag)
      )
    ) {
      if (this.trackY.wrapper !== null && this.trackY.thumb !== null) {
        const { height } = this.trackY.wrapper.getBoundingClientRect();

        this.context.scrollTo({
          y: event.clientY / height * this.virtual.boundaries.max.y,
        }, duration);
      }
    }

    if (
      this.context && this.virtual && (
        (event.type === 'click' && (<HTMLElement>event.target).dataset.scrollbar === 'track-x')
        || (event.type === 'mousemove' && this.drag && this.trackX.drag)
      )
    ) {
      if (this.trackX.wrapper !== null && this.trackX.thumb !== null) {
        const { width } = this.trackX.wrapper.getBoundingClientRect();

        this.context.scrollTo({
          x: event.clientX / width * this.virtual.boundaries.max.x,
        }, duration);
      }
    }
  }

  private dragStart(event: MouseEvent): void {
    this.drag = true;

    if (this.trackY.wrapper !== null && this.trackY.thumb !== null) {
      this.trackY.wrapper.classList.add('show');
      this.trackY.drag = (<HTMLElement>(<HTMLElement>event.target).parentNode).dataset.scrollbar === 'track-y';
    }

    if (this.trackX.wrapper !== null && this.trackX.thumb !== null) {
      this.trackX.wrapper.classList.add('show');
      this.trackX.drag = (<HTMLElement>(<HTMLElement>event.target).parentNode).dataset.scrollbar === 'track-x';
    }

    document.body.addEventListener('mousemove', this.detectPositionHandler);
    document.body.addEventListener('mouseup', this.dragEndHandler);

    document.addEventListener('mouseleave', this.dragEndHandler);
    document.body.addEventListener('mouseleave', this.dragEndHandler);
  }

  private dragEnd(event: MouseEvent): void {
    this.drag = false;

    if (this.trackY.wrapper !== null && this.trackY.thumb !== null) {
      this.trackY.wrapper.classList.remove('show');
      this.trackY.drag = false;
    }

    if (this.trackX.wrapper !== null && this.trackX.thumb !== null) {
      this.trackX.wrapper.classList.remove('show');
      this.trackX.drag = false;
    }

    document.body.removeEventListener('mousemove', this.detectPositionHandler);
    document.body.removeEventListener('mouseup', this.dragEndHandler);

    document.removeEventListener('mouseleave', this.dragEndHandler);
    document.body.removeEventListener('mouseleave', this.dragEndHandler);
  }

  public destroy(): void {
    if (this.trackX.wrapper !== null && this.trackX.thumb !== null) {
      this.trackX.wrapper.removeEventListener('click', this.detectPositionHandler);

      this.trackX.wrapper.removeEventListener('mousedown', this.dragStartHandler);
    }
    if (this.trackY.wrapper !== null && this.trackY.thumb !== null) {
      this.trackY.wrapper.removeEventListener('click', this.detectPositionHandler);

      this.trackY.wrapper.removeEventListener('mousedown', this.dragStartHandler);
    }

    document.body.removeEventListener('mousemove', this.detectPositionHandler);
    document.body.removeEventListener('mouseup', this.dragEndHandler);

    document.removeEventListener('mouseleave', this.dragEndHandler);
    document.body.removeEventListener('mouseleave', this.dragEndHandler);

    const style = document.getElementById('hades-style');

    if (!style || !style.parentNode) return;

    style.parentNode.removeChild(style);

    if (this.wrapper !== null) this.wrapper.remove();
  }
}

export default Scrollbars;