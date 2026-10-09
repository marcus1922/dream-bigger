// Journey: Scroll storytelling where an airplane follows an aerodynamic
// flight path across the sky while narrative chapters reveal progressively.
import { $, $$, clamp, motion } from "./utils.js";

export function initJourney() {
  const section = $("#journey");
  const guide = $("#journey-guide");
  const trail = $("#journey-trail");
  const plane = $("#journey-plane");
  const bar = $("#journey-bar");
  const chapters = $$(".chapter");

  if (!section || !guide || !trail || !plane) return;

  let totalLength = 0;
  try {
    totalLength = guide.getTotalLength();
    trail.style.strokeDasharray = `${totalLength} ${totalLength}`;
    trail.style.strokeDashoffset = totalLength;
  } catch (e) {
    totalLength = 1600;
  }

  function onScroll() {
    if (motion.reduced) return;

    const rect = section.getBoundingClientRect();
    const scrollDist = section.offsetHeight - window.innerHeight;
    if (scrollDist <= 0) return;

    // Progress from 0 to 1
    const p = clamp(-rect.top / scrollDist, 0, 1);
    section.style.setProperty("--jp", p.toFixed(3));

    // Update progress bar
    if (bar) bar.style.transform = `scaleX(${p})`;

    // Path draw
    const currentLength = p * totalLength;
    trail.style.strokeDashoffset = Math.max(0, totalLength - currentLength);

    // Position plane along SVG curve
    try {
      const pt = guide.getPointAtLength(currentLength);
      // Sample next point for tangent heading
      const nextPt = guide.getPointAtLength(Math.min(totalLength, currentLength + 4));
      const angle = (Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * 180) / Math.PI;

      // Scale coordinates from SVG viewBox (1600 x 900) to actual SVG container size
      const svgRect = guide.ownerSVGElement.getBoundingClientRect();
      const scaleX = svgRect.width / 1600;
      const scaleY = svgRect.height / 900;

      const screenX = pt.x * scaleX;
      const screenY = pt.y * scaleY;

      plane.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) rotate(${angle}deg)`;
    } catch {}

    // Activate chapters (4 chapters across 0..1 progress)
    const chIdx = Math.min(chapters.length - 1, Math.floor(p * chapters.length));
    chapters.forEach((ch, idx) => {
      ch.classList.toggle("active", idx === chIdx);
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
}
