// Intro sequence: A blank sheet folds into a paper plane,
// embodying the core concept: "parte de una hoja en blanco,
// y con dirección e impulso vuela tan lejos como decidas."
import { $, motion } from "./utils.js";

export function initIntro() {
  const intro = $("#intro");
  if (!intro) return;

  const foldL = $("#fold-l");
  const foldR = $("#fold-r");
  const stepText = $("#intro-step");
  const countEl = $("#intro-count");
  const skipBtn = $("#intro-skip");

  let skipped = false;

  const finish = (instant = false) => {
    if (skipped) return;
    skipped = true;
    document.body.classList.remove("is-loading");
    document.body.classList.add("ready");
    if (instant) {
      intro.remove();
    } else {
      intro.classList.add("done");
      setTimeout(() => intro.remove(), 750);
    }
  };

  if (skipBtn) {
    skipBtn.addEventListener("click", () => finish(true));
  }

  // If user prefers reduced motion or has visited in this session, skip immediately
  if (motion.reduced || sessionStorage.getItem("dreamer_intro_seen")) {
    finish(true);
    return;
  }
  sessionStorage.setItem("dreamer_intro_seen", "true");

  const steps = [
    { p: 15, text: "UNA HOJA EN BLANCO" },
    { p: 45, text: "DIRECCIÓN: CADA PLIEGUE CUENTA" },
    { p: 80, text: "IMPULSO: PREPARANDO EL VUELO" },
    { p: 100, text: "NEVER STOP CHASING" },
  ];

  let current = 0;
  const start = performance.now();
  const duration = 2200;

  function frame(now) {
    if (skipped) return;
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / duration);
    current = Math.floor(progress * 100);

    if (countEl) {
      countEl.textContent = String(current).padStart(3, "0");
    }

    const currentStep = steps.slice().reverse().find((s) => current >= s.p) || steps[0];
    if (stepText && stepText.textContent !== currentStep.text) {
      stepText.textContent = currentStep.text;
    }

    const t = progress;
    if (foldL && foldR) {
      if (t < 0.45) {
        const f = t / 0.45;
        foldL.setAttribute(
          "points",
          `-100,-130 ${-f * 50},-130 0,${-130 + f * 90} 0,130 -100,130`
        );
        foldR.setAttribute(
          "points",
          `0,-130 ${f * 50},-130 100,-130 100,130 0,130`
        );
      } else if (t < 0.85) {
        const f = (t - 0.45) / 0.4;
        foldL.setAttribute(
          "points",
          `${-100 + f * 70},${-130 + f * 110} 0,-130 0,130 ${-100 + f * 60},${130 - f * 40}`
        );
        foldR.setAttribute(
          "points",
          `0,-130 ${100 - f * 70},${-130 + f * 110} ${100 - f * 60},${130 - f * 40} 0,130`
        );
      } else {
        const f = (t - 0.85) / 0.15;
        foldL.setAttribute(
          "points",
          `-15,${-20 + f * 10} 0,-130 0,110 ${-40 + f * 10},${90 + f * 10}`
        );
        foldR.setAttribute(
          "points",
          `0,-130 15,${-20 + f * 10} ${40 - f * 10},${90 + f * 10} 0,110`
        );
      }
    }

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      setTimeout(() => finish(false), 200);
    }
  }

  requestAnimationFrame(frame);
}
