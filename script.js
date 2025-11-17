// Aspect Ratio Presets
const RATIO_PRESETS = [
    { name: '1:1', width: 1, height: 1, label: 'Square' },
    { name: '4:3', width: 4, height: 3, label: 'Standard' },
    { name: '3:4', width: 3, height: 4, label: 'Portrait' },
    { name: '16:9', width: 16, height: 9, label: 'HD' },
    { name: '9:16', width: 9, height: 16, label: 'Vertical' },
    { name: '21:9', width: 21, height: 9, label: 'Cinematic' },
    { name: '3:2', width: 3, height: 2, label: 'Photo' },
    { name: '2:3', width: 2, height: 3, label: 'Portrait Photo' }
];

// Pixel Dimension Presets
const PIXEL_PRESETS = [
    { label: '1920×1080', width: 1920, height: 1080 },
    { label: '1080×1920', width: 1080, height: 1920 },
    { label: '1280×720', width: 1280, height: 720 },
    { label: '2560×1440', width: 2560, height: 1440 },
    { label: '3840×2160', width: 3840, height: 2160 },
    { label: '1080×1080', width: 1080, height: 1080 },
    { label: '1200×1200', width: 1200, height: 1200 },
    { label: '1440×1080', width: 1440, height: 1080 }
];

// State
let currentRatio = null;
let isUpdating = false;

// DOM Elements
const widthPx = document.getElementById('widthPx');
const heightPx = document.getElementById('heightPx');
const widthSlider = document.getElementById('widthSlider');
const sliderValue = document.getElementById('sliderValue');
const swapBtn = document.getElementById('swapBtn');
const ratioWidth = document.getElementById('ratioWidth');
const ratioHeight = document.getElementById('ratioHeight');
const applyCustomRatio = document.getElementById('applyCustomRatio');
const customMultiplier = document.getElementById('customMultiplier');
const applyCustomMultiplier = document.getElementById('applyCustomMultiplier');

// Initialize
function init() {
    renderPresetRatios();
    renderPixelPresets();
    attachEventListeners();
    attachMultiplierListeners();
    setDefaultValues();
}

function renderPresetRatios() {
    const container = document.getElementById('presetRatios');
    container.innerHTML = '';
    
    RATIO_PRESETS.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.innerHTML = `<div>${preset.name}</div><div style="font-size: 0.8rem; color: var(--text-muted);">${preset.label}</div>`;
        btn.addEventListener('click', () => selectRatioPreset(preset, btn));
        container.appendChild(btn);
    });
}

function renderPixelPresets() {
    const container = document.getElementById('pixelPresets');
    container.innerHTML = '';
    
    PIXEL_PRESETS.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'preset-dim-btn';
        btn.textContent = preset.label;
        btn.addEventListener('click', () => applyPixelPreset(preset));
        container.appendChild(btn);
    });
}

function attachEventListeners() {
    widthPx.addEventListener('input', handleWidthInput);
    heightPx.addEventListener('input', handleHeightInput);
    widthSlider.addEventListener('input', handleSliderInput);
    swapBtn.addEventListener('click', swapDimensions);
    ratioWidth.addEventListener('input', handleCustomRatioInput);
    ratioHeight.addEventListener('input', handleCustomRatioInput);
    applyCustomRatio.addEventListener('click', applyCustomRatioClick);
}

function attachMultiplierListeners() {
    document.querySelectorAll('.multiplier-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const multiplier = parseFloat(btn.dataset.multiplier);
            applyMultiplier(multiplier);
        });
    });
    
    applyCustomMultiplier.addEventListener('click', () => {
        const value = parseFloat(customMultiplier.value);
        if (value && !isNaN(value) && value > 0) {
            applyMultiplier(value / 100);
            customMultiplier.value = '';
        } else {
            alert('Please enter a valid percentage (e.g., 150 for 150%)');
        }
    });
    
    customMultiplier.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyCustomMultiplier.click();
        }
    });
}

function applyMultiplier(multiplier) {
    const width = parseInt(widthPx.value);
    const height = parseInt(heightPx.value);
    
    if (!width || !height || isNaN(width) || isNaN(height)) {
        alert('Please set dimensions first');
        return;
    }
    
    const newWidth = Math.round(width * multiplier);
    const newHeight = Math.round(height * multiplier);
    
    setDimensions(newWidth, newHeight, true);
}

function setDefaultValues() {
    widthPx.value = 1920;
    heightPx.value = 1080;
    widthSlider.value = 1920;
    updateSliderDisplay();
    updateRatioInfo();
    
    // Auto-select matching ratio preset
    matchRatioPreset(1920, 1080);
}

function selectRatioPreset(preset, btnElement) {
    // Clear active state from all buttons
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    
    currentRatio = { width: preset.width, height: preset.height };
    
    // Update custom ratio inputs
    ratioWidth.value = preset.width;
    ratioHeight.value = preset.height;
    
    // Recalculate dimensions if width is set
    const width = parseInt(widthPx.value);
    if (width && !isNaN(width)) {
        const height = Math.round(width * preset.height / preset.width);
        setDimensions(width, height, false);
    }
}

function applyPixelPreset(preset) {
    setDimensions(preset.width, preset.height, true);
    matchRatioPreset(preset.width, preset.height);
}

function handleWidthInput() {
    if (isUpdating) return;
    
    const width = parseInt(widthPx.value);
    if (!width || isNaN(width)) {
        updateRatioInfo();
        return;
    }
    
    isUpdating = true;
    widthSlider.value = Math.max(50, Math.min(6000, width));
    updateSliderDisplay();
    
    if (currentRatio) {
        const height = Math.round(width * currentRatio.height / currentRatio.width);
        heightPx.value = height;
    }
    
    isUpdating = false;
    updateRatioInfo();
}

