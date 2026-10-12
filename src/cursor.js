const interactiveSelector = 'a, button, select, summary, [role="button"], [data-cursor="link"]';
const textSelector = 'input:not([type="button"]):not([type="submit"]):not([type="radio"]):not([type="checkbox"]), textarea, [contenteditable="true"], [data-cursor="text"]';

const cursorMarkup = `
  <canvas id="dreamer-trail" aria-hidden="true"></canvas>
  <div id="dreamer-cursor" data-mode="normal" aria-hidden="true">
    <span class="dreamer-cursor-plane">
      <img class="cursor-plane-art cursor-plane-art-white" src="/assets/cursor/plane-white.png" alt="">
      <img class="cursor-plane-art cursor-plane-art-carbon" src="/assets/cursor/plane-carbon.png" alt="">
    </span>
    <span class="dreamer-cursor-text">
      <svg viewBox="0 0 24 42"><path d="M4 2h16v5h-5v28h5v5H4v-5h5V7H4z"/></svg>
    </span>
    <span class="dreamer-cursor-loader">
      <i class="dreamer-loader-ring"></i>
      <span class="dreamer-loader-plane">
        <img class="cursor-plane-art cursor-plane-art-white" src="/assets/cursor/plane-white.png" alt="">
        <img class="cursor-plane-art cursor-plane-art-carbon" src="/assets/cursor/plane-carbon.png" alt="">
      </span>
    </span>
  </div>`;

export function initDreamerCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return { setReduced() {} };

  document.body.insertAdjacentHTML('beforeend', cursorMarkup);
  const cursor = document.querySelector('#dreamer-cursor');
  const trail = document.querySelector('#dreamer-trail');
  const ctx = trail.getContext('2d', { alpha: true });
  let targetX = innerWidth / 2, targetY = innerHeight / 2;
  let x = targetX, y = targetY, targetAngle = 0, angle = 0;
  let frame = 0, lastTime = 0, visible = false, reduced = false;
  let mode = 'normal', particles = [];

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    trail.width = innerWidth * dpr; trail.height = innerHeight * dpr;
    trail.style.width = `${innerWidth}px`; trail.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getSurfaceMode(target) {
    let node = target instanceof Element ? target : target?.parentElement;
    while (node && node !== document.documentElement) {
      const color = getComputedStyle(node).backgroundColor;
      const rgb = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
      if (rgb && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
        const luminance = (rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722) / 255;
        return luminance > .58 ? 'carbon' : 'white';
      }
      node = node.parentElement;
    }
    return 'white';
  }

  function setMode(nextMode, target) {
    if (mode !== 'loading') mode = nextMode;
    cursor.dataset.mode = mode;
    cursor.classList.toggle('is-carbon', getSurfaceMode(target) === 'carbon');
  }

  function schedule() { if (!frame && !reduced && !document.hidden) frame = requestAnimationFrame(tick); }

  function tick(time) {
    frame = 0;
    const dt = Math.min((time - (lastTime || time - 16)) / 16.67, 3); lastTime = time;
    const follow = 1 - Math.pow(.76, dt);
    const dx = targetX - x, dy = targetY - y;
    x += dx * follow; y += dy * follow;
    const diff = ((targetAngle - angle + 540) % 360) - 180;
    angle += diff * follow;
    const offset = mode === 'loading' ? 34 : 27;
    // The source artwork points 35° upward. Compensating here makes its nose
    // follow the real atan2 direction while keeping the original art untouched.
    const visualAngle = angle + 35;
    cursor.style.transform = `translate3d(${x - offset}px,${y - offset}px,0) rotate(${mode === 'text' || mode === 'loading' ? 0 : visualAngle}deg)`;

    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const speed = Math.hypot(dx, dy);
    if (visible && mode !== 'text' && speed > 9) {
      // A single wake originates at the tail, opposite the travel direction.
      particles.push({ x: x - Math.cos(angle * Math.PI / 180) * 22, y: y - Math.sin(angle * Math.PI / 180) * 22, life: 1, size: mode === 'link' ? 2.8 : 2.2 });
    }
    particles = particles.filter(p => (p.life -= .055 * dt) > 0).slice(-36);
    for (const p of particles) {
      ctx.beginPath();
      ctx.fillStyle = cursor.classList.contains('is-carbon') ? `rgba(24,25,29,${p.life * .2})` : `rgba(235,239,245,${p.life * .2})`;
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
    }
    if (speed > .1 || Math.abs(diff) > .1 || particles.length || mode === 'loading') schedule();
  }

  function syncTopLayer() {
    const openDialog = [...document.querySelectorAll('dialog[open]')].at(-1);
    if (openDialog) {
      if (trail.parentNode !== openDialog) openDialog.append(trail, cursor);
    } else {
      if (trail.parentNode !== document.body) document.body.append(trail, cursor);
    }
  }

  window.addEventListener('pointermove', event => {
    if (reduced || event.pointerType !== 'mouse') return;
    const dx = event.clientX - targetX, dy = event.clientY - targetY;
    if (!visible) { x = event.clientX; y = event.clientY; visible = true; document.body.classList.add('dreamer-cursor-active', 'dreamer-cursor-visible'); }
    if (Math.hypot(dx, dy) > 1) targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;
    targetX = event.clientX; targetY = event.clientY;
    const target = event.target;
    const nextMode = target.closest?.(textSelector) ? 'text' : target.closest?.(interactiveSelector) ? 'link' : 'normal';
    setMode(nextMode, target); syncTopLayer(); schedule();
  }, { passive: true });

  window.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') cursor.classList.add('is-pressed'); }, { passive: true });
  window.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'), { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { visible = false; document.body.classList.remove('dreamer-cursor-visible'); });

  const processing = document.querySelector('#processing');
  const observer = new MutationObserver(() => {
    mode = processing && !processing.hidden ? 'loading' : 'normal';
    cursor.dataset.mode = mode; syncTopLayer(); schedule();
  });
  if (processing) observer.observe(processing, { attributes: true, attributeFilter: ['hidden'] });
  document.querySelectorAll('dialog').forEach(dialog => observer.observe(dialog, { attributes: true, attributeFilter: ['open'] }));

  resize(); window.addEventListener('resize', resize, { passive: true });
  return {
    setReduced(value) {
      reduced = value;
      if (reduced) {
        cancelAnimationFrame(frame); frame = 0; particles = []; visible = false;
        document.body.classList.remove('dreamer-cursor-active', 'dreamer-cursor-visible');
        ctx.clearRect(0, 0, innerWidth, innerHeight);
      }
    },
  };
}
