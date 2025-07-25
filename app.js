const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const upload = document.getElementById("upload");

upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw dark base
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Generate abstract blobs
    for (let i = 0; i < 50; i++) {
      drawBlobbyShape(img);
    }

    addNoise();
  };
  img.src = URL.createObjectURL(file);
});

function drawBlobbyShape(img) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const w = 100 + Math.random() * 200;
  const h = 100 + Math.random() * 200;

  // Create blob path
  ctx.beginPath();
  const steps = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < steps; i++) {
    const angle = (Math.PI * 2 * i) / steps;
    const r = (w / 2) * (0.7 + Math.random() * 0.6);
    const sx = x + r * Math.cos(angle);
    const sy = y + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.quadraticCurveTo(x, y, sx, sy);
  }
  ctx.closePath();

  // Get image section
  const imgX = Math.max(0, x - w / 2);
  const imgY = Math.max(0, y - h / 2);
  const imgData = ctx.createImageData(w, h);
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = w;
  tempCanvas.height = h;
  tempCtx.drawImage(img, imgX, imgY, w, h, 0, 0, w, h);

  // Clip and draw
  ctx.save();
  ctx.clip();
  ctx.drawImage(tempCanvas, x - w / 2, y - h / 2);
  ctx.restore();
}

function addNoise() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const rand = (Math.random() - 0.5) * 20;
    imageData.data[i] += rand;     // R
    imageData.data[i + 1] += rand; // G
    imageData.data[i + 2] += rand; // B
  }
  ctx.putImageData(imageData, 0, 0);
}

function download() {
  const link = document.createElement("a");
  link.download = "atøms_wallpaper.png";
  link.href = canvas.toDataURL();
  link.click();
}