const upload = document.getElementById("upload");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const downloadBtn = document.getElementById("download");

upload.addEventListener("change", handleImage);

function handleImage(e) {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    processImage(img);
  };
  img.src = URL.createObjectURL(file);
}

function processImage(img) {
  // Draw original
  ctx.drawImage(img, 0, 0);

  const shapeCount = 25;
  for (let i = 0; i < shapeCount; i++) {
    drawBlobEffect();
  }

  addGrain();
}

function drawBlobEffect() {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const radius = 100 + Math.random() * 150;

  const path = new Path2D();
  const points = 6 + Math.floor(Math.random() * 5);
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius * (0.8 + Math.random() * 0.4);
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.closePath();

  // Sample color under center
  const sample = ctx.getImageData(x, y, 1, 1).data;
  const [r, g, b] = sample;

  // Create a darkened fill
  const fillStyle = `rgba(${r * 0.6}, ${g * 0.6}, ${b * 0.6}, 0.4)`;

  ctx.save();
  ctx.filter = "blur(12px)";
  ctx.fillStyle = fillStyle;
  ctx.fill(path);
  ctx.restore();
}

function addGrain() {
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = canvas.width;
  grainCanvas.height = canvas.height;
  const grainCtx = grainCanvas.getContext("2d");

  const grainData = grainCtx.createImageData(grainCanvas.width, grainCanvas.height);
  for (let i = 0; i < grainData.data.length; i += 4) {
    const val = Math.random() * 30;
    grainData.data[i] = val;
    grainData.data[i + 1] = val;
    grainData.data[i + 2] = val;
    grainData.data[i + 3] = 20;
  }

  grainCtx.putImageData(grainData, 0, 0);
  ctx.drawImage(grainCanvas, 0, 0);
}

downloadBtn.onclick = () => {
  const link = document.createElement("a");
  link.download = "atØms-wallpaper.png";
  link.href = canvas.toDataURL();
  link.click();
};