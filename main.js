import './style.css';
import '@phosphor-icons/web/regular';
import QRCode from 'qrcode';

const $ = (selector) => document.querySelector(selector);
const colors = { onyx: 'Midnight Onyx', white: 'Cloud White', grey: 'Dream Dust Grey' };
const state = { size: 'M', color: 'onyx', pass: null, processing: false };
const checkout = $('#checkout');
const info = $('#info-dialog');
let returnFocus;
function openDialog(dialog) {
  returnFocus = document.activeElement;
  dialog.showModal();
  document.body.style.overflow = 'hidden';
}
function closeDialog(dialog) {
  if (state.processing) return;
  dialog.close();
}
for (const dialog of [checkout, info]) {
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; returnFocus?.focus(); });
  dialog.addEventListener('cancel', event => { if (state.processing) event.preventDefault(); });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(dialog);
    }
  });
  dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(dialog)));
}
function showInfo(title, content) { $('#info-title').textContent = title; $('#info-body').replaceChildren(content); openDialog(info); }
function showArt(file, title) { const image = new Image(); image.src = `/${file}`; image.alt = title; showInfo(title, image); }
$('#view-campaign').addEventListener('click', () => showArt('campaign.png', 'Rich Not Risks'));
document.querySelectorAll('[data-art]').forEach(button => button.addEventListener('click', () => showArt(button.dataset.art, button.dataset.title)));
$('#size-guide').addEventListener('click', () => {
  const content = document.createElement('div');
  content.innerHTML = '<p>La silueta propuesta es oversized, con hombro caído y cuerpo amplio. Elige tu talla habitual para un ajuste relajado.</p><p>Las tallas S, M, L, XL y XXL son opciones de esta demostración. Las medidas exactas de la prenda están pendientes de confirmación por la marca.</p><p>Antes de una compra real, compara ancho de pecho y largo con una sudadera que ya uses.</p>';
  showInfo('Encuentra tu fit.', content);
});
document.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => {
  state.size = button.dataset.size;
  document.querySelectorAll('[data-size]').forEach(b => { const selected = b === button; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
}));
document.querySelectorAll('[data-color]').forEach(button => button.addEventListener('click', () => {
  state.color = button.dataset.color;
  $('#color-name').textContent = colors[state.color];
  $('#hoodie').dataset.color = state.color;
  $('#hoodie').alt = `Visualización conceptual de Heavyweight Hoodie en ${colors[state.color]}`;
  $('#preview-note').textContent = state.color === 'onyx' ? 'Experiencia de compra demo. Visualización conceptual de la prenda.' : 'Color simulado digitalmente. La fotografía original corresponde a Midnight Onyx.';
  document.querySelectorAll('.swatch').forEach(b => { const selected = b === button; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
}));
function openCheckout() {
  $('#checkout-content').hidden = false; $('#processing').hidden = true; $('#success').hidden = true;
  $('#order-variant').textContent = `${colors[state.color]} / Talla ${state.size}`;
  $('#bag-count').textContent = '1'; openDialog(checkout);
}
$('#claim').addEventListener('click', openCheckout);
$('#bag').addEventListener('click', openCheckout);
// Local demo only: form values never leave this browser and are never persisted.
$('#order-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (state.processing) return;
  state.processing = true;
  const form = new FormData(event.currentTarget);
  state.pass = { id: `DRM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, name: String(form.get('passenger')).trim() || 'Dreamer', size: state.size, color: colors[state.color] };
  $('#checkout-content').hidden = true; $('#processing').hidden = false;
  checkout.querySelector('.close').hidden = true;
  const phases = ['Plegando tus alas...', 'Trazando la ruta de tus sueños...', 'Despegando hacia la meta...'];
  for (const phase of phases) { $('#flight-status').textContent = phase; await new Promise(resolve => setTimeout(resolve, 1000)); }
  $('#pass-name').textContent = state.pass.name;
  $('#pass-id').textContent = state.pass.id;
  $('#pass-error').hidden = true;
  try {
    await QRCode.toCanvas($('#qr'), JSON.stringify({ demo: true, pass: state.pass.id, flight: 'DRM-2026', destination: 'YOUR HIGHEST POTENTIAL' }), { width: 220, margin: 2, color: { dark: '#16171b', light: '#dce3eb' }, errorCorrectionLevel: 'M' });
    $('#download').disabled = false;
  } catch {
    $('#pass-error').textContent = 'No pudimos crear el QR. Puedes seguir explorando y volver a intentar la compra demo.';
    $('#pass-error').hidden = false; $('#download').disabled = true;
  }
  state.processing = false;
  $('#processing').hidden = true; $('#success').hidden = false;
  checkout.querySelector('.close').hidden = false;
  $('#bag-count').textContent = '0'; checkout.scrollTop = 0;
  $('#success h2').tabIndex = -1; $('#success h2').focus();
});
$('#download').addEventListener('click', () => {
  if (!state.pass) return;
  const canvas = document.createElement('canvas'); canvas.width = 1100; canvas.height = 650;
  const c = canvas.getContext('2d'); c.fillStyle = '#dce3eb'; c.fillRect(0, 0, 1100, 650); c.fillStyle = '#16171b';
  c.font = '800 60px Dreamer'; c.fillText('DREAMER®', 55, 90);
  c.font = '20px Body'; c.fillText('BOARDING PASS / PASE DE ABORDAJE', 55, 135);
  c.font = '800 94px Dreamer'; c.fillText('NOW', 55, 265); c.fillText('DRM', 520, 265);
  c.font = '23px Body'; c.fillText('YOUR HIGHEST POTENTIAL', 55, 315);
  c.font = '18px Body'; c.fillText('PASAJERO', 55, 390); c.fillText('VUELO', 520, 390);
  c.font = '29px Body'; c.fillText(state.pass.name, 55, 430, 430); c.fillText('DRM-2026', 520, 430);
  c.font = '21px Body'; c.fillText(`${state.pass.color} / ${state.pass.size}`, 55, 480); c.fillText(state.pass.id, 55, 535);
  c.drawImage($('#qr'), 795, 270, 250, 250);
  c.font = '18px Body'; c.fillText('NEVER STOP CHASING. / Pase demo sin valor de viaje.', 55, 590);
  canvas.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `DREAMER-${state.pass.id}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
});
$('#hoodie').addEventListener('error', event => { if (!event.target.src.endsWith('campaign.png')) event.target.src = '/campaign.png'; });

// One demand-driven animation loop for cursor inertia, wind and 3D depth.
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const fineQuery = matchMedia('(hover: hover) and (pointer: fine)');
let reduced = reducedQuery.matches;
let manualReduced = false;
const stage = $('#stage'), showcase = $('#showcase'), cursor = $('#cursor'), trail = $('#trail');
const ctx = trail.getContext('2d');
let frame = 0, lastTime = 0, activePointer = false, hover = false;
let targetX = 0, targetY = 0, x = 0, y = 0, angle = 0, targetAngle = 0;
let tiltX = 0, tiltY = 0, tx = 0, ty = 0, particles = [];
function resize() { const dpr = Math.min(devicePixelRatio || 1, 2); trail.width = innerWidth * dpr; trail.height = innerHeight * dpr; trail.style.width = `${innerWidth}px`; trail.style.height = `${innerHeight}px`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
resize(); window.addEventListener('resize', resize, { passive: true });
function schedule() { if (!frame && !reduced && !document.hidden) frame = requestAnimationFrame(tick); }
function tick(time) {
  frame = 0;
  const dt = Math.min((time - (lastTime || time - 16)) / 16.67, 3); lastTime = time;
  const lerp = 1 - Math.pow(.79, dt);
  const dx = targetX - x, dy = targetY - y;
  x += dx * lerp; y += dy * lerp;
  const diff = ((targetAngle - angle + 540) % 360) - 180; angle += diff * lerp;
  cursor.style.transform = `translate3d(${x - 14}px,${y - 14}px,0) rotate(${angle + (hover ? -25 : 0)}deg) scale(${hover ? 1.2 : 1})`;
  tiltX += (tx - tiltX) * lerp; tiltY += (ty - tiltY) * lerp;
  stage.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  if (activePointer && Math.hypot(dx, dy) > 10 && !checkout.open && !info.open) particles.push({ x, y, life: 1 });
  particles = particles.filter(p => p.life > 0).slice(-40);
  for (const p of particles) { p.life -= .045 * dt; ctx.beginPath(); ctx.fillStyle = `rgba(186,210,238,${Math.max(p.life, 0) * .22})`; ctx.arc(p.x, p.y, 1.8 * Math.max(p.life, 0), 0, Math.PI * 2); ctx.fill(); }
  if (Math.hypot(dx, dy) > .1 || Math.abs(diff) > .1 || Math.abs(tx - tiltX) + Math.abs(ty - tiltY) > .01 || particles.length) schedule();
}
window.addEventListener('pointermove', event => {
  if (reduced || event.pointerType !== 'mouse' || !fineQuery.matches) return;
  const dx = event.clientX - targetX, dy = event.clientY - targetY;
  if (!activePointer) { x = event.clientX; y = event.clientY; activePointer = true; document.body.classList.add('custom-cursor'); }
  if (Math.hypot(dx, dy) > 1) targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  targetX = event.clientX; targetY = event.clientY;
  hover = Boolean(event.target.closest('button,a,input'));
  schedule();
}, { passive: true });
document.documentElement.addEventListener('pointerleave', () => { activePointer = false; document.body.classList.remove('custom-cursor'); });
let touchId = null;
showcase.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse' && touchId === null && !event.target.closest('button')) { touchId = event.pointerId; showcase.setPointerCapture(touchId); } });
showcase.addEventListener('pointermove', event => {
  if (reduced || (event.pointerType !== 'mouse' && touchId !== event.pointerId)) return;
  const rect = showcase.getBoundingClientRect();
  const px = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const py = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  tx = (py - .5) * -13; ty = (px - .5) * 17;
  stage.style.setProperty('--light-x', `${px * 100}%`); stage.style.setProperty('--light-y', `${py * 100}%`); schedule();
}, { passive: true });
function resetTilt() { tx = ty = 0; touchId = null; schedule(); }
showcase.addEventListener('pointerleave', resetTilt); showcase.addEventListener('pointerup', resetTilt); showcase.addEventListener('pointercancel', resetTilt);
function updateMotion() { reduced = reducedQuery.matches || manualReduced; document.body.classList.toggle('reduced-motion', reduced); $('#motion-toggle').textContent = `Movimiento: ${reduced ? 'reducido' : 'activo'}`; $('#motion-toggle').setAttribute('aria-pressed', String(reduced)); if (reduced) { cancelAnimationFrame(frame); frame = 0; particles = []; activePointer = false; document.body.classList.remove('custom-cursor'); stage.style.transform = ''; ctx.clearRect(0, 0, innerWidth, innerHeight); } }
$('#motion-toggle').addEventListener('click', () => { manualReduced = !manualReduced; updateMotion(); }); reducedQuery.addEventListener('change', updateMotion); updateMotion();
document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else schedule(); });
