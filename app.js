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

        // --- Create a temporary canvas for distortion (and as source for other effects) ---
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


        // --- Apply Distortion (Wavy Effect) ---
        if (distortionAmplitude > 0) {
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            const originalPixels = new Uint8ClampedArray(data); // Store original pixel data before distortion

            for (let y = 0; y < tempCanvas.height; y++) {
                for (let x = 0; x < tempCanvas.width; x++) {
                    // Calculate distorted source coordinates
                    // Use Math.sin for a wavy effect. Adjust frequency based on slider.
                    // Amplitude scales the wave intensity.
                    const sourceX = x + distortionAmplitude * Math.sin(y / distortionFrequency);
                    const sourceY = y + distortionAmplitude * Math.sin(x / distortionFrequency);

                    // Helper to get pixel data safely (with clamping and rounding)
                    const getPixel = (imgData, sx, sy, width, height) => {
                        sx = Math.max(0, Math.min(width - 1, Math.round(sx)));
                        sy = Math.max(0, Math.min(height - 1, Math.round(sy)));
                        const index = (sy * width + sx) * 4;
                        return [imgData[index], imgData[index + 1], imgData[index + 2], imgData[index + 3]];
                    };

                    const [r, g, b, a] = getPixel(originalPixels, sourceX, sourceY, tempCanvas.width, tempCanvas.height);

                    // Set the pixel on the current imageData (which will be put back on tempCtx)
                    const destIndex = (y * tempCanvas.width + x) * 4;
                    data[destIndex] = r;
                    data[destIndex + 1] = g;
                    data[destIndex + 2] = b;
                    data[destIndex + 3] = a;
                }
            }
            tempCtx.putImageData(imageData, 0, 0); // Put the distorted image data back onto the temporary canvas
        }

        // --- Draw the content of the temporary canvas to the main canvas ---
        // All subsequent effects (blur, saturation, tint, noise) will be applied to this distorted image.
        ctx.drawImage(tempCanvas, 0, 0);


        // --- Apply Blur using StackBlur.js (modifies mainCanvas directly) ---
        if (blurRadius > 0) {
            StackBlur.canvasRGBA(mainCanvas, 0, 0, mainCanvas.width, mainCanvas.height, blurRadius);
        }

        // --- Apply Saturation using CSS filter ---
        // Redraw the main canvas content onto itself to apply the filter
        ctx.filter = `saturate(${saturation}%)`;
        ctx.drawImage(mainCanvas, 0, 0, mainCanvas.width, mainCanvas.height);
        ctx.filter = 'none'; // Reset filter immediately after applying to prevent affecting tint/noise

        // --- Apply Color Tint Overlay ---
        if (tintOpacity > 0) {
            ctx.globalAlpha = tintOpacity; // Set the opacity for the tint layer
            ctx.globalCompositeOperation = 'color'; // Blending mode for tinting

            ctx.fillStyle = tintColor; // Set the tint color
            ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height); // Draw tint rectangle over entire canvas

            // IMPORTANT: Reset globalCompositeOperation and globalAlpha immediately!
            ctx.globalCompositeOperation = 'source-over'; // Reset to default
            ctx.globalAlpha = 1; // Reset to full opacity
        }

        // --- Apply Noise/Grain ---
        if (noiseIntensity > 0) {
            const imageData = ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
            const data = imageData.data; // This is a reference to the pixel data

            for (let i = 0; i < data.length; i += 4) {
                // Only modify RGB channels, not alpha
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Generate random offset for each channel
                const offset = Math.random() * noiseIntensity * 2 - noiseIntensity; // Random value between -intensity and +intensity

                data[i] = Math.max(0, Math.min(255, r + offset));     // Red
                data[i + 1] = Math.max(0, Math.min(255, g + offset)); // Green
                data[i + 2] = Math.max(0, Math.min(255, b + offset)); // Blue
            }
            ctx.putImageData(imageData, 0, 0); // Put the modified pixel data back
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

    // New event listeners for Noise and Distortion
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


    // --- Initial UI State ---
    // Set initial display values for sliders
    blurValueSpan.textContent = blurRadiusSlider.value;
    saturationValueSpan.textContent = `${saturationSlider.value}%`;
    tintOpacityValueSpan.textContent = `${tintOpacitySlider.value}%`;
    noiseValueSpan.textContent = noiseIntensitySlider.value;
    distortionAmplitudeValueSpan.textContent = distortionAmplitudeSlider.value;
    distortionFrequencyValueSpan.textContent = distortionFrequencySlider.value;
});
