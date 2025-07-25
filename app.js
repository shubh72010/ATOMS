document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const imageUpload = document.getElementById('imageUpload');
    const mainCanvas = document.getElementById('mainCanvas');
    const ctx = mainCanvas.getContext('2d');
    const loadingSpinner = document.getElementById('loadingSpinner');

    const blurRadiusSlider = document.getElementById('blurRadius');
    const blurValueSpan = document.getElementById('blurValue');
    const saturationSlider = document.getElementById('saturation');
    const saturationValueSpan = document.getElementById('saturationValue');
    const tintOpacitySlider = document.getElementById('tintOpacity');
    const tintOpacityValueSpan = document.getElementById('tintOpacityValue');
    const tintColorPicker = document.getElementById('tintColor');
    const downloadBtn = document.getElementById('downloadBtn');

    // New element references for Noise and Distortion
    const noiseIntensitySlider = document.getElementById('noiseIntensity');
    const noiseValueSpan = document.getElementById('noiseValue');
    const distortionAmplitudeSlider = document.getElementById('distortionAmplitude');
    const distortionAmplitudeValueSpan = document.getElementById('distortionAmplitudeValue');
    const distortionFrequencySlider = document.getElementById('distortionFrequency');
    const distortionFrequencyValueSpan = document.getElementById('distortionFrequencyValue');

    // New element reference for Preset Button
    const loadPresetBtn = document.getElementById('loadPresetBtn');


    // --- Global Variables ---
    let originalImage = null;
    const MAX_IMAGE_DIMENSION = 1200; // Max dimension for performance optimization

    // --- Utility Function: Show/Hide Loading Spinner ---
    function showLoadingSpinner(show) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }

    // --- Core Image Processing Logic ---
    function applyAtmosphereEffect() {
        if (!originalImage) {
            return; // No image loaded yet
        }

        showLoadingSpinner(true);

        // Clear the canvas before redrawing
        ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

        // Calculate dimensions for drawing, scaling down if too large
        let drawWidth = originalImage.width;
        let drawHeight = originalImage.height;

        if (drawWidth > MAX_IMAGE_DIMENSION || drawHeight > MAX_IMAGE_DIMENSION) {
            if (drawWidth > drawHeight) {
                drawHeight = Math.round(drawHeight * (MAX_IMAGE_DIMENSION / drawWidth));
                drawWidth = MAX_IMAGE_DIMENSION;
            } else {
                drawWidth = Math.round(drawWidth * (MAX_IMAGE_DIMENSION / drawHeight));
                drawHeight = MAX_IMAGE_DIMENSION;
            }
        }

        // Set canvas dimensions
        mainCanvas.width = drawWidth;
        mainCanvas.height = drawHeight;

        // --- Create a temporary canvas for distortion and noise ---
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = mainCanvas.width;
        tempCanvas.height = mainCanvas.height;

        // Draw the original image onto the temporary canvas (at the scaled size)
        tempCtx.drawImage(originalImage, 0, 0, mainCanvas.width, mainCanvas.height);


        // --- Retrieve control values ---
        const blurRadius = parseInt(blurRadiusSlider.value);
        const saturation = parseInt(saturationSlider.value);
        const tintOpacity = parseInt(tintOpacitySlider.value) / 100; // Convert to 0-1 range
        const tintColor = tintColorPicker.value;
        const noiseIntensity = parseInt(noiseIntensitySlider.value);
        const distortionAmplitude = parseInt(distortionAmplitudeSlider.value);
        const distortionFrequency = parseInt(distortionFrequencySlider.value);


        // --- Apply Distortion (Wavy Effect) - Operates on tempCanvas ---
        if (distortionAmplitude > 0) {
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            const originalPixels = new Uint8ClampedArray(data); // Store original pixel data before distortion

            for (let y = 0; y < tempCanvas.height; y++) {
                for (let x = 0; x < tempCanvas.width; x++) {
                    const sourceX = x + distortionAmplitude * Math.sin(y / distortionFrequency);
                    const sourceY = y + distortionAmplitude * Math.sin(x / distortionFrequency);

                    const getPixel = (imgData, sx, sy, width, height) => {
                        sx = Math.max(0, Math.min(width - 1, Math.round(sx)));
                        sy = Math.max(0, Math.min(height - 1, Math.round(sy)));
                        const index = (sy * width + sx) * 4;
                        return [imgData[index], imgData[index + 1], imgData[index + 2], imgData[index + 3]];
                    };

                    const [r, g, b, a] = getPixel(originalPixels, sourceX, sourceY, tempCanvas.width, tempCanvas.height);

                    const destIndex = (y * tempCanvas.width + x) * 4;
                    data[destIndex] = r;
                    data[destIndex + 1] = g;
                    data[destIndex + 2] = b;
                    data[destIndex + 3] = a;
                }
            }
            tempCtx.putImageData(imageData, 0, 0);
        }

        // --- Apply Noise/Grain - Operates on tempCanvas (after distortion, before mainCanvas blur/saturation/tint) ---
        if (noiseIntensity > 0) {
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const offset = Math.random() * noiseIntensity * 2 - noiseIntensity;

                data[i] = Math.max(0, Math.min(255, r + offset));
                data[i + 1] = Math.max(0, Math.min(255, g + offset));
                data[i + 2] = Math.max(0, Math.min(255, b + offset));
            }
            tempCtx.putImageData(imageData, 0, 0);
        }

        // --- Draw the content of the temporary canvas (now distorted and noisy) to the main canvas ---
        ctx.drawImage(tempCanvas, 0, 0);


        // --- Apply Blur using StackBlur.js (modifies mainCanvas directly, after distortion & noise) ---
        if (blurRadius > 0) {
            StackBlur.canvasRGBA(mainCanvas, 0, 0, mainCanvas.width, mainCanvas.height, blurRadius);
        }

        // --- Apply Saturation using CSS filter ---
        ctx.filter = `saturate(${saturation}%)`;
        ctx.drawImage(mainCanvas, 0, 0, mainCanvas.width, mainCanvas.height);
        ctx.filter = 'none';

        // --- Apply Color Tint Overlay ---
        if (tintOpacity > 0) {
            ctx.globalAlpha = tintOpacity;
            ctx.globalCompositeOperation = 'color';
            ctx.fillStyle = tintColor;
            ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }

        // --- Update Download Link ---
        downloadBtn.href = mainCanvas.toDataURL('image/png');
        downloadBtn.download = 'atmosphere-image.png';

        showLoadingSpinner(false);
    }

    // --- Event Listeners ---

    // Image Upload Handler
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            showLoadingSpinner(true);
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    originalImage = img;
                    applyAtmosphereEffect();
                };
                img.onerror = () => {
                    alert('Could not load image. Please ensure it is a valid image file.');
                    showLoadingSpinner(false);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Control Sliders and Color Picker
    blurRadiusSlider.addEventListener('input', () => {
        blurValueSpan.textContent = blurRadiusSlider.value;
        applyAtmosphereEffect();
    });

    saturationSlider.addEventListener('input', () => {
        saturationValueSpan.textContent = `${saturationSlider.value}%`;
        applyAtmosphereEffect();
    });

    tintOpacitySlider.addEventListener('input', () => {
        tintOpacityValueSpan.textContent = `${tintOpacitySlider.value}%`;
        applyAtmosphereEffect();
    });

    tintColorPicker.addEventListener('input', () => {
        applyAtmosphereEffect();
    });

    // Event listeners for Noise and Distortion
    noiseIntensitySlider.addEventListener('input', () => {
        noiseValueSpan.textContent = noiseIntensitySlider.value;
        applyAtmosphereEffect();
    });

    distortionAmplitudeSlider.addEventListener('input', () => {
        distortionAmplitudeValueSpan.textContent = distortionAmplitudeSlider.value;
        applyAtmosphereEffect();
    });

    distortionFrequencySlider.addEventListener('input', () => {
        distortionFrequencyValueSpan.textContent = distortionFrequencySlider.value;
        applyAtmosphereEffect();
    });

    // Event listener for Preset Button - Now reflecting your theory
    loadPresetBtn.addEventListener('click', () => {
        // Preset values adjusted to emphasize stronger initial distortion and noise
        // before blur, based on your theory.
        blurRadiusSlider.value = 35; // Still strong blur, but perhaps slightly less if initial distortion/noise handles some "haze"
        saturationSlider.value = 5; // Very desaturated
        tintOpacitySlider.value = 40; // More noticeable tint
        tintColorPicker.value = "#222222"; // A very dark gray/near black tint for depth
        noiseIntensitySlider.value = 30; // Stronger noise for a more pronounced grain
        distortionAmplitudeSlider.value = 45; // Significantly more distortion ("very much")
        distortionFrequencySlider.value = 2; // Fewer, larger, more apparent waves

        // Update the displayed values
        blurValueSpan.textContent = blurRadiusSlider.value;
        saturationValueSpan.textContent = `${saturationSlider.value}%`;
        tintOpacityValueSpan.textContent = `${tintOpacitySlider.value}%`;
        noiseValueSpan.textContent = noiseIntensitySlider.value;
        distortionAmplitudeValueSpan.textContent = distortionAmplitudeSlider.value;
        distortionFrequencyValueSpan.textContent = distortionFrequencySlider.value;

        // Apply the effects with the new preset values
        applyAtmosphereEffect();
    });


    // --- Initial UI State ---
    // Set initial display values for sliders
    blurValueSpan.textContent = blurRadiusSlider.value;
    saturationValueSpan.textContent = `${saturationSlider.value}%`;
    tintOpacityValueSpan.textContent = `${tintOpacitySlider.value}%`;
    noiseValueSpan.textContent = noiseIntensitySlider.value;
    distortionAmplitudeValueSpan.textContent = distortionAmplitudeSlider.value;
    distortionFrequencyValueSpan.textContent = distortionFrequencySlider.value;
});