function handleHeightInput() {
    if (isUpdating) return;
    updateRatioInfo();
}

function handleSliderInput() {
    if (isUpdating) return;
    
    const width = parseInt(widthSlider.value);
    isUpdating = true;
    
    widthPx.value = width;
    updateSliderDisplay();
    
    if (currentRatio) {
        const height = Math.round(width * currentRatio.height / currentRatio.width);
        heightPx.value = height;
    }
    
    isUpdating = false;
    updateRatioInfo();
}

function handleCustomRatioInput() {
    const w = parseInt(ratioWidth.value);
    const h = parseInt(ratioHeight.value);
    
    // Auto-fill matching value when one is entered
    if (w && !h && !isNaN(w)) {
        // Try to match with a preset
        const currentWidth = parseInt(widthPx.value);
        const currentHeight = parseInt(heightPx.value);
        
        if (currentWidth && currentHeight) {
            const gcd = calculateGCD(currentWidth, currentHeight);
            const simplifiedW = currentWidth / gcd;
            const simplifiedH = currentHeight / gcd;
            
            // If simplified ratio matches the entered width, fill in height
            if (simplifiedW === w) {
                ratioHeight.value = simplifiedH;
            }
        }
    } else if (h && !w && !isNaN(h)) {
        // Try to match with a preset
        const currentWidth = parseInt(widthPx.value);
        const currentHeight = parseInt(heightPx.value);
        
        if (currentWidth && currentHeight) {
            const gcd = calculateGCD(currentWidth, currentHeight);
            const simplifiedW = currentWidth / gcd;
            const simplifiedH = currentHeight / gcd;
            
            // If simplified ratio matches the entered height, fill in width
            if (simplifiedH === h) {
                ratioWidth.value = simplifiedW;
            }
        }
    }
}

function applyCustomRatioClick() {
    const w = parseInt(ratioWidth.value);
    const h = parseInt(ratioHeight.value);
    
    if (!w || !h || isNaN(w) || isNaN(h)) {
        alert('Please enter both width and height ratio values');
        return;
    }
    
    // Clear active preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    
    currentRatio = { width: w, height: h };
    
    // Recalculate dimensions
    const width = parseInt(widthPx.value) || 1920;
    const height = Math.round(width * h / w);
    setDimensions(width, height, true);
}

function swapDimensions() {
    const width = widthPx.value;
    const height = heightPx.value;
    
    setDimensions(parseInt(height), parseInt(width), true);
    
    // Also swap the custom ratio inputs if they have values
    if (ratioWidth.value && ratioHeight.value) {
        const tempW = ratioWidth.value;
        ratioWidth.value = ratioHeight.value;
        ratioHeight.value = tempW;
        
        if (currentRatio) {
            currentRatio = { width: currentRatio.height, height: currentRatio.width };
        }
    }
    
    matchRatioPreset(parseInt(height), parseInt(width));
}

function setDimensions(width, height, updateSlider) {
    isUpdating = true;
    
    widthPx.value = width;
    heightPx.value = height;
    
    if (updateSlider) {
        widthSlider.value = Math.max(50, Math.min(6000, width));
        updateSliderDisplay();
    }
    
    isUpdating = false;
    updateRatioInfo();
}

function updateSliderDisplay() {
    sliderValue.textContent = `${widthSlider.value} px`;
}

function updateRatioInfo() {
    const width = parseInt(widthPx.value);
    const height = parseInt(heightPx.value);
    
    if (!width || !height || isNaN(width) || isNaN(height)) {
        document.getElementById('currentDimensions').textContent = '—';
        document.getElementById('simplifiedRatio').textContent = '—';
        document.getElementById('decimalRatio').textContent = '—';
        document.getElementById('orientation').textContent = '—';
        return;
    }
    
    // Current dimensions
    document.getElementById('currentDimensions').textContent = `${width} × ${height} px`;
    
    // Simplified ratio
    const gcd = calculateGCD(width, height);
    const simplifiedW = width / gcd;
    const simplifiedH = height / gcd;
    document.getElementById('simplifiedRatio').textContent = `${simplifiedW}:${simplifiedH}`;
    
    // Decimal ratio
    const decimal = (width / height).toFixed(3);
    document.getElementById('decimalRatio').textContent = decimal;
    
    // Orientation
    let orientation;
    if (width === height) {
        orientation = '■ Square';
    } else if (width > height) {
        orientation = '▭ Landscape';
    } else {
        orientation = '▯ Portrait';
    }
    document.getElementById('orientation').textContent = orientation;
}

function matchRatioPreset(width, height) {
    const gcd = calculateGCD(width, height);
    const simplifiedW = width / gcd;
    const simplifiedH = height / gcd;
    
    // Find matching preset
    let matchedBtn = null;
    document.querySelectorAll('.preset-btn').forEach((btn, index) => {
        const preset = RATIO_PRESETS[index];
        if (preset.width === simplifiedW && preset.height === simplifiedH) {
            matchedBtn = btn;
            currentRatio = { width: preset.width, height: preset.height };
            ratioWidth.value = preset.width;
            ratioHeight.value = preset.height;
        }
    });
    
    // Update active state
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    if (matchedBtn) {
        matchedBtn.classList.add('active');
    } else {
        // Set custom ratio
        currentRatio = { width: simplifiedW, height: simplifiedH };
        ratioWidth.value = simplifiedW;
        ratioHeight.value = simplifiedH;
    }
}

function calculateGCD(a, b) {
    return b === 0 ? a : calculateGCD(b, a % b);
}

// Initialize on page load
init();
