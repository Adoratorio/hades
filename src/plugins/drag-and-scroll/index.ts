import Hades from "../..";
import { HadesPlugin, Vec2 } from "../../declarations";
import LenisRender from "../lenis-render";
import VirtualRender from "../virtual-render";
import { DragAndScrollOptions } from "./declarations";

class DragAndScroll implements HadesPlugin {
  private context: Hades | null = null;
  private options: DragAndScrollOptions;
  private eventNode: HTMLElement | Window | null = null;
  private mouseDownHandler: EventListenerOrEventListenerObject;
  private mouseMoveHandler: EventListenerOrEventListenerObject;
  private mouseUpHandler: EventListenerOrEventListenerObject;
  private isDragging: Boolean = false;
  private prevPoint: Vec2 = { x: 0, y: 0 };

  public name: string = 'DragAndScroll';

  constructor(options: Partial<DragAndScrollOptions>) {
    const defaults: DragAndScrollOptions = {
      proxyNode: null,
      changeCursor: false,
      multiplier: 1,
      autoHandleEvents: true,
      smooth: true,
      invert: false,
    }

    this.options = { ...defaults, ...options };

    this.mouseDownHandler = (e: MouseEventInit) => this.mouseDown(e);
    this.mouseMoveHandler = (e: MouseEventInit) => this.mouseMove(e);
    this.mouseUpHandler = (e: MouseEventInit) => this.mouseUp(e);
  }

  public register(context: Hades): void {
    this.context = context;

    if (this.options.autoHandleEvents) this.attach();
  }

  public attach() {
    if (this.isTouchDevice) return;

    let node = this.context?.root;
    if (this.options.proxyNode) node = this.options.proxyNode;

    if (typeof node === 'undefined' || node === null) {
      throw new Error('No context or proxyNode specified for DragAndScroll plugin');
    } 
    
    this.eventNode = node;

    if (this.eventNode === window) this.options.changeCursor = false;

    if (this.options.changeCursor) (this.eventNode as HTMLElement).style.cursor = 'grab';

    this.eventNode?.addEventListener('mousedown', this.mouseDownHandler);
    this.eventNode?.addEventListener('mousemove', this.mouseMoveHandler);
    this.eventNode?.addEventListener('mouseup', this.mouseUpHandler);
    this.eventNode?.addEventListener('mouseleave', this.mouseUpHandler);
  }

  public detach() {
    this.eventNode?.removeEventListener('mousedown', this.mouseDownHandler);
    this.eventNode?.removeEventListener('mousemove', this.mouseMoveHandler);
    this.eventNode?.removeEventListener('mouseup', this.mouseUpHandler);
    this.eventNode?.removeEventListener('mouseleave', this.mouseUpHandler);
  }

  private mouseDown(event: MouseEventInit): void {
    this.isDragging = true;
    this.prevPoint = { x: event.clientX as number, y: event.clientY as number };

    if (this.options.changeCursor) (this.eventNode as HTMLElement).style.cursor = 'grabbing';
  }

  private mouseMove(event: MouseEventInit): void {
    const point: Vec2 = { x: event.clientX as number, y: event.clientY as number };
    
    if (this.isDragging && this.context !== null) {
      // Calculate the delta
      const delta: Vec2 = {
        x: (this.prevPoint.x - point.x) * this.options.multiplier,
        y: (this.prevPoint.y - point.y) * this.options.multiplier,
      };

      // Clamp the amount using boundaries
      let tempAmount = {
        x: this.context.internalAmount.x + (!this.options.invert ? delta.x : delta.y),
        y: this.context.internalAmount.y + (!this.options.invert ? delta.y : delta.x),
      };

      // Boundaries for LenisRender and VirtualRender
      if (this.context && this.context.getRenderer()) {
        const renderer = this.context.getRenderer() as (LenisRender | VirtualRender);
        tempAmount.x = Math.min(Math.max(renderer.boundaries.min.x, tempAmount.x), renderer.boundaries.max.x);
        tempAmount.y = Math.min(Math.max(renderer.boundaries.min.y, tempAmount.y), renderer.boundaries.max.y);
      }

      // Apply the recalculated amount based on boudnaries
      this.context?.scrollTo(tempAmount, this.options.smooth ? this.context.easing.duration : 0);
    }

    this.prevPoint = point;
  }

  private mouseUp(event: MouseEventInit): void {
    this.isDragging = false;

    if (this.options.changeCursor) (this.eventNode as HTMLElement).style.cursor = 'grab';
  }

  public destroy(): void {
    if (this.options.autoHandleEvents) this.detach();
  }

  private get isTouchDevice(): Boolean {
    return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
  }
}

export default DragAndScroll;
