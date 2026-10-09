// Aerodynamic paper-plane cursor (Creative Technologist implementation).
// Features:
// 1. Math.atan2(dy, dx) angular orientation tracking.
// 2. Dual-speed spring lerp for fluid lag/inertia at 60 FPS.
// 3. Banking & aerodynamic ascent pitch on clickable element hover.
// 4. Ethereal twilight wind trail particles with speed-driven opacity.
// 5. Clean, elegant touch/mobile fallback.
import { $, fine, motion, lerp } from "./utils.js";

const cursor = $("#cursor");
const plane = $("#cursor-plane");
const label = $("#cursor-label");
const canvas = $("#trail");
const ctx = canvas?.getContext("2d");

let active = false;
let raf = 0;
let lastTime = 0;

let tx = 0, ty = 0; // Target coordinates (mouse)
let x = 0, y = 0;   // Lerped coordinates
let vx = 0, vy = 0; // Velocity
let heading = -30;
let targetHeading = -30;
let pitch = 0;      // Hover flight pitch
let targetPitch = 0;
let scale = 1;
let targetScale = 1;

let particles = [];
let clickRipples = [];
let cursorHome = null;
let trailHome = null;

// Native modal dialogs render in the browser's top layer. Move the custom
// cursor into the active dialog while checkout is open so it remains visible
// instead of being painted underneath the dialog backdrop.
function syncTopLayerCursor() {
  if (!cursor || !canvas) return;
  const openDialog = document.querySelector("dialog[open]");

  if (openDialog) {
    if (!cursorHome) cursorHome = { parent: cursor.parentNode, next: cursor.nextSibling };
    if (!trailHome) trailHome = { parent: canvas.parentNode, next: canvas.nextSibling };
    openDialog.append(canvas, cursor);
    return;
  }

  if (cursorHome?.parent) {
    cursorHome.parent.insertBefore(cursor, cursorHome.next);
    cursorHome = null;
  }
  if (trailHome?.parent) {
    trailHome.parent.insertBefore(canvas, trailHome.next);
    trailHome = null;
  }
}

function resize() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function isFinePointer() {
  return fine.matches && !motion.reduced && !("ontouchstart" in window && window.innerWidth <= 900);
}

function schedule() {
  if (!raf && active) raf = requestAnimationFrame(tick);
}

function tick(time) {
  raf = 0;
  const dt = Math.min((time - (lastTime || time - 16.67)) / 16.67, 3);
  lastTime = time;

  // Fluid Lerp interpolation for natural aerodynamic inertia
  const kPos = 1 - Math.pow(0.72, dt);
  const nx = lerp(x, tx, kPos);
  const ny = lerp(y, ty, kPos);
  vx = nx - x;
  vy = ny - y;
  x = nx;
  y = ny;

  const speed = Math.hypot(vx, vy);

  // Dynamic angular orientation based on vector velocity: Math.atan2(dy, dx)
  if (speed > 0.8) {
    targetHeading = (Math.atan2(vy, vx) * 180) / Math.PI;
  }
  const diffAngle = ((targetHeading - heading + 540) % 360) - 180;
  heading += diffAngle * (1 - Math.pow(0.8, dt));

  // Pitch & Scale (Hover ascent takes flight: tilts up -26° and expands)
  pitch = lerp(pitch, targetPitch, 0.16 * dt);
  scale = lerp(scale, targetScale, 0.18 * dt);

  // Apply transforms
  if (cursor && plane) {
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    plane.style.transform = `rotate(${heading}deg) rotateZ(${pitch}deg) scale(${scale})`;
  }

  // Generate wind trail particles when moving with speed
  if (ctx && canvas) {
    if (speed > 1.4 && !document.hidden) {
      particles.push({
        x: x - Math.cos((heading * Math.PI) / 180) * 12,
        y: y - Math.sin((heading * Math.PI) / 180) * 12,
        vx: -vx * 0.15 + (Math.random() - 0.5) * 0.4,
        vy: -vy * 0.15 + (Math.random() - 0.5) * 0.4,
        life: 1.0,
        size: 1.6 + Math.random() * 1.8,
      });
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Render ethereal trail particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.038 * dt;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      // Carbon smoke palette keeps the cursor monochrome and editorial.
      ctx.fillStyle = `rgba(38, 38, 42, ${(p.life * 0.42).toFixed(3)})`;
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }

    // Click ripples
    for (let i = clickRipples.length - 1; i >= 0; i--) {
      const r = clickRipples[i];
      r.radius += 2.8 * dt;
      r.life -= 0.045 * dt;

      if (r.life <= 0) {
        clickRipples.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.strokeStyle = `rgba(229, 229, 234, ${(r.life * 0.6).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (speed > 0.05 || particles.length || clickRipples.length || Math.abs(diffAngle) > 0.1 || Math.abs(targetPitch - pitch) > 0.1) {
    schedule();
  }
}

function onPointerMove(e) {
  if (!isFinePointer() || e.pointerType !== "mouse") return;

  if (!active) {
    x = tx = e.clientX;
    y = ty = e.clientY;
    active = true;
    document.body.classList.add("custom-cursor");
  }

  tx = e.clientX;
  ty = e.clientY;

  // Detect hover over interactive elements (buttons, links, swatches, inputs)
  const interactive = Boolean(e.target.closest("button, a, input, summary, [data-interactive], .magnetic, .tile"));
  
  // When hovering clickable element: plane tilts up as if ascending into flight (-24deg pitch) and scales up
  targetPitch = interactive ? -24 : 0;
  targetScale = interactive ? 1.35 : 1.0;

  schedule();
}

function onPointerDown(e) {
  if (!active) return;
  clickRipples.push({
    x: e.clientX,
    y: e.clientY,
    radius: 4,
    life: 1.0,
  });
  targetScale = 0.85;
  setTimeout(() => {
    targetScale = 1.35;
  }, 120);
  schedule();
}

function deactivate() {
  active = false;
  document.body.classList.remove("custom-cursor");
  cancelAnimationFrame(raf);
  raf = 0;
  particles = [];
  clickRipples = [];
  if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

export function initCursor() {
  if (!canvas || !cursor) return;

  resize();
  window.addEventListener("resize", resize, { passive: true });

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });

  const dialogObserver = new MutationObserver(syncTopLayerCursor);
  dialogObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
  syncTopLayerCursor();

  document.documentElement.addEventListener("pointerleave", () => {
    if (cursor) cursor.style.opacity = "0";
  });
  document.documentElement.addEventListener("pointerenter", () => {
    if (cursor) cursor.style.opacity = "";
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else schedule();
  });

  fine.addEventListener("change", () => {
    if (!fine.matches) deactivate();
  });

  motion.on((reduced) => {
    if (reduced) deactivate();
  });
}
