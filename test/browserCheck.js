import Hades from '../dist/index.js';
import { VirtualRender, LenisRender, NativeRender, Scrollbars } from '../dist/plugins/index.js';

function engine() {
  const handlers = new Map();
  return {
    start() {},
    add(fn, id) {
      handlers.set(id, fn);
      return id;
    },
    remove(id) {
      handlers.delete(id);
    },
    frame(dt = 16) {
      for (const fn of handlers.values()) {
        fn(dt);
      }
    },
  };
}
function assert(ok, message) {
  if (!ok) {
    throw new Error(message);
  }
}
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
// Native wheel scrolling may be animated by the browser
const settle = () => new Promise((resolve) => setTimeout(resolve, 400));
export async function run() {
  const checks = [];
  document.body.style.margin = '0';
  const content = document.createElement('main');
  content.style.height = '2100px';
  document.body.append(content);
  const clock = engine();
  const h = new Hades({ aion: clock, easing: { duration: 0 } });
  const virtual = new VirtualRender({ scrollNode: content });
  h.registerPlugin(virtual);
  h.scrollTo({ y: 9000 }, 0);
  clock.frame();
  assert(h.amount.y === 1400, 'Virtual scroll escaped real document bounds');
  content.style.height = '900px';
  await nextFrame();
  await nextFrame();
  clock.frame();
  assert(h.amount.y === 200, 'ResizeObserver did not clamp shrinking content');
  h.registerPlugin(new Scrollbars());
  clock.frame();
  const track = document.querySelector('[role=scrollbar]');
  assert(
    document.getElementById(track.getAttribute('aria-controls')) === content,
    'Scrollbar control relationship is invalid',
  );
  track.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
  );
  clock.frame(400);
  assert(h.amount.y === 0, 'Scrollbar Home failed');
  h.destroy();
  assert(content.style.transform === '', 'Virtual transform was not restored');
  assert(!document.querySelector('[role=scrollbar]'), 'Scrollbar UI survived destroy');
  checks.push('virtual bounds, ResizeObserver shrink, keyboard scrollbar, ARIA and teardown');
  content.style.height = '2100px';
  const clock2 = engine();
  const nativeHades = new Hades({ aion: clock2, easing: { duration: 0 } });
  const lenis = new LenisRender();
  nativeHades.registerPlugin(lenis);
  assert(lenis.boundaries.max.y === 1400, 'Native window bounds differ from viewport');
  const scroller = document.createElement('div');
  scroller.style.cssText = 'position:fixed;top:0;width:200px;height:100px;overflow:auto';
  scroller.innerHTML = '<div style="height:500px"><span>nested</span></div>';
  document.body.append(scroller);
  const target = scroller.querySelector('span');
  const wheel = new WheelEvent('wheel', { deltaY: 50, bubbles: true, cancelable: true });
  target.dispatchEvent(wheel);
  assert(!wheel.defaultPrevented, 'Nested scrolling was intercepted');
  scroller.scrollTop = 400;
  const atEnd = new WheelEvent('wheel', { deltaY: 50, bubbles: true, cancelable: true });
  target.dispatchEvent(atEnd);
  assert(atEnd.defaultPrevented, 'Outer scroller did not receive input at inner limit');
  nativeHades.destroy();
  scroller.remove();
  checks.push('native window range and nested scroll boundary');
  const local = document.createElement('div');
  local.style.cssText = 'height:100px;overflow:auto';
  local.innerHTML = '<div style="height:600px"></div>';
  document.body.append(local);
  local.scrollTop = 250;
  const clock3 = engine();
  const passthrough = new Hades({ aion: clock3 });
  const renderer = new NativeRender({ scrollNode: local });
  passthrough.registerPlugin(renderer);
  clock3.frame();
  assert(passthrough.amount.y === 250, 'Existing native position not synchronized');
  passthrough.destroy();
  local.remove();
  checks.push('restored native position');
  window.scrollTo(0, 300);
  const clock4 = engine();
  const paused = new Hades({ aion: clock4, easing: { duration: 0 } });
  paused.registerPlugin(new LenisRender());
  paused.pause();
  await settle();
  assert(window.scrollY === 300, 'Pausing moved the page');
  assert(
    document.documentElement.classList.contains('hades-paused'),
    'Paused root has no hades-paused class',
  );
  await window.realWheel(500, 350, 0, 400);
  await settle();
  assert(window.scrollY === 300, 'Wheel scrolled a paused page');
  paused.scrollTo({ y: 800 }, 0);
  clock4.frame();
  assert(window.scrollY === 800, 'Programmatic scroll did not land while paused');
  paused.play();
  assert(document.documentElement.style.overflowY === '', 'Play did not restore the root overflow');
  const box = document.createElement('div');
  box.style.cssText = 'height:100px;overflow:auto';
  paused.getRenderer().swapScrollNode(box);
  paused.pause();
  assert(box.style.overflowY === 'hidden', 'Element scroll node was not locked');
  paused.play();
  assert(box.style.overflow === 'auto', 'Overflow shorthand was not restored');
  paused.destroy();
  window.scrollTo(0, 0);
  content.remove();
  checks.push('pause lock keeps the position, blocks the wheel and allows programmatic scroll');
  return { checks };
}
