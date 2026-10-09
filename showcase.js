export let exportSetView = () => {};

// Showcase 3D: High-fashion 3D product inspection (Jacquemus / Fear of God).
// Multi-layer Z-depth parallax, dynamic specular fabric sheen, 360° spin,
// gyroscope mobile support, and seamless color/size state synchronization.
import { $, $$, clamp, lerp, motion } from "./utils.js";

export const state = {
  view: "front", // "front" | "back"
  color: "onyx",
  colorName: "Midnight Onyx",
  size: "M",
  qty: 1,
  passenger: "Marcus",
  email: "marcus.dreamer@atelier.com",
  dream: "TUS SUEÑOS / YOUR HIGHEST POTENTIAL",
  address: "Boulevard de las Américas 1040",
  city: "Tijuana, B.C.",
  postal: "22000",
  shipMethod: "std",
  paymentMethod: "apple",
  unitPrice: 1890,
  shippingCost: 0,
};

const COLOR_NAMES = {
  onyx: "Midnight Onyx",
  white: "Cloud White",
  grey: "Dream Dust Grey",
};

export function initShowcase() {
  const showcase = $("#showcase");
  const garment = $("#garment");
  const floorShadow = $("#floor-shadow");
  if (!showcase || !garment) return;

  let rx = 0, ry = 0;
  let targetRx = 0, targetRy = 0;
  let baseRy = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartRy = 0;
  let lightX = 50, lightY = 35;
  let targetLightX = 50, targetLightY = 35;

  let raf = 0;

  function update() {
    raf = 0;
    if (motion.reduced) {
      garment.style.setProperty("--rx", "0deg");
      garment.style.setProperty("--ry", `${baseRy}deg`);
      return;
    }

    rx = lerp(rx, targetRx, 0.12);
    ry = lerp(ry, targetRy, 0.12);
    lightX = lerp(lightX, targetLightX, 0.15);
    lightY = lerp(lightY, targetLightY, 0.15);

    const totalRy = baseRy + ry;

    garment.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    garment.style.setProperty("--ry", `${totalRy.toFixed(2)}deg`);
    showcase.style.setProperty("--lx", `${lightX.toFixed(1)}%`);
    showcase.style.setProperty("--ly", `${lightY.toFixed(1)}%`);

    if (floorShadow) {
      const shadowShift = (-totalRy * 0.35).toFixed(1);
      const shadowScale = (1 - Math.abs(rx) * 0.015).toFixed(2);
      floorShadow.style.setProperty("--sx", `${shadowShift}px`);
      floorShadow.style.setProperty("--ss", shadowScale);
    }

    if (
      Math.abs(targetRx - rx) > 0.05 ||
      Math.abs(targetRy - ry) > 0.05 ||
      Math.abs(targetLightX - lightX) > 0.1 ||
      Math.abs(targetLightY - lightY) > 0.1
    ) {
      raf = requestAnimationFrame(update);
    }
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(update);
  }

  // Mouse tilt on showcase
  showcase.addEventListener(
    "pointermove",
    (e) => {
      if (motion.reduced || isDragging || e.pointerType === "touch") return;
      const rect = showcase.getBoundingClientRect();
      const px = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const py = clamp((e.clientY - rect.top) / rect.height, 0, 1);

      targetRx = (py - 0.5) * -18;
      targetRy = (px - 0.5) * 24;

      targetLightX = px * 100;
      targetLightY = py * 100;

      schedule();
    },
    { passive: true }
  );

  showcase.addEventListener("pointerleave", () => {
    if (isDragging) return;
    targetRx = 0;
    targetRy = 0;
    targetLightX = 50;
    targetLightY = 35;
    schedule();
  });

  // Mobile Gyroscope support
  if (window.DeviceOrientationEvent && "ontouchstart" in window) {
    window.addEventListener(
      "deviceorientation",
      (e) => {
        if (motion.reduced || !e.gamma || !e.beta) return;
        targetRy = clamp(e.gamma * 0.6, -20, 20);
        targetRx = clamp((e.beta - 45) * 0.4, -15, 15);
        targetLightX = 50 + targetRy * 1.5;
        targetLightY = 50 + targetRx * 1.5;
        schedule();
      },
      { passive: true }
    );
  }

  // 360° Horizontal Drag rotation
  garment.addEventListener("pointerdown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartRy = ry;
    garment.classList.add("dragging");
    garment.setPointerCapture(e.pointerId);
  });

  garment.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    targetRy = dragStartRy + deltaX * 0.45;
    ry = targetRy;

    const normalized = (baseRy + ry) % 360;
    const isBackFacing = Math.abs(normalized) > 90 && Math.abs(normalized) < 270;
    garment.classList.toggle("show-back", isBackFacing);

    schedule();
  });

  const stopDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    garment.classList.remove("dragging");
    try {
      if (e && e.pointerId) garment.releasePointerCapture(e.pointerId);
    } catch {}

    const total = baseRy + ry;
    const remainder = ((total % 360) + 360) % 360;

    if (remainder > 90 && remainder < 270) {
      setView("back");
    } else {
      setView("front");
    }
  };

  garment.addEventListener("pointerup", stopDrag);
  garment.addEventListener("pointercancel", stopDrag);

  // View switch: Frente / Espalda
  exportSetView = (view) => setView(view);
  function setView(view) {
    state.view = view;
    baseRy = view === "back" ? 180 : 0;
    targetRy = 0;
    ry = 0;

    $$(".view-toggle button").forEach((btn) => {
      const active = btn.dataset.view === view;
      btn.classList.toggle("selected", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    garment.classList.toggle("show-back", view === "back");
    schedule();
  }

  $$(".view-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  // Color Selector: "Midnight Onyx", "Cloud White", "Dream Dust Grey"
  $$(".swatches .swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const c = btn.dataset.color;
      state.color = c;
      state.colorName = COLOR_NAMES[c] || c;

      $$(".swatches .swatch").forEach((b) => {
        const sel = b === btn;
        b.classList.toggle("selected", sel);
        b.setAttribute("aria-pressed", String(sel));
      });

      const colorNameEl = $("#color-name");
      if (colorNameEl) colorNameEl.textContent = state.colorName;

      showcase.dataset.color = c;

      const note = $("#preview-note");
      if (note) {
        if (c === "onyx") {
          note.textContent = "Corte unisex relajado · Envío asegurado con Boarding Pass.";
        } else if (c === "white") {
          note.textContent = "Cloud White: Tono blanco óptico con costuras tonales de alta costura.";
        } else {
          note.textContent = "Dream Dust Grey: Mezcla gris ceniza con textura de microdestellos minerales.";
        }
      }

      syncSelection();
    });
  });

  // Size Selector: S, M, L, XL, XXL with visual haptic feedback
  $$(".sizes button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.size = btn.dataset.size;
      $$(".sizes button").forEach((b) => {
        const sel = b === btn;
        b.classList.toggle("selected", sel);
        b.setAttribute("aria-pressed", String(sel));
      });

      // Visual haptic pop
      btn.animate(
        [
          { transform: "scale(0.92)" },
          { transform: "scale(1.08)" },
          { transform: "scale(1)" },
        ],
        { duration: 250, easing: "cubic-bezier(0.2, 1, 0.3, 1)" }
      );

      syncSelection();
    });
  });

  function syncSelection() {
    const ticketVariant = $("#ticket-variant");
    if (ticketVariant) {
      ticketVariant.textContent = `${state.colorName} · Talla ${state.size}`;
    }
    const passPiece = $("#pass-piece");
    if (passPiece) {
      passPiece.textContent = `${state.colorName} · Talla ${state.size}`;
    }
  }

  syncSelection();
}
