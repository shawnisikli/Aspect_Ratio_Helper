// Image Editor functionality
let currentImage = null;
let canvas = null;
let ctx = null;
let cropData = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    ratio: null
};
let isDragging = false;
let isResizing = false;
let dragStart = { x: 0, y: 0 };
let resizeHandle = null;

const CROP_RATIOS = [
    { name: 'Free', width: null, height: null },
    { name: '1:1', width: 1, height: 1 },
    { name: '4:3', width: 4, height: 3 },
    { name: '3:4', width: 3, height: 4 },
    { name: '16:9', width: 16, height: 9 },
    { name: '9:16', width: 9, height: 16 },
    { name: '21:9', width: 21, height: 9 },
    { name: '3:2', width: 3, height: 2 }
];

// Initialize editor
function initEditor() {
    canvas = document.getElementById('imageCanvas');
    ctx = canvas.getContext('2d');
    
    const uploadBox = document.getElementById('uploadBox');
    const imageInput = document.getElementById('imageInput');
    const downloadBtn = document.getElementById('downloadBtn');
    const newImageBtn = document.getElementById('newImageBtn');
    const resetCrop = document.getElementById('resetCrop');
    
    // Upload handlers
    uploadBox.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageUpload);
    
    // Paste handler (Ctrl+V)
    document.addEventListener('paste', handlePaste);
    
    // Drag and drop - Upload box
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--accent)';
    });
    
    uploadBox.addEventListener('dragleave', () => {
        uploadBox.style.borderColor = 'var(--border)';
    });
    
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--border)';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            loadImage(file);
        }
    });

    // Drag and drop - Editor tab (entire area)
    const editorTab = document.getElementById('editor');
    editorTab.addEventListener('dragover', (e) => {
        if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    });
    
    editorTab.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            loadImage(file);
        }
    });
    
    // Action buttons
    downloadBtn.addEventListener('click', downloadCroppedImage);
    newImageBtn.addEventListener('click', () => {
        document.getElementById('editorMain').style.display = 'none';
        document.querySelector('.upload-section').style.display = 'flex';
        currentImage = null;
    });
    resetCrop.addEventListener('click', resetCropArea);
    
    // Render crop ratio buttons
    renderCropRatios();
    
    // Crop interaction handlers
    setupCropHandlers();
}

function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            loadImage(blob);
            e.preventDefault();
            break;
        }
    }
}

