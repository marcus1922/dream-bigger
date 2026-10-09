// Boarding Pass to Your Dreams (Collectible Haute Streetwear Ticket).
// Features:
// - Destination: "TUS SUEÑOS / YOUR HIGHEST POTENTIAL"
// - Flight: "DRM-2026"
// - Passenger: Marcus / Dreamer
// - Interactive dynamic QR code
// - Holographic foil iridescent light reflection on 3D tilt
// - High-resolution 2X PNG export with clean typography
import QRCode from "qrcode";
import { $, clamp, toast } from "./utils.js";

let currentPassData = null;

export async function showBoardingPass(booking) {
  const dialog = $("#pass-view");
  const pass = $("#pass");
  const qrCanvas = $("#qr");
  if (!dialog || !pass) return;

  const passId = `DRM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).toUpperCase();

  const passengerName = booking.passenger?.trim() || "Marcus / Dreamer";
  const dreamDestination = (booking.dream?.trim() || "TUS SUEÑOS / YOUR HIGHEST POTENTIAL").toUpperCase();

  currentPassData = {
    id: passId,
    passenger: passengerName,
    destination: dreamDestination,
    piece: `${booking.colorName || "Midnight Onyx"} · Talla ${booking.size || "M"}`,
    date: dateStr,
    flight: "DRM-2026",
    seat: "01A",
    gate: "∞",
  };

  // Set fields on the DOM
  $("#pass-id").textContent = currentPassData.id;
  $("#pass-name").textContent = currentPassData.passenger;
  $("#pass-dest").textContent = currentPassData.destination;
  $("#pass-piece").textContent = currentPassData.piece;
  $("#pass-date").textContent = currentPassData.date;

  // Render barcode pattern
  const barcodeContainer = $("#pass-barcode");
  if (barcodeContainer) {
    barcodeContainer.innerHTML = "";
    const pattern = "101100111010110100111010101110110101001110101100111010110100111010101110110";
    for (let i = 0; i < pattern.length; i++) {
      const bar = document.createElement("i");
      bar.style.width = pattern[i] === "1" ? `${1.5 + (i % 3) * 0.8}px` : "2.5px";
      bar.style.opacity = pattern[i] === "1" ? "0.9" : "0";
      barcodeContainer.appendChild(bar);
    }
  }

  // Dynamic QR code generation
  try {
    await QRCode.toCanvas(
      qrCanvas,
      JSON.stringify({
        airline: "DREAMER",
        pass: currentPassData.id,
        passenger: currentPassData.passenger,
        flight: currentPassData.flight,
        destination: currentPassData.destination,
        motto: "NEVER STOP CHASING",
      }),
      {
        width: 170,
        margin: 1,
        color: {
          dark: "#08080c",
          light: "#e5e3db",
        },
        errorCorrectionLevel: "M",
      }
    );
  } catch (err) {
    console.warn("QR creation error:", err);
  }

  dialog.showModal();

  // 3D Holographic Foil Tilt Interaction
  setupPassTilt(pass);

  // Download & Share Setup
  setupActions(pass, currentPassData);
}

function setupPassTilt(pass) {
  pass.addEventListener("pointermove", (e) => {
    const rect = pass.getBoundingClientRect();
    const px = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const py = clamp((e.clientY - rect.top) / rect.height, 0, 1);

    const rx = (py - 0.5) * -14;
    const ry = (px - 0.5) * 16;

    pass.style.setProperty("--prx", `${rx.toFixed(2)}deg`);
    pass.style.setProperty("--pry", `${ry.toFixed(2)}deg`);
    pass.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    pass.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
  });

  pass.addEventListener("pointerleave", () => {
    pass.style.setProperty("--prx", "0deg");
    pass.style.setProperty("--pry", "0deg");
  });
}

function setupActions(passElement, data) {
  const downloadBtn = $("#download");

  if (downloadBtn) {
    downloadBtn.onclick = async () => {
      downloadBtn.disabled = true;
      try {
        await generatePassPNG(data);
        toast("Boarding Pass descargado con éxito");
      } catch (e) {
        console.error(e);
        toast("Error al exportar pase");
      } finally {
        downloadBtn.disabled = false;
      }
    };
  }
}

// Export 2x high-resolution Boarding Pass Ticket PNG
async function generatePassPNG(data) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const scale = 2;
  const width = 1100 * scale;
  const height = 500 * scale;

  canvas.width = width;
  canvas.height = height;
  ctx.scale(scale, scale);

  // Background Ticket Paper
  ctx.fillStyle = "#edebe4";
  ctx.fillRect(0, 0, 1100, 500);

  // Perforation dashed line
  ctx.strokeStyle = "rgba(12, 13, 18, 0.22)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(820, 0);
  ctx.lineTo(820, 500);
  ctx.stroke();
  ctx.setLineDash([]);

  // Perforation circular notches
  ctx.fillStyle = "#080808";
  ctx.beginPath();
  ctx.arc(820, 0, 18, 0, Math.PI * 2);
  ctx.arc(820, 500, 18, 0, Math.PI * 2);
  ctx.fill();

  // Header
  ctx.fillStyle = "#0c0d12";
  ctx.font = "800 32px Dreamer, sans-serif";
  ctx.fillText("DREAMER® Airlines", 48, 56);

  ctx.fillStyle = "#6e717c";
  ctx.font = "11px sans-serif";
  ctx.fillText("BOARDING PASS TO YOUR DREAMS", 470, 48);

  // Flight Route
  ctx.fillStyle = "#0c0d12";
  ctx.font = "800 70px Dreamer, sans-serif";
  ctx.fillText("NOW", 48, 150);
  ctx.fillText("DRM", 610, 150);

  ctx.fillStyle = "#6e717c";
  ctx.font = "12px sans-serif";
  ctx.fillText("DONDE ESTÁS HOY", 48, 174);
  ctx.fillText("TUS SUEÑOS", 610, 174);

  // Route dashed connector & plane
  ctx.strokeStyle = "#475979";
  ctx.lineWidth = 1.8;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(225, 130);
  ctx.lineTo(570, 130);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#475979";
  ctx.beginPath();
  ctx.moveTo(400, 130);
  ctx.lineTo(385, 122);
  ctx.lineTo(390, 130);
  ctx.lineTo(385, 138);
  ctx.closePath();
  ctx.fill();

  // Destination
  ctx.fillStyle = "#6e717c";
  ctx.font = "11px sans-serif";
  ctx.fillText("DESTINO", 48, 226);

  ctx.fillStyle = "#1e2b44";
  ctx.font = "italic 28px Editorial, Georgia, serif";
  ctx.fillText(data.destination.slice(0, 40), 48, 264);

  // Details Row 1
  const row1 = [
    { label: "PASAJERO", val: data.passenger, x: 48 },
    { label: "VUELO", val: data.flight, x: 260 },
    { label: "CLASE", val: "Dreamer First", x: 440 },
    { label: "EMBARQUE", val: "Inmediato", x: 620 },
  ];
  row1.forEach((f) => {
    ctx.fillStyle = "#6e717c";
    ctx.font = "10px sans-serif";
    ctx.fillText(f.label, f.x, 320);

    ctx.fillStyle = "#0c0d12";
    ctx.font = "bold 17px sans-serif";
    ctx.fillText(f.val, f.x, 344);
  });

  // Details Row 2
  const row2 = [
    { label: "PIEZA", val: data.piece, x: 48 },
    { label: "PUERTA", val: data.gate, x: 340 },
    { label: "ASIENTO", val: data.seat, x: 470 },
    { label: "FECHA", val: data.date, x: 610 },
  ];
  row2.forEach((f) => {
    ctx.fillStyle = "#6e717c";
    ctx.font = "10px sans-serif";
    ctx.fillText(f.label, f.x, 396);

    ctx.fillStyle = "#0c0d12";
    ctx.font = "bold 17px sans-serif";
    ctx.fillText(f.val, f.x, 420);
  });

  // Bottom barcode simulation
  ctx.fillStyle = "#0c0d12";
  for (let i = 0; i < 62; i++) {
    const barW = (i % 3 === 0 ? 3 : 1.5);
    ctx.fillRect(48 + i * 11, 448, barW, 26);
  }

  // Right Stub details
  const qrSource = $("#qr");
  if (qrSource) {
    ctx.drawImage(qrSource, 860, 42, 180, 180);
  }

  ctx.fillStyle = "#0c0d12";
  ctx.font = "800 24px Dreamer, sans-serif";
  ctx.fillText("NEVER", 860, 270);
  ctx.fillText("STOP", 860, 298);
  ctx.fillText("CHASING.", 860, 326);

  ctx.fillStyle = "#6e717c";
  ctx.font = "12px sans-serif";
  ctx.fillText(data.id, 860, 370);
  ctx.fillText("Pase coleccionable oficial.", 860, 430);

  // Trigger Download
  const link = document.createElement("a");
  link.download = `DREAMER-BOARDING-PASS-${data.id}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
