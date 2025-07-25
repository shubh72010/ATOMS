const upload = document.getElementById('upload'),
      btn = document.getElementById('generate'),
      canvas = document.getElementById('canvas'),
      dl = document.getElementById('download'),
      center = document.getElementById('centerFocus'),
      ctx = canvas.getContext('2d');
let img;

upload.addEventListener('change', e => {
  img = new Image();
  img.onload = () => {
    const scale = img.width>1080 ? 1080/img.width : 1;
    canvas.width = Math.round(img.width*scale);
    canvas.height = Math.round(img.height*scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = URL.createObjectURL(e.target.files[0]);
});

btn.addEventListener('click', () => {
  if (!img) return;
  const w=canvas.width, h=canvas.height;
  const cx=w/2, cy=h/2, outer=Math.hypot(cx, cy);

  ctx.clearRect(0,0,w,h);
  ctx.filter = `blur(${Math.round(w*0.05)}px) brightness(108%) saturate(60%)`;
  ctx.drawImage(img, 0, 0, w, h);
  ctx.filter = 'none';

  const grad = ctx.createRadialGradient(cx, cy, outer*0.4, cx, cy, outer);
  grad.addColorStop(0,'rgba(255,255,255,0)');
  grad.addColorStop(1,'rgba(255,255,255,0.25)');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,w,h);

  if (center.checked) {
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(img, 0, 0, w, h);
    const o = tctx.getImageData(0,0,w,h);
    const b = ctx.getImageData(0,0,w,h);
    const od = o.data, bd = b.data;
    for (let y=0; y<h; y++) {
      for (let x=0; x<w; x++) {
        const d = Math.hypot(x-cx, y-cy);
        const t = Math.max(0, Math.min(1,(outer*0.4 - d)/(outer*0.4)));
        if (t>0) {
          const idx = (y*w + x)*4;
          bd[idx]   = bd[idx]*(1-t) + od[idx]*t;
          bd[idx+1] = bd[idx+1]*(1-t) + od[idx+1]*t;
          bd[idx+2] = bd[idx+2]*(1-t) + od[idx+2]*t;
        }
      }
    }
    ctx.putImageData(b,0,0);
  }

  dl.href = canvas.toDataURL('image/png');
  dl.download = 'atmos_wallpaper.png';
  dl.style.display = 'inline-block';
});