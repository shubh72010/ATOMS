const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download');

upload.addEventListener('change', () => {
  const file = upload.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    // Set canvas size to phone wallpaper ratio
    const aspectRatio = 1080 / 2400;
    const maxWidth = 1080;
    const maxHeight = 2400;

    let width = img.width;
    let height = img.height;

    // Resize if too big
    if (width > maxWidth) {
      height = (maxWidth / width) * height;
      width = maxWidth;
    }

    canvas.width = width;
    canvas.height = height;

    // Apply atmosphere style
    ctx.clearRect(0, 0, width, height);
    ctx.filter = 'blur(40px) brightness(1.1) saturate(1.2)';
    ctx.drawImage(img, 0, 0, width, height);

    // Tint overlay
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(0, 0, width, height);
  };

  img.src = URL.createObjectURL(file);
});

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'atØms-wallpaper.png';
  link.href = canvas.toDataURL();
  link.click();
});