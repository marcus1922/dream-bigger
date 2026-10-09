// Shared helpers + reduced-motion state.
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const fine = matchMedia("(hover: hover) and (pointer: fine)");

const query = matchMedia("(prefers-reduced-motion: reduce)");
let manual = false;
const subs = new Set();
export const motion = {
  get reduced() {
    return query.matches || manual;
  },
  toggle() {
    manual = !manual;
    emit();
  },
  on(fn) {
    subs.add(fn);
    fn(motion.reduced);
  },
};
function emit() {
  document.body.classList.toggle("reduced-motion", motion.reduced);
  subs.forEach((fn) => fn(motion.reduced));
}
query.addEventListener("change", emit);
document.body.classList.toggle("reduced-motion", motion.reduced);

let toastTimer;
export function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

export const PLANE_SVG =
  '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M3 5 38 20 3 35 10 20Z" fill="#f4f1ea"/><path d="m10 20 28 0L3 35Z" fill="#a3aec2"/><path d="M3 5 10 20 38 20Z" fill="#fff"/></svg>';

/**
 * Fly a paper plane element (optionally carrying a label) along a curved
 * path inside `host`. Resolves when the flight ends.
 */
export function flyPlane(host, { from, to, label = "", duration = 2600, arc = -160, size = 42 }) {
  const el = document.createElement("div");
  el.className = "paper-flight";
  el.innerHTML = PLANE_SVG + (label ? `<span></span>` : "");
  if (label) el.querySelector("span").textContent = label;
  el.querySelector("svg").style.width = el.querySelector("svg").style.height = `${size}px`;
  host.appendChild(el);
  const steps = 14;
  const frames = [];
  let prev = from;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = lerp(from.x, to.x, t) + Math.sin(t * Math.PI * 2) * 30;
    const y = lerp(from.y, to.y, t) + Math.sin(t * Math.PI) * arc;
    const ang = i === 0 ? Math.atan2(to.y - from.y, to.x - from.x) : Math.atan2(y - prev.y, x - prev.x);
    prev = { x, y };
    frames.push({
      transform: `translate(${x}px, ${y}px) rotate(${(ang * 180) / Math.PI}deg) scale(${lerp(1, 0.55, t)})`,
      opacity: t > 0.85 ? (1 - t) / 0.15 : 1,
      offset: t,
    });
  }
  // keep label upright-ish: counter-rotate not needed, the label travels with the plane
  const anim = el.animate(frames, { duration, easing: "cubic-bezier(.45,.05,.35,1)", fill: "forwards" });
  return anim.finished.then(() => el.remove());
}
