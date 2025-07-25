const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  generateAtmosphere();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

function generateAtmosphere() {
  const { width, height } = canvas;

  // Fill base background
  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(0, 0, width, height);

  // Generate abstract blobs
  for (let i = 0; i < 25; i++) {
    drawBlob({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 80 + Math.random() * 100,
      color: getRandomDarkColor(),
      alpha: 0.2 + Math.random() * 0.4
    });
  }

  addGrain();
}

function drawBlob({ x, y, radius, color, alpha }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();

  const points = 6 + Math.floor(Math.random() * 4);
  const step = (Math.PI * 2) / points;

  for (let i = 0; i < points; i++) {
    const angle = i * step;
    const r = radius * (0.7 + Math.random() * 0.6);
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.quadraticCurveTo(0, 0, px, py);
    }
  }

  ctx.closePath();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function getRandomDarkColor() {
  const base = 16 + Math.floor(Math.random() * 32); // keep it dark
  return `rgb(${base}, ${base}, ${base + Math.floor(Math.random() * 20)})`;
}

function addGrain() {
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 12;
    data[i] += grain;
    data[i + 1] += grain;
    data[i + 2] += grain;
  }

  ctx.putImageData(imageData, 0, 0);
}