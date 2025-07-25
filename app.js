const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const applyBtn = document.getElementById('apply');
const download = document.getElementById('download');
const centerFlag = document.getElementById('centerFocus');

let img;

upload.addEventListener('change', e => {
  img = new Image();
  img.onload = () => {
    const maxW = 1080;
    const scale = img.width > maxW ? maxW / img.width : 1;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = URL.createObjectURL(e.target.files[0]);
});

applyBtn.addEventListener('click', () => {
  if (!img) return;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);

  // Draw blurred base
  ctx.filter = `blur(${w * 0.04}px) brightness(105%) saturate(70%)`;
  ctx.drawImage(img, 0, 0, w, h);

  // Reset filter
  ctx.filter = 'none';

  // Soft radial haze
  const cx = w/2, cy = h/2;
  const radius = Math.sqrt(cx*cx + cy*cy);
  const grad = ctx.createRadialGradient(cx, cy, radius*0.3, cx, cy, radius);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(255,255,255,0.3)');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,w,h);

  // Optional center clarity
  if (centerFlag.checked) {
    const orig = document.createElement('canvas');
    orig.width = w; orig.height = h;
    const octx = orig.getContext('2d');
    octx.drawImage(img, 0, 0, w, h);

    const origData = octx.getImageData(0,0,w,h);
    const blurredData = ctx.getImageData(0,0,w,h);
    const dataB = blurredData.data;
    const dataO = origData.data;

    for (let y=0; y<h; y++) {
      for (let x=0; x<w; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        let t = (radius*0.5 - dist) / (radius*0.5);
        if (t>0) {
          const idx = (y*w + x)*4;
          dataB[idx]   = dataB[idx]   * (1 - t) + dataO[idx]   * t;
          dataB[idx+1] = dataB[idx+1] * (1 - t) + dataO[idx+1] * t;
          dataB[idx+2] = dataB[idx+2] * (1 - t) + dataO[idx+2] * t;
        }
      }
    }
    ctx.putImageData(blurredData, 0, 0);
  }

  download.href = canvas.toDataURL('image/png');
  download.download = 'atmos_wallpaper.png';
  download.style.display = 'inline-block';
});