function renderCropRatios() {
    const container = document.getElementById('cropRatios');
    container.innerHTML = '';
    
    CROP_RATIOS.forEach(ratio => {
        const btn = document.createElement('button');
        btn.className = 'crop-ratio-btn';
        btn.textContent = ratio.name;
        btn.addEventListener('click', () => selectCropRatio(ratio, btn));
        container.appendChild(btn);
    });
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        loadImage(file);
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            displayImage();
            document.querySelector('.upload-section').style.display = 'none';
            document.getElementById('editorMain').style.display = 'grid';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function displayImage() {
    if (!currentImage) return;
    
    // Set canvas size to image size
    const maxWidth = 800;
    const maxHeight = 600;
    let width = currentImage.width;
    let height = currentImage.height;
    
    // Scale down if too large
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw image
    ctx.drawImage(currentImage, 0, 0, width, height);
    
    // Update info
    document.getElementById('imageSize').textContent = `${currentImage.width} × ${currentImage.height} px`;
    
    const gcd = calculateGCD(currentImage.width, currentImage.height);
    const ratioW = currentImage.width / gcd;
    const ratioH = currentImage.height / gcd;
    document.getElementById('imageRatio').textContent = `${ratioW}:${ratioH}`;
    
    // Initialize crop area
    resetCropArea();
}

function resetCropArea() {
    if (!canvas) return;
    
    const padding = 40;
    cropData.x = padding;
    cropData.y = padding;
    cropData.width = canvas.width - padding * 2;
    cropData.height = canvas.height - padding * 2;
    cropData.ratio = null;
    
    // Clear active ratio buttons
    document.querySelectorAll('.crop-ratio-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.crop-ratio-btn').classList.add('active'); // "Free" is first
    
    updateCropBox();
}

function selectCropRatio(ratio, btnElement) {
    document.querySelectorAll('.crop-ratio-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    
    cropData.ratio = ratio.width && ratio.height ? { width: ratio.width, height: ratio.height } : null;
    
    if (cropData.ratio) {
        // Calculate maximum crop area that fits within canvas at target ratio
        const targetRatio = cropData.ratio.width / cropData.ratio.height;
        const canvasRatio = canvas.width / canvas.height;
        
        if (canvasRatio > targetRatio) {
            // Canvas is wider than target ratio, constrain by height
            cropData.height = canvas.height;
            cropData.width = cropData.height * targetRatio;
        } else {
            // Canvas is taller than target ratio, constrain by width
            cropData.width = canvas.width;
            cropData.height = cropData.width / targetRatio;
        }
        
        // Center the crop
        cropData.x = (canvas.width - cropData.width) / 2;
        cropData.y = (canvas.height - cropData.height) / 2;
        
        updateCropBox();
    }
}

function updateCropBox() {
    const cropBox = document.getElementById('cropBox');
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    
    cropBox.style.left = (cropData.x * scaleX) + 'px';
    cropBox.style.top = (cropData.y * scaleY) + 'px';
    cropBox.style.width = (cropData.width * scaleX) + 'px';
    cropBox.style.height = (cropData.height * scaleY) + 'px';
}

function setupCropHandlers() {
    const cropBox = document.getElementById('cropBox');
    const handles = document.querySelectorAll('.crop-handle');
    
    // Drag crop box
    cropBox.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('crop-handle')) return;
        isDragging = true;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        e.preventDefault();
    });
    
    // Resize handles
    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizeHandle = handle.classList[1]; // nw, ne, sw, se
            dragStart.x = e.clientX;
            dragStart.y = e.clientY;
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    // Mouse move
    document.addEventListener('mousemove', (e) => {
        if (!isDragging && !isResizing) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;
        
        const deltaX = (e.clientX - dragStart.x) * scaleX;
        const deltaY = (e.clientY - dragStart.y) * scaleY;
        
        if (isDragging) {
            // Move crop box
            cropData.x = Math.max(0, Math.min(canvas.width - cropData.width, cropData.x + deltaX));
            cropData.y = Math.max(0, Math.min(canvas.height - cropData.height, cropData.y + deltaY));
        } else if (isResizing) {
            // Resize crop box
            const oldX = cropData.x;
            const oldY = cropData.y;
            const oldWidth = cropData.width;
            const oldHeight = cropData.height;
            
            if (resizeHandle.includes('w')) {
                cropData.x += deltaX;
                cropData.width -= deltaX;
            }
            if (resizeHandle.includes('e')) {
                cropData.width += deltaX;
            }
            if (resizeHandle.includes('n')) {
                cropData.y += deltaY;
                cropData.height -= deltaY;
            }
            if (resizeHandle.includes('s')) {
                cropData.height += deltaY;
            }
            
            // Maintain aspect ratio if set
            if (cropData.ratio) {
                const targetRatio = cropData.ratio.width / cropData.ratio.height;
                
                if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
                    cropData.height = cropData.width / targetRatio;
                    if (resizeHandle.includes('n')) {
                        cropData.y = oldY + oldHeight - cropData.height;
                    }
                } else {
                    cropData.width = cropData.height * targetRatio;
                    if (resizeHandle.includes('w')) {
                        cropData.x = oldX + oldWidth - cropData.width;
                    }
                }
            }
            
            // Constrain to canvas
            if (cropData.x < 0) {
                cropData.width += cropData.x;
                cropData.x = 0;
                // Recalculate height if ratio is locked
                if (cropData.ratio) {
                    const targetRatio = cropData.ratio.width / cropData.ratio.height;
                    cropData.height = cropData.width / targetRatio;
                }
            }
            if (cropData.y < 0) {
                cropData.height += cropData.y;
                cropData.y = 0;
                // Recalculate width if ratio is locked
                if (cropData.ratio) {
                    const targetRatio = cropData.ratio.width / cropData.ratio.height;
                    cropData.width = cropData.height * targetRatio;
                }
            }
            if (cropData.x + cropData.width > canvas.width) {
                cropData.width = canvas.width - cropData.x;
                // Recalculate height if ratio is locked
                if (cropData.ratio) {
                    const targetRatio = cropData.ratio.width / cropData.ratio.height;
                    cropData.height = cropData.width / targetRatio;
                }
            }
            if (cropData.y + cropData.height > canvas.height) {
                cropData.height = canvas.height - cropData.y;
                // Recalculate width if ratio is locked
                if (cropData.ratio) {
                    const targetRatio = cropData.ratio.width / cropData.ratio.height;
                    cropData.width = cropData.height * targetRatio;
                }
            }
            
            // Minimum size
            if (cropData.width < 20 || cropData.height < 20) {
                cropData.x = oldX;
                cropData.y = oldY;
                cropData.width = oldWidth;
                cropData.height = oldHeight;
            }
        }
        
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        updateCropBox();
    });
    
    // Mouse up
    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        resizeHandle = null;
    });
}

function downloadCroppedImage() {
    if (!currentImage) return;
    
    // Calculate actual crop coordinates (canvas may be scaled)
    const scaleX = currentImage.width / canvas.width;
    const scaleY = currentImage.height / canvas.height;
    
    const cropX = cropData.x * scaleX;
    const cropY = cropData.y * scaleY;
    const cropWidth = cropData.width * scaleX;
    const cropHeight = cropData.height * scaleY;
    
    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;
    const cropCtx = cropCanvas.getContext('2d');
    
    // Draw cropped portion
    cropCtx.drawImage(
        currentImage,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );
    
    // Download
    cropCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cropped-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

function calculateGCD(a, b) {
    return b === 0 ? a : calculateGCD(b, a % b);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditor);
} else {
    initEditor();
}
