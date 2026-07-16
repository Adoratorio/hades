export const isScrollableElement = (node: HTMLElement): boolean => {
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
};
