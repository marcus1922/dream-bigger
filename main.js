// Main application entry: Orchestrates components, scroll observers,
// drag rail gallery, magnetic buttons, altimeter, and dialog handlers.
import { $, $$, clamp, motion } from "./utils.js";
import { initIntro } from "./intro.js";
import { initCursor } from "./cursor.js";
import { initShowcase } from "./showcase.js";
import { initJourney } from "./journey.js";
import { initLaunch } from "./launch.js";
import { initCheckin } from "./checkin.js";

document.addEventListener("DOMContentLoaded", () => {
  initIntro();
  initCursor();
  initShowcase();
  initJourney();
  initLaunch();
  initCheckin();

  initHeaderAndAltimeter();
  initGalleryRail();
  initSizeGuideAndInfo();
  initMagneticButtons();
  initScrollReveals();
  initDialogHandlers();
  initMotionToggle();
});

// Header scroll behavior & live altimeter
function initHeaderAndAltimeter() {
  const header = $("#header");
  const altimeter = $("#altitude");
  let lastScrollY = window.scrollY;

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? clamp(y / maxScroll, 0, 1) : 0;

      // Header glass blur
      header?.classList.toggle("scrolled", y > 60);

      // Altimeter climbs from 0 to 35,000 FT across page height
      if (altimeter) {
        const alt = Math.floor(progress * 35000);
        altimeter.textContent = alt.toLocaleString("en-US").padStart(6, "0");
      }

      lastScrollY = y;
    },
    { passive: true }
  );
}

// Drag gallery rail for "Universo DREAMER"
function initGalleryRail() {
  const rail = $("#rail");
  if (!rail) return;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let vel = 0;
  let lastX = 0;

  rail.addEventListener("mousedown", (e) => {
    isDown = true;
    rail.classList.add("dragging");
    startX = e.pageX - rail.offsetLeft;
    scrollLeft = rail.scrollLeft;
    lastX = e.pageX;
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    rail.classList.remove("dragging");
  });

  rail.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - rail.offsetLeft;
    const walk = (x - startX) * 1.6;
    vel = e.pageX - lastX;
    lastX = e.pageX;
    rail.scrollLeft = scrollLeft - walk;
  });

  // Clicking an art tile opens the high-res view in info modal
  $$(".tile", rail).forEach((tile) => {
    tile.addEventListener("click", () => {
      if (Math.abs(vel) > 6) return; // ignore click if drag momentum
      const art = tile.dataset.art;
      const title = tile.dataset.title;
      if (art) showMediaLightbox(art, title);
    });
  });
}

// Media Lightbox & Size guide dialog
function initSizeGuideAndInfo() {
  const sizeGuideBtn = $("#size-guide");
  if (sizeGuideBtn) {
    sizeGuideBtn.addEventListener("click", () => {
      showInfoDialog(
        "Guía de Fit — Heavyweight Hoodie",
        `
        <p>Corte <strong>Oversized Signature</strong> con hombros caídos y volumen en el pecho. Si buscas el fit relajado característico de DREAMER, elige tu talla habitual.</p>
        <table class="fit-table">
          <thead>
            <tr>
              <th>Talla</th>
              <th>Pecho (cm)</th>
              <th>Largo (cm)</th>
              <th>Manga (cm)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>S</td><td>122</td><td>70</td><td>61</td></tr>
            <tr><td>M</td><td>128</td><td>72</td><td>62</td></tr>
            <tr><td>L</td><td>134</td><td>74</td><td>63</td></tr>
            <tr><td>XL</td><td>140</td><td>76</td><td>64</td></tr>
            <tr><td>XXL</td><td>146</td><td>78</td><td>65</td></tr>
          </tbody>
        </table>
        <p class="note">Tejido 100% algodón preencogido de 400 GSM con lavado enzimático vintage.</p>
      `
      );
    });
  }
}

export function showInfoDialog(title, htmlContent) {
  const info = $("#info");
  const infoTitle = $("#info-title");
  const infoBody = $("#info-body");
  if (!info || !infoTitle || !infoBody) return;

  infoTitle.textContent = title;
  infoBody.innerHTML = htmlContent;
  info.showModal();
}

function showMediaLightbox(imageFile, title) {
  showInfoDialog(
    title,
    `
    <img src="/${imageFile}" alt="${title}" loading="lazy" />
    <p class="note" style="margin-top: 14px;">Archivo original del universo visual DREAMER®.</p>
  `
  );
}

// Magnetic Buttons
function initMagneticButtons() {
  if (motion.reduced) return;
  $$(".magnetic").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.28}px, ${y * 0.28}px)`;
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

// Scroll Reveals
function initScrollReveals() {
  const reveals = $$(".reveal");
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
        }
      });
    },
    { threshold: 0.15 }
  );

  reveals.forEach((el, i) => {
    el.style.setProperty("--d", `${(i % 4) * 0.1}s`);
    observer.observe(el);
  });
}

// Dialog Close Handlers
function initDialogHandlers() {
  $$("dialog").forEach((dlg) => {
    $$("[data-close]", dlg).forEach((btn) => {
      btn.addEventListener("click", () => dlg.close());
    });

    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });
  });
}

// Motion Toggle
function initMotionToggle() {
  const btn = $("#motion-toggle");
  if (!btn) return;

  const update = (reduced) => {
    btn.textContent = `Movimiento: ${reduced ? "reducido" : "activo"}`;
    btn.setAttribute("aria-pressed", String(reduced));
  };

  motion.on(update);
  btn.addEventListener("click", () => motion.toggle());
}
