// "Lanza tu sueño": Interactive interactive dream launcher.
// Folds user's goal into a paper airplane and launches it into the virtual sky.
import { $, flyPlane, toast } from "./utils.js";
import { state } from "./showcase.js";

export function initLaunch() {
  const form = $("#launch-form");
  const input = $("#dream-input");
  const btn = $("#launch-btn");
  const sky = $("#launch-sky");
  const status = $("#launch-status");
  const dreamField = $("#dream-field");
  const passDest = $("#pass-dest");

  if (!form || !input || !sky) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dream = input.value.trim();
    if (!dream) return;

    state.dream = dream;
    if (dreamField) dreamField.value = dream;
    if (passDest) passDest.textContent = dream.toUpperCase();

    // Trigger button launch animation
    btn.classList.add("launching");
    setTimeout(() => btn.classList.remove("launching"), 700);

    // Launch physical paper plane into the sky
    const skyRect = sky.getBoundingClientRect();
    const from = { x: skyRect.width * 0.35, y: skyRect.height * 0.85 };
    const to = { x: skyRect.width * 0.95, y: skyRect.height * -0.1 };

    flyPlane(sky, {
      from,
      to,
      label: dream,
      duration: 3200,
      arc: -180,
      size: 44,
    });

    if (status) {
      status.textContent = `«${dream}» ha despegado hacia tus sueños.`;
    }

    toast(`Destino fijado: ${dream}`);
    input.value = "";
  });
}
