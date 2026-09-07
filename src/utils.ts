import { type BoundedRenderer, type HadesPlugin, type Vec2 } from './types.ts';

export function isWindow(node: HTMLElement | Window): node is Window {
  return typeof Window !== 'undefined' && node instanceof Window;
}

export function getScrollPosition(node: HTMLElement | Window): Vec2 {
  if (isWindow(node)) {
    return { x: node.scrollX, y: node.scrollY };
  }
  return { x: node.scrollLeft, y: node.scrollTop };
}

export function hasBoundaries(plugin: HadesPlugin | undefined): plugin is BoundedRenderer {
  return plugin !== undefined && 'boundaries' in plugin;
}

export function isScrollableElement(node: HTMLElement): boolean {
  const p = node.parentElement;
  if (p === null) {
    return false;
  }
  const style = window.getComputedStyle(p);
  return (
    (p.scrollHeight > p.clientHeight || p.scrollWidth > p.clientWidth) &&
    (style.overflow === 'auto' ||
      style.overflow === 'scroll' ||
      style.overflowX === 'auto' ||
      style.overflowY === 'auto' ||
      style.overflowX === 'scroll' ||
      style.overflowY === 'scroll')
  );
}

const scrolls = (overflow: string, amount: number, position: number, max: number): boolean =>
  (overflow === 'auto' || overflow === 'scroll') &&
  ((amount < 0 && position > 0) || (amount > 0 && position < max - 1));

// Find an inner scroller that can consume this input before the root does.
export function canScrollWithin(event: Event, root: HTMLElement | Window, delta: Vec2): boolean {
  const path = event.composedPath();
  const nodes: EventTarget[] = path.length ? path : [];
  if (nodes.length === 0) {
    let node = event.target as Element | null;
    while (node) {
      nodes.push(node);
      node = node.parentElement;
    }
  }
  for (const target of nodes) {
    if (target === root || target === document.body || target === document.documentElement) {
      break;
    }
    if (!(target instanceof HTMLElement)) {
      // oxlint-disable-next-line no-continue -- event paths also contain non-element targets
      continue;
    }
    const style = window.getComputedStyle(target);

    if (
      scrolls(
        style.overflowX || style.overflow,
        delta.x,
        target.scrollLeft,
        target.scrollWidth - target.clientWidth,
      ) ||
      scrolls(
        style.overflowY || style.overflow,
        delta.y,
        target.scrollTop,
        target.scrollHeight - target.clientHeight,
      )
    ) {
      return true;
    }
  }
  return false;
}

export function defaultWindow(): Window {
  if (typeof window === 'undefined') {
    throw new Error('[Hades] Create browser plugins in a client-only lifecycle hook');
  }
  return window;
}

export function defaultBody(): HTMLElement {
  if (typeof document === 'undefined' || !document.body) {
    throw new Error('[Hades] Document body is not available yet');
  }
  return document.body;
}

export function defaultViewport(): HTMLElement {
  if (typeof document === 'undefined') {
    throw new Error('[Hades] Create browser plugins in a client-only lifecycle hook');
  }
  return document.documentElement;
}
