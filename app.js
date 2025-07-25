window.addEventListener('DOMContentLoaded', () => {
  const upload = document.getElementById('upload');
  const canvas = document.getElementById('canvas');
  const downloadLink = document.getElementById('downloadLink');
  const centerCheckbox = document.getElementById('centerFocus');
  const ctx = canvas.getContext('2d');

  upload.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => processImage(img);
    img.src = URL.createObjectURL(file);
  });

  function processImage(img) {
    // Resize image if too large (max width = 1080px for performance)
    const maxWidth = 1080;
    let scale = 1;
    if (img.width > maxWidth) {
      scale = maxWidth / img.width;
    }
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    canvas.width = w;
    canvas.height = h;

    // Draw original image onto canvas
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    // Get original image data
    const origData = ctx.getImageData(0, 0, w, h);

    // Apply atmosphere effect: blur, brightness, saturation
    ctx.filter = `blur(${Math.round(w * 0.06)}px) brightness(115%) saturate(65%)`;
    ctx.drawImage(img, 0, 0, w, h);
    ctx.filter = 'none';

    // Overlay a white radial gradient for haze
    const cx = w/2, cy = h/2;
    const outer = Math.sqrt(w*w + h*h) / 2;
    const grad = ctx.createRadialGradient(cx, cy, h*0.2, cx, cy, outer);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(255,255,255,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Optional: blend in original (sharp) image at center
    if (centerCheckbox.checked) {
      const blurredData = ctx.getImageData(0, 0, w, h);
      const orig = origData.data;
      const blur = blurredData.data;
      const radius = outer * 0.7; // radius where original fades to blur
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx*dx + dy*dy);
          let t = (radius - dist) / radius;
          if (t > 0) {
            if (t > 1) t = 1;
            const idx = (y * w + x) * 4;
            // Linear blend original and blurred based on t
            blur[idx]   = blur[idx]   * (1 - t) + orig[idx]   * t;
            blur[idx+1] = blur[idx+1] * (1 - t) + orig[idx+1] * t;
            blur[idx+2] = blur[idx+2] * (1 - t) + orig[idx+2] * t;
            // alpha stays 255
          }
        }
      }
      ctx.putImageData(blurredData, 0, 0);
    }

    // Show download link
    downloadLink.href = canvas.toDataURL('image/png');
    downloadLink.download = 'atmosphere_wallpaper.png';
    downloadLink.style.display = 'inline-block';
  }
});