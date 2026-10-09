// Epic Takeoff sequence (Creative Technologist implementation).
// 2.5 - 3.5s cinematic vertical takeoff with:
// - Vector cloud layers drifting downwards to create intense climbing sensation.
// - High-speed wind streaks and vapor trails.
// - Mathematical acceleration curve (kinematic climb).
// - Dynamic phase text:
//   1. "Plegando tus alas..."
//   2. "Trazando la ruta de tus sueños..."
//   3. "Despegando hacia la meta..."
import { $, motion } from "./utils.js";
import { showBoardingPass } from "./boardingpass.js";

export function startTakeoff(bookingState) {
  const takeoff = $("#takeoff");
  const canvas = $("#takeoff-canvas");
  const ctx = canvas.getContext("2d");
  const statusEl = $("#takeoff-status");
  const hudAlt = $("#hud-alt");
  const hudSpd = $("#hud-spd");
  const hudDest = $("#hud-dest");
  const hudBar = $("#hud-bar");

  if (!takeoff || !canvas) return;

  takeoff.hidden = false;
  takeoff.classList.remove("out");
  document.body.style.overflow = "hidden";

  if (hudDest) {
    hudDest.textContent = (bookingState.dream || "TUS SUEÑOS").slice(0, 10).toUpperCase();
  }

  // Setup High-DPI Canvas
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Generate Cloud Layers & Wind Streaks
  const windStreaks = [];
  for (let i = 0; i < 90; i++) {
    windStreaks.push({
      x: Math.random() * w,
      y: Math.random() * h,
      length: 50 + Math.random() * 160,
      speed: 15 + Math.random() * 25,
      alpha: 0.15 + Math.random() * 0.45,
      width: 0.8 + Math.random() * 2.0,
    });
  }

  const cloudPuffs = [];
  for (let i = 0; i < 16; i++) {
    cloudPuffs.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: 80 + Math.random() * 180,
      speed: 8 + Math.random() * 14,
      alpha: 0.04 + Math.random() * 0.08,
    });
  }

  let raf = 0;
  let active = true;
  const startTime = performance.now();
  const duration = 3000; // Exact 3.0 seconds

  // Required exact phases
  const phases = [
    { p: 0.0, text: "Plegando tus alas..." },
    { p: 0.35, text: "Trazando la ruta de tus sueños..." },
    { p: 0.70, text: "Despegando hacia la meta..." },
  ];

  function loop(now) {
    if (!active) return;
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);

    // Kinematic Acceleration curve: t^2 for vertical thrust
    const thrust = progress * progress;

    // Live HUD updates
    const currentAlt = Math.floor(progress * 35000);
    const currentSpd = Math.floor(180 + thrust * 420);
    if (hudAlt) hudAlt.textContent = currentAlt.toLocaleString("en-US");
    if (hudSpd) hudSpd.textContent = currentSpd;
    if (hudBar) hudBar.style.transform = `scaleX(${progress})`;

    // Dynamic phase text switch
    const curPhase = phases.slice().reverse().find((ph) => progress >= ph.p) || phases[0];
    if (statusEl && statusEl.textContent !== curPhase.text) {
      statusEl.textContent = curPhase.text;
    }

    // Canvas background fade
    ctx.fillStyle = "rgba(8, 8, 12, 0.32)";
    ctx.fillRect(0, 0, w, h);

    // 1. Draw volumetric ethereal clouds rushing downwards
    for (const c of cloudPuffs) {
      ctx.beginPath();
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.radius);
      grad.addColorStop(0, `rgba(164, 200, 225, ${c.alpha})`);
      grad.addColorStop(1, "rgba(8, 8, 12, 0)");
      ctx.fillStyle = grad;
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();

      // Cloud rushes downward as plane climbs
      c.y += c.speed * (1 + thrust * 2.2);
      if (c.y - c.radius > h) {
        c.y = -c.radius;
        c.x = Math.random() * w;
      }
    }

    // 2. Draw high-speed diagonal wind streaks
    ctx.lineCap = "round";
    for (const s of windStreaks) {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.length * 0.7, s.y + s.length * 0.3);
      ctx.strokeStyle = `rgba(194, 214, 236, ${s.alpha * (0.5 + progress * 0.5)})`;
      ctx.lineWidth = s.width;
      ctx.stroke();

      s.x += s.speed * (1 + thrust * 2.5);
      s.y -= s.speed * 0.35 * (1 + thrust * 2.5);

      if (s.x > w + s.length || s.y < -s.length) {
        s.x = -s.length;
        s.y = Math.random() * h * 1.3;
      }
    }

    // 3. Central Paper Airplane climbing into the heavens
    ctx.save();
    // Plane centers and lifts vertically during takeoff
    const planeX = w * 0.5 + Math.sin(now / 150) * 6;
    const planeY = h * 0.5 - thrust * (h * 0.22) + Math.sin(now / 220) * 8;
    const pitchAngle = -28 + Math.sin(now / 280) * 3; // Climbing angle

    ctx.translate(planeX, planeY);
    ctx.rotate((pitchAngle * Math.PI) / 180);
    const planeScale = 1.3 + progress * 0.4;
    ctx.scale(planeScale, planeScale);

    // Glowing contrails behind wings
    ctx.beginPath();
    ctx.moveTo(-28, 8);
    ctx.lineTo(-140 - progress * 90, 16);
    ctx.strokeStyle = `rgba(164, 200, 225, ${0.4 + progress * 0.5})`;
    ctx.lineWidth = 3.0;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2, 14);
    ctx.lineTo(-110 - progress * 80, 24);
    ctx.strokeStyle = `rgba(229, 229, 234, ${0.3 + progress * 0.4})`;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Pure White origami body with silver/blue shaded facets
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(-35, -24);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#a4c8e1";
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-35, 24);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#e5e5ea";
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-28, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    if (progress < 1) {
      raf = requestAnimationFrame(loop);
    } else {
      active = false;
      takeoff.classList.add("out");
      setTimeout(() => {
        takeoff.hidden = true;
        document.body.style.overflow = "";
        showBoardingPass(bookingState);
      }, 550);
    }
  }

  raf = requestAnimationFrame(loop);
}
