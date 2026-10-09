export let exportOpenCheckin = () => {};

// Check-in flow: Multi-step airport terminal booking experience
// with live baggage ticket summary, route progress bar, and validation.
import { $, $$, toast } from "./utils.js";
import { state } from "./showcase.js";
import { startTakeoff } from "./takeoff.js";

export function initCheckin() {
  const checkinDialog = $("#checkin");
  const form = $("#checkin-form");
  const steps = $$(".step", form);
  const backBtn = $("#step-back");
  const nextBtn = $("#step-next");
  const nextLabel = $("#step-next-label");
  const routeFill = $("#route-fill");
  const routePlane = $("#route-plane");
  const routeLabels = $$("#route-labels li");
  const formError = $("#form-error");

  const qtyMinus = $("#qty-minus");
  const qtyPlus = $("#qty-plus");
  const qtyOutput = $("#qty");
  const sumSub = $("#sum-sub");
  const sumShip = $("#sum-ship");
  const sumTotal = $("#sum-total");

  let currentStep = 0;

  function setStep(idx) {
    currentStep = idx;

    steps.forEach((step, i) => {
      const active = i === idx;
      step.classList.toggle("active", active);
      step.disabled = !active;
    });

    routeLabels.forEach((li, i) => {
      li.classList.toggle("active", i <= idx);
    });

    // Progress percentage
    const progress = idx / (steps.length - 1);
    checkinDialog.style.setProperty("--rp", progress.toFixed(2));
    if (routeFill) routeFill.style.transform = `scaleX(${progress})`;

    // Action buttons
    if (backBtn) backBtn.hidden = idx === 0;
    if (nextLabel) {
      nextLabel.textContent = idx === steps.length - 1 ? "CONFIRMAR VUELO" : "CONTINUAR";
    }

    if (formError) formError.hidden = true;
  }

  function validateCurrentStep() {
    const cur = steps[currentStep];
    const inputs = $$("input[required]", cur);
    for (const inp of inputs) {
      if (!inp.checkValidity()) {
        inp.reportValidity();
        return false;
      }
    }
    return true;
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (currentStep > 0) setStep(currentStep - 1);
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateCurrentStep()) return;

      if (currentStep < steps.length - 1) {
        setStep(currentStep + 1);
      } else {
        // Collect form data into state
        const fd = new FormData(form);
        state.passenger = String(fd.get("passenger") || "Marcus / Dreamer").trim();
        state.email = String(fd.get("email") || "marcus.dreamer@atelier.com").trim();
        state.dream = String(fd.get("dream") || state.dream || "TUS SUEÑOS / YOUR HIGHEST POTENTIAL").trim();
        state.address = String(fd.get("address") || "").trim();
        state.city = String(fd.get("city") || "").trim();
        state.postal = String(fd.get("postal") || "").trim();
        state.shipMethod = String(fd.get("ship") || "std");
        state.paymentMethod = String(fd.get("payment") || "apple");

        checkinDialog.close();
        startTakeoff(state);
      }
    });
  }

  // Baggage quantity and pricing sync
  function updatePricing() {
    const subtotal = state.unitPrice * state.qty;
    const shipping = state.shipMethod === "exp" ? 190 : 0;
    const total = subtotal + shipping;

    if (qtyOutput) qtyOutput.textContent = state.qty;
    if (sumSub) sumSub.textContent = `$${subtotal.toLocaleString("en-US")}`;
    if (sumShip) sumShip.textContent = shipping ? `$${shipping} MXN` : "Cortesía";
    if (sumTotal) sumTotal.textContent = `$${total.toLocaleString("en-US")} MXN`;
  }

  if (qtyMinus) {
    qtyMinus.addEventListener("click", () => {
      if (state.qty > 1) {
        state.qty--;
        updatePricing();
      }
    });
  }

  if (qtyPlus) {
    qtyPlus.addEventListener("click", () => {
      if (state.qty < 5) {
        state.qty++;
        updatePricing();
      }
    });
  }

  // Shipping method change listener
  $$('input[name="ship"]', form).forEach((r) => {
    r.addEventListener("change", (e) => {
      state.shipMethod = e.target.value;
      updatePricing();
    });
  });

  // Open checkin
  exportOpenCheckin = () => {
    setStep(0);
    updatePricing();
    const bagBtn = $("#bag");
    if (bagBtn) {
      bagBtn.classList.add("has", "bump");
      setTimeout(() => bagBtn.classList.remove("bump"), 500);
      $("#bag-count").textContent = String(state.qty);
    }
    checkinDialog.showModal();
  };

  const claimBtn = $("#claim");
  if (claimBtn) claimBtn.addEventListener("click", exportOpenCheckin);

  const heroCta = $("#hero-cta");
  if (heroCta) {
    heroCta.addEventListener("click", (e) => {
      e.preventDefault();
      $("#collection")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  const bagBtn = $("#bag");
  if (bagBtn) bagBtn.addEventListener("click", exportOpenCheckin);
}
