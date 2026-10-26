// Range with a gate marker. The thumb and fill follow the value; below the gate the fill turns accent.
import { $ } from './util.js';

/**
 * <div class="j-range" style="--gate:80"> <input type="range"> <span class="tr"></span>
 *   <span class="fl"></span><span class="gate"></span><span class="gl">gate 80%</span><span class="th"></span></div>
 */
export function range(box, onInput = () => {}) {
  const input = $('input', box);
  const gate = parseFloat(getComputedStyle(box).getPropertyValue('--gate')) || 80;
  const paint = () => {
    const v = +input.value;
    const pct = ((v - +input.min) / (+input.max - +input.min)) * 100;
    $('.fl', box).style.width = pct + '%';
    $('.th', box).style.left = pct + '%';
    box.classList.toggle('is-low', v < gate);
    onInput(v);
  };
  input.addEventListener('input', paint);
  paint();
  return { value: () => +input.value, paint };
}
