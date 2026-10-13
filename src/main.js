import './style.css';
import './boardingpass.css';
import './cursor.css';
import { generatePassPNG } from './boardingpass.js';
import { initDreamerCursor } from './cursor.js';
import '@phosphor-icons/web/regular';
import QRCode from 'qrcode';

const $ = (selector) => document.querySelector(selector);
const colors = { onyx: 'Original', white: 'Total Black', grey: 'Letras Grises' };
const backVariants = {
  onyx: '/assets/hoodie-back-transparent.png',
  white: '/assets/hoodie-back-black.png',
  grey: '/assets/hoodie-back-grey.png'
};
const state = { size: 'M', color: 'onyx', pass: null, processing: false, inBag: false, cartCount: 0 };
const checkout = $('#checkout');
const info = $('#info-dialog');
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = reducedQuery.matches;
let manualReduced = false;
const cursorController = initDreamerCursor();
let returnFocus;
$('#color-name').textContent = colors[state.color];
document.querySelectorAll('.swatch[data-color]').forEach(button => { button.setAttribute('aria-label', colors[button.dataset.color]); });
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
function showArt(file, title) { const image = new Image(); image.src = `/assets/${file}`; image.alt = title; showInfo(title, image); }
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
document.querySelectorAll('.swatch[data-color]').forEach(button => button.addEventListener('click', () => {
  state.color = button.dataset.color;
  $('#color-name').textContent = colors[state.color];
  productPanel?.setAttribute('data-color', state.color);
  document.querySelectorAll('[data-hoodie-layer]').forEach(layer => { layer.dataset.color = state.color; });
  const backImage = document.querySelector('.hoodie-face-back img');
  if (backImage) backImage.src = backVariants[state.color];
  $('#hoodie').setAttribute('aria-label', `Heavyweight Hoodie en ${colors[state.color]}. Activar para girar la prenda`);
  $('#preview-note').textContent = 'Variante de bordado aplicada. La textura elevada se conserva.';
  document.querySelectorAll('.swatch').forEach(b => { const selected = b === button; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
}));
function openCheckout() {
  $('#checkout-content').hidden = false; $('#processing').hidden = true; $('#success').hidden = true;
  $('#order-variant').textContent = `${colors[state.color]} / Talla ${state.size}`;
  if (state.cartCount === 0) setBagCount(1);
  openDialog(checkout);
}
const bag = $('#bag');
function setBagCount(count, celebrate = false) {
  state.cartCount = count;
  $('#bag-count').textContent = String(count);
  state.inBag = count > 0;
  bag.classList.toggle('has-item', state.inBag);
  bag.setAttribute('aria-label', `Abrir carrito, ${count} ${count === 1 ? 'artículo' : 'artículos'}`);
  if (celebrate && !reduced) {
    bag.classList.remove('cart-arrival');
    void bag.offsetWidth;
    bag.classList.add('cart-arrival');
  }
}
$('#add-to-bag').addEventListener('click', event => {
  setBagCount(state.cartCount + 1, true);
  const button = event.currentTarget;
  const label = button.querySelector('span');
  const icon = button.querySelector('i');
  label.textContent = 'AÑADIDO AL CARRITO';
  icon.className = 'ph ph-check';
  button.classList.add('is-added');
  window.setTimeout(() => {
    label.textContent = 'AGREGAR AL CARRITO';
    icon.className = 'ph ph-shopping-cart-simple';
    button.classList.remove('is-added');
  }, 1400);
});
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
  state.pass = { ...state.pass, passenger: state.pass.name, destination: 'TUS SUEÑOS / YOUR HIGHEST POTENTIAL', piece: `${state.pass.color} · Talla ${state.pass.size}`, date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(), flight: 'DRM-2026', gate: '∞', seat: '01A' };
  $('#pass-piece').textContent = state.pass.piece;
  $('#pass-date').textContent = state.pass.date;
  $('#pass-barcode').replaceChildren(...Array.from({ length: 70 }, (_, i) => {
    const bar = document.createElement('i'); bar.style.width = `${i % 3 ? 1.5 : 3}px`; bar.style.opacity = i % 4 ? '.9' : '0'; return bar;
  }));
  $('#pass-name').textContent = state.pass.name;
  $('#pass-id').textContent = state.pass.id;
  $('#pass-error').hidden = true;
  try {
    await QRCode.toCanvas($('#qr'), JSON.stringify({ demo: true, pass: state.pass.id, flight: 'DRM-2026', destination: 'YOUR HIGHEST POTENTIAL' }), { width: 220, margin: 2, color: { dark: '#16171b', light: '#e4e2db' }, errorCorrectionLevel: 'M' });
    $('#download').disabled = false;
  } catch {
    $('#pass-error').textContent = 'No pudimos crear el QR. Puedes seguir explorando y volver a intentar la compra demo.';
    $('#pass-error').hidden = false; $('#download').disabled = true;
  }
  state.processing = false;
  $('#processing').hidden = true; $('#success').hidden = false;
  checkout.querySelector('.close').hidden = false;
  setBagCount(0); checkout.scrollTop = 0;
  $('#success h2').tabIndex = -1; $('#success h2').focus();
});
$('#download').addEventListener('click', async () => {
  if (!state.pass) return;
  $('#download').disabled = true;
  try { await document.fonts.ready; await generatePassPNG(state.pass); }
  catch { $('#pass-error').textContent = 'No se pudo descargar el pase. Inténtalo de nuevo.'; $('#pass-error').hidden = false; }
  finally { $('#download').disabled = false; }
});
// Bind once so repeat purchases do not accumulate pointer handlers.
const boardingPass = $('#boarding-pass');
boardingPass.addEventListener('pointermove', event => {
  if (reduced || manualReduced || event.pointerType !== 'mouse') return;
  const rect = boardingPass.getBoundingClientRect();
  const px = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const py = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  boardingPass.style.setProperty('--prx', `${(py - .5) * -14}deg`);
  boardingPass.style.setProperty('--pry', `${(px - .5) * 16}deg`);
  boardingPass.style.setProperty('--mx', `${px * 100}%`);
  boardingPass.style.setProperty('--my', `${py * 100}%`);
});
boardingPass.addEventListener('pointerleave', () => {
  boardingPass.style.setProperty('--prx', '0deg'); boardingPass.style.setProperty('--pry', '0deg');
});
document.querySelectorAll('.hoodie-face img').forEach(image => image.addEventListener('error', event => {
  if (!event.target.src.endsWith('campaign.png')) event.target.src = '/assets/campaign.png';
}));

