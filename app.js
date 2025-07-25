const input = document.getElementById("imageInput");
const dropZone = document.getElementById("drop-zone");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

dropZone.addEventListener("click", () => input.click());

input.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleImage(file);
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "#888";
});

dropZone.addEventListener("dragleave", () => {
  dropZone.style.borderColor = "#444";
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "#444";
  const file = e.dataTransfer.files[0];
  if (file) handleImage(file);
});

function handleImage(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply Atmos effect
      ctx.filter = "blur(15px) brightness(1.3) saturate(1.2)";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.filter = "none";
      ctx.drawImage(img, 50, 50, 200, 200); // unblurred center portion
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}