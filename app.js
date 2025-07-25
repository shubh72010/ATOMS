const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const download = document.getElementById('download');
let img, anim;

upload.addEventListener('change', () => {
  const file = upload.files[0]; if (!file) return;
  img = new Image();
  img.onload = initAnimation;
  img.src = URL.createObjectURL(file);
});

function initAnimation(){
  const ratio = img.width / img.height;
  const width = 1080;
  const height = width / ratio;
  canvas.width = width; canvas.height = height;
  let scale = 1.0;
  cancelAnimationFrame(anim);
  function drawFrame(){
    scale += 0.0004;
    ctx.setTransform(scale, 0, 0, scale, width*(1-scale)/2, height*(1-scale)/2);
    ctx.filter = 'blur(40px) brightness(1.1) saturate(1.2)';
    ctx.drawImage(img, 0, 0, width, height);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, 0, width, height);
    anim = requestAnimationFrame(drawFrame);
  }
  drawFrame();
}

download.addEventListener('click', ()=>{
  cancelAnimationFrame(anim);
  const a = document.createElement('a');
  a.download = 'atom­s-wallpaper.png';
  a.href = canvas.toDataURL();
  a.click();
});