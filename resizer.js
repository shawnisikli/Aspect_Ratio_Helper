// Image Resizer functionality
let resizerCurrentImage = null;
let resizerOriginalFile = null;
let resizerAspectRatio = 1;
let resizerLockAspect = true;
let resizerResizedBlob = null;

function initResizer() {
    const uploadBox = document.getElementById('resizerUploadBox');
    const fileInput = document.getElementById('resizerInput');
    
    uploadBox.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleResizerUpload);
    
    // Drag and drop
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
            loadResizerImage(file);
        }
    });
    
    // Paste support
    document.addEventListener('paste', handleResizerPaste);
    
    // Method buttons
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const method = btn.dataset.method;
            document.getElementById('resizePercentage').style.display = method === 'percentage' ? 'block' : 'none';
            document.getElementById('resizeDimensions').style.display = method === 'dimensions' ? 'block' : 'none';
            document.getElementById('resizeFilesize').style.display = method === 'filesize' ? 'block' : 'none';
        });
    });
    
    // Percentage slider
    const percentageSlider = document.getElementById('percentageSlider');
    percentageSlider.addEventListener('input', () => {
        document.getElementById('percentageValue').textContent = percentageSlider.value + '%';
    });
    
    // Quality slider
    const qualitySlider = document.getElementById('qualitySlider');
    qualitySlider.addEventListener('input', () => {
        document.getElementById('qualityValue').textContent = qualitySlider.value + '%';
    });
    
    // Dimension inputs
    const widthInput = document.getElementById('resizerWidth');
    const heightInput = document.getElementById('resizerHeight');
    const lockBtn = document.getElementById('resizerLockBtn');
    
    lockBtn.addEventListener('click', () => {
        resizerLockAspect = !resizerLockAspect;
        lockBtn.classList.toggle('active');
    });
    
    widthInput.addEventListener('input', () => {
        if (resizerLockAspect && widthInput.value) {
            heightInput.value = Math.round(widthInput.value / resizerAspectRatio);
        }
    });
    
    heightInput.addEventListener('input', () => {
        if (resizerLockAspect && heightInput.value) {
            widthInput.value = Math.round(heightInput.value * resizerAspectRatio);
        }
    });
    
    // Preset resize buttons
    document.querySelectorAll('.preset-resize-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const width = parseInt(btn.dataset.width);
            const height = parseInt(btn.dataset.height);
            widthInput.value = width;
            heightInput.value = height;
        });
    });
    
    // Apply resize
    document.getElementById('applyResize').addEventListener('click', applyResize);
    
    // Download
    document.getElementById('downloadResized').addEventListener('click', downloadResized);
    
    // New image
    document.getElementById('newResizerImageBtn').addEventListener('click', () => {
        document.getElementById('resizerMain').style.display = 'none';
        document.querySelector('#resizer .upload-section').style.display = 'flex';
        resizerCurrentImage = null;
        resizerOriginalFile = null;
        resizerResizedBlob = null;
        document.getElementById('resultInfo').style.display = 'none';
        document.getElementById('downloadResized').style.display = 'none';
        document.getElementById('resizerResultSection').style.display = 'none';
    });
}

function handleResizerUpload(e) {
    const file = e.target.files[0];
    if (file) {
        loadResizerImage(file);
    }
}

function handleResizerPaste(e) {
    if (document.querySelector('#resizer').classList.contains('active')) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                loadResizerImage(blob);
                e.preventDefault();
                break;
            }
        }
    }
}

function loadResizerImage(file) {
    resizerOriginalFile = file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            resizerCurrentImage = img;
            resizerAspectRatio = img.width / img.height;
            
            // Display image
            document.getElementById('resizerOriginalPreview').src = e.target.result;
            
            // Update info
            document.getElementById('resizerOriginalSize').textContent = `${img.width} × ${img.height} px`;
            document.getElementById('resizerOriginalFileSize').textContent = formatFileSize(file.size);
            document.getElementById('resizerOriginalFormat').textContent = file.type.split('/')[1].toUpperCase();
            
            // Set dimension inputs
            document.getElementById('resizerWidth').value = img.width;
            document.getElementById('resizerHeight').value = img.height;
            
            // Show main interface
            document.querySelector('#resizer .upload-section').style.display = 'none';
            document.getElementById('resizerMain').style.display = 'grid';
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function applyResize() {
    if (!resizerCurrentImage) return;
    
    const activeMethod = document.querySelector('.method-btn.active').dataset.method;
    let targetWidth, targetHeight;
    
    if (activeMethod === 'percentage') {
        const percentage = parseInt(document.getElementById('percentageSlider').value) / 100;
        targetWidth = Math.round(resizerCurrentImage.width * percentage);
        targetHeight = Math.round(resizerCurrentImage.height * percentage);
    } else if (activeMethod === 'dimensions') {
        targetWidth = parseInt(document.getElementById('resizerWidth').value);
        targetHeight = parseInt(document.getElementById('resizerHeight').value);
    } else if (activeMethod === 'filesize') {
        // Start with 50% and adjust based on result
        const targetKB = parseInt(document.getElementById('targetFilesize').value);
        if (!targetKB) {
            alert('Please enter a target file size');
            return;
        }
        targetWidth = Math.round(resizerCurrentImage.width * 0.5);
        targetHeight = Math.round(resizerCurrentImage.height * 0.5);
    }
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw resized image
    ctx.drawImage(resizerCurrentImage, 0, 0, targetWidth, targetHeight);
    
    // Get output format and quality
    const format = document.getElementById('outputFormat').value;
    const quality = parseInt(document.getElementById('qualitySlider').value) / 100;
    
    // Convert to blob
    canvas.toBlob((blob) => {
        resizerResizedBlob = blob;
        
        // Show preview
        const url = URL.createObjectURL(blob);
        document.getElementById('resizerResultPreview').src = url;
        document.getElementById('resizerResultSection').style.display = 'block';
        
        // Update result info
        document.getElementById('resizerNewSize').textContent = `${targetWidth} × ${targetHeight} px`;
        document.getElementById('resizerNewFileSize').textContent = formatFileSize(blob.size);
        
        const reduction = ((1 - blob.size / resizerOriginalFile.size) * 100).toFixed(1);
        document.getElementById('resizerReduction').textContent = reduction + '%';
        document.getElementById('resizerReduction').style.color = reduction > 0 ? 'var(--success)' : 'var(--error)';
        
        document.getElementById('resultInfo').style.display = 'grid';
        document.getElementById('downloadResized').style.display = 'block';
    }, format, quality);
}

function downloadResized() {
    if (!resizerResizedBlob) return;
    
    const format = document.getElementById('outputFormat').value;
    const extension = format.split('/')[1];
    const url = URL.createObjectURL(resizerResizedBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `resized-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResizer);
} else {
    initResizer();
}