let suppressTouchFlip = false;
const hoodieControl = $('#hoodie');
const productPanel = $('#product');
const productTitle = productPanel?.querySelector('.product-heading h2');
productPanel?.setAttribute('data-color', state.color);
if (productTitle) {
  const frontTitle = document.createElement('span');
  frontTitle.className = 'title-front';
  frontTitle.textContent = productTitle.textContent;
  const backTitle = document.createElement('span');
  backTitle.className = 'title-back';
  backTitle.setAttribute('aria-hidden', 'true');
  const backTitleImage = document.createElement('img');
  backTitleImage.src = '/assets/heavyweight-hoodie-embroidered.png';
  backTitleImage.alt = '';
  backTitleImage.width = 900;
  backTitleImage.height = 180;
  backTitle.append(backTitleImage);
  productTitle.replaceChildren(frontTitle, backTitle);
  productTitle.classList.add('product-title');
}
function setHoodieBack(showingBack) {
  hoodieControl.classList.toggle('is-back', showingBack);
  stage.classList.toggle('showing-back', showingBack);
  productPanel?.classList.toggle('showing-back', showingBack);
  hoodieControl.setAttribute('aria-pressed', String(showingBack));
  hoodieControl.setAttribute('aria-label', showingBack
    ? 'Heavyweight Hoodie, vista trasera con estampado Rich Not Risk. Activar para ver el frente'
    : `Heavyweight Hoodie en ${colors[state.color]}, vista frontal. Activar para ver la espalda`);
  $('.stage-note').textContent = showingBack ? 'La espalda también cuenta.' : 'El sueño empieza contigo.';
  $('.interaction-note').lastChild.textContent = showingBack ? ' Volver al frente.' : ' Clic para girar.';
}
hoodieControl.addEventListener('click', event => {
  if (suppressTouchFlip) { suppressTouchFlip = false; return; }
  // On a mouse, hover owns the flip; keep a click from immediately undoing it.
  // Touch and keyboard users still get the explicit toggle.
  if (event.detail > 0 && window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  setHoodieBack(!hoodieControl.classList.contains('is-back'));
});
hoodieControl.addEventListener('mouseenter', () => setHoodieBack(true));
hoodieControl.addEventListener('mouseleave', () => setHoodieBack(false));

// Product depth has its own demand-driven loop; cursor motion lives in cursor.js.
const stage = $('#stage'), stageBackground = $('#stage-background'), showcase = $('#showcase');
let frame = 0, lastTime = 0;
let tiltX = 0, tiltY = 0, tx = 0, ty = 0;
function schedule() { if (!frame && !reduced && !document.hidden) frame = requestAnimationFrame(tick); }
function tick(time) {
  frame = 0;
  const dt = Math.min((time - (lastTime || time - 16)) / 16.67, 3); lastTime = time;
  const lerp = 1 - Math.pow(.79, dt);
  tiltX += (tx - tiltX) * lerp; tiltY += (ty - tiltY) * lerp;
  stageBackground.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.035)`;
  if (Math.abs(tx - tiltX) + Math.abs(ty - tiltY) > .01) schedule();
}
let touchId = null;
let touchMoved = false;
showcase.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' && touchId === null) {
    touchId = event.pointerId;
    touchMoved = false;
    showcase.setPointerCapture(touchId);
  }
});
showcase.addEventListener('pointermove', event => {
  if (reduced || (event.pointerType !== 'mouse' && touchId !== event.pointerId)) return;
  if (event.pointerType !== 'mouse') touchMoved = true;
  const rect = showcase.getBoundingClientRect();
  const px = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const py = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  tx = (py - .5) * -13; ty = (px - .5) * 17;
  schedule();
}, { passive: true });
function resetTilt() {
  if (touchId !== null && touchMoved) suppressTouchFlip = true;
  tx = ty = 0; touchId = null; touchMoved = false; schedule();
}
showcase.addEventListener('pointerleave', resetTilt); showcase.addEventListener('pointerup', resetTilt); showcase.addEventListener('pointercancel', resetTilt);
function updateMotion() { reduced = reducedQuery.matches; document.body.classList.toggle('reduced-motion', reduced); cursorController.setReduced(reduced); if (reduced) { cancelAnimationFrame(frame); frame = 0; stageBackground.style.transform = ''; } }
reducedQuery.addEventListener('change', updateMotion); updateMotion();
document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else schedule(); });
