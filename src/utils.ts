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
