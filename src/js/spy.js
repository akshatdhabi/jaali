// Scroll progress bar and the active link in the top nav.
import { reduced } from './util.js';

/**
 * progress: the <i> inside .j-progress. links: anchors with data-spy="section-id".
 * sections: ids in page order. The first is active until the next crosses 40% of the viewport.
 */
export function scrollSpy({ progress, links = [], sections = [] } = {}) {
  let ticking = false;
  const frame = () => {
    ticking = false;
    const vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    let cur = sections[0];
    for (const id of sections.slice(1)) {
      const s = document.getElementById(id);
      if (s && s.getBoundingClientRect().top < vh * 0.4) cur = id;
    }
    links.forEach((a) => a.classList.toggle('on', a.dataset.spy === cur));
  };
  const on = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  if (!reduced()) { addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); }
  frame();
  return () => { removeEventListener('scroll', on); removeEventListener('resize', on); };
}
