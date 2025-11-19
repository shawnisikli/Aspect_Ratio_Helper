// Image Resizer functionality
let resizerCurrentImage = null;
let resizerOriginalFile = null;
let resizerAspectRatio = 1;
let resizerLockAspect = true;
let resizerResizedBlob = null;

// Batch processing variables
let batchMode = false;
let batchFiles = [];
let batchProcessedBlobs = [];
let batchLockAspect = true;
let batchTargetRatio = 1;

function initResizer() {
    // Mode selector
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            batchMode = btn.dataset.mode === 'batch';
            
            document.getElementById('resizerUploadBox').style.display = batchMode ? 'none' : 'flex';
            document.getElementById('batchUploadBox').style.display = batchMode ? 'flex' : 'none';
            
            // Reset views
            if (batchMode) {
                document.getElementById('resizerMain').style.display = 'none';
                document.getElementById('batchMain').style.display = 'none';
                document.querySelector('#resizer .upload-section').style.display = 'flex';
            } else {
                document.getElementById('batchMain').style.display = 'none';
                document.getElementById('resizerMain').style.display = 'none';
                document.querySelector('#resizer .upload-section').style.display = 'flex';
            }
        });
    });

    const uploadBox = document.getElementById('resizerUploadBox');
    const fileInput = document.getElementById('resizerInput');
    const batchUploadBox = document.getElementById('batchUploadBox');
    const batchInput = document.getElementById('batchInput');
    
    uploadBox.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleResizerUpload);
    
    // Batch upload
    batchUploadBox.addEventListener('click', () => batchInput.click());
    batchInput.addEventListener('change', handleBatchUpload);
    
    // Drag and drop - Single
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

    // Drag and drop - Batch
    batchUploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        batchUploadBox.style.borderColor = 'var(--accent)';
    });
    
    batchUploadBox.addEventListener('dragleave', () => {
        batchUploadBox.style.borderColor = 'var(--border)';
    });
    
    batchUploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        batchUploadBox.style.borderColor = 'var(--border)';
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            loadBatchImages(files);
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
    
    // Batch controls
    const batchWidth = document.getElementById('batchWidth');
    const batchHeight = document.getElementById('batchHeight');
    const batchLockBtn = document.getElementById('batchLockBtn');
    const batchQuality = document.getElementById('batchQuality');
    
    batchLockBtn.addEventListener('click', () => {
        batchLockAspect = !batchLockAspect;
        batchLockBtn.classList.toggle('active');
    });
    
    batchWidth.addEventListener('input', () => {
        if (batchLockAspect && batchWidth.value) {
            batchHeight.value = Math.round(batchWidth.value / batchTargetRatio);
        } else if (batchWidth.value && batchHeight.value) {
            batchTargetRatio = batchWidth.value / batchHeight.value;
        }
    });
    
    batchHeight.addEventListener('input', () => {
        if (batchLockAspect && batchHeight.value) {
            batchWidth.value = Math.round(batchHeight.value * batchTargetRatio);
        } else if (batchWidth.value && batchHeight.value) {
            batchTargetRatio = batchWidth.value / batchHeight.value;
        }
    });
    
    batchQuality.addEventListener('input', () => {
        document.getElementById('batchQualityValue').textContent = batchQuality.value + '%';
    });
    
    // Batch preset buttons
    document.querySelectorAll('.batch-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            batchWidth.value = btn.dataset.width;
            batchHeight.value = btn.dataset.height;
            batchTargetRatio = batchWidth.value / batchHeight.value;
        });
    });
    
    document.getElementById('processBatch').addEventListener('click', processBatchImages);
    document.getElementById('downloadAllBatch').addEventListener('click', downloadAllBatch);
    document.getElementById('newBatchBtn').addEventListener('click', () => {
        document.getElementById('batchMain').style.display = 'none';
        document.querySelector('#resizer .upload-section').style.display = 'flex';
        batchFiles = [];
        batchProcessedBlobs = [];
    });
    
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

// Batch processing functions
function handleBatchUpload(e) {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
        loadBatchImages(files);
    }
}

function loadBatchImages(files) {
    batchFiles = files;
    batchProcessedBlobs = [];
    
    // Hide upload section and show batch main
    document.querySelector('#resizer .upload-section').style.display = 'none';
    document.getElementById('batchMain').style.display = 'grid';
    
    // Update count
    document.getElementById('batchCount').textContent = files.length;
    
    // Render image list
    const listContainer = document.getElementById('batchImageList');
    listContainer.innerHTML = '';
    
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const item = document.createElement('div');
                item.className = 'batch-image-item';
                item.innerHTML = `
                    <img src="${e.target.result}" class="batch-image-thumb">
                    <div class="batch-image-info">
                        <div class="batch-image-name">${file.name}</div>
                        <div class="batch-image-details">${img.width} × ${img.height} px • ${formatFileSize(file.size)}</div>
                    </div>
                    <span class="batch-image-status pending">Pending</span>
                `;
                item.dataset.index = index;
                listContainer.appendChild(item);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
    
    // Reset progress
    document.getElementById('batchProgress').style.display = 'none';
    document.getElementById('downloadAllBatch').style.display = 'none';
    document.getElementById('batchPreviewGrid').innerHTML = '<p class="help-text" style="text-align: center; padding: 2rem; grid-column: 1 / -1;">Process images to see results</p>';
}

async function processBatchImages() {
    const width = parseInt(document.getElementById('batchWidth').value);
    const height = parseInt(document.getElementById('batchHeight').value);
    const mode = document.getElementById('batchResizeMode').value;
    const format = document.getElementById('batchFormat').value;
    const quality = parseInt(document.getElementById('batchQuality').value) / 100;
    
    if (!width || !height || width < 1 || height < 1) {
        alert('Please enter valid dimensions');
        return;
    }
    
    batchProcessedBlobs = [];
    const progressBar = document.getElementById('batchProgress');
    const progressBarFill = document.getElementById('batchProgressBar');
    const progressText = document.getElementById('batchProgressText');
    const progressCount = document.getElementById('batchProgressCount');
    const previewGrid = document.getElementById('batchPreviewGrid');
    
    progressBar.style.display = 'block';
    previewGrid.innerHTML = '';
    
    for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        
        // Update progress
        const progress = ((i / batchFiles.length) * 100).toFixed(0);
        progressBarFill.style.width = progress + '%';
        progressText.textContent = `Processing ${file.name}...`;
        progressCount.textContent = `${i} / ${batchFiles.length}`;
        
        // Update status in list
        const listItem = document.querySelector(`.batch-image-item[data-index="${i}"] .batch-image-status`);
        if (listItem) {
            listItem.className = 'batch-image-status processing';
            listItem.textContent = 'Processing';
        }
        
        try {
            const blob = await processSingleImage(file, width, height, mode, format, quality);
            batchProcessedBlobs.push({ blob, name: file.name });
            
            // Update status
            if (listItem) {
                listItem.className = 'batch-image-status done';
                listItem.textContent = 'Done';
            }
            
            // Add to preview
            const previewItem = document.createElement('div');
            previewItem.className = 'batch-preview-item';
            const url = URL.createObjectURL(blob);
            previewItem.innerHTML = `
                <img src="${url}">
                <div class="batch-preview-info">
                    <div class="batch-preview-name">${file.name}</div>
                    <div class="batch-preview-size">${width} × ${height} px • ${formatFileSize(blob.size)}</div>
                </div>
            `;
            previewGrid.appendChild(previewItem);
            
        } catch (error) {
            console.error('Error processing image:', file.name, error);
            if (listItem) {
                listItem.className = 'batch-image-status pending';
                listItem.textContent = 'Error';
            }
        }
    }
    
    // Complete
    progressBarFill.style.width = '100%';
    progressText.textContent = 'Complete!';
    progressCount.textContent = `${batchFiles.length} / ${batchFiles.length}`;
    document.getElementById('downloadAllBatch').style.display = 'block';
}

function processSingleImage(file, targetWidth, targetHeight, mode, format, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                
                let sx = 0, sy = 0, sw = img.width, sh = img.height;
                let dx = 0, dy = 0, dw = targetWidth, dh = targetHeight;
                
                if (mode === 'cover') {
                    // Cover mode: fill the target size, crop excess
                    const imgRatio = img.width / img.height;
                    const targetRatio = targetWidth / targetHeight;
                    
                    if (imgRatio > targetRatio) {
                        // Image is wider, crop sides
                        sw = img.height * targetRatio;
                        sx = (img.width - sw) / 2;
                    } else {
                        // Image is taller, crop top/bottom
                        sh = img.width / targetRatio;
                        sy = (img.height - sh) / 2;
                    }
                } else if (mode === 'contain') {
                    // Contain mode: fit inside target, add padding
                    const imgRatio = img.width / img.height;
                    const targetRatio = targetWidth / targetHeight;
                    
                    if (imgRatio > targetRatio) {
                        // Image is wider, fit width
                        dh = targetWidth / imgRatio;
                        dy = (targetHeight - dh) / 2;
                    } else {
                        // Image is taller, fit height
                        dw = targetHeight * imgRatio;
                        dx = (targetWidth - dw) / 2;
                    }
                    
                    // Fill background with black or transparent
                    ctx.fillStyle = format === 'image/png' ? 'transparent' : '#000000';
                    ctx.fillRect(0, 0, targetWidth, targetHeight);
                }
                // Stretch mode uses default values (entire image to entire canvas)
                
                ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                }, format, quality);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

async function downloadAllBatch() {
    if (batchProcessedBlobs.length === 0) return;
    
    // Use JSZip if available, otherwise download individually
    if (typeof JSZip !== 'undefined') {
        const zip = new JSZip();
        const format = document.getElementById('batchFormat').value;
        const extension = format.split('/')[1];
        
        batchProcessedBlobs.forEach(({ blob, name }, index) => {
            const baseName = name.replace(/\.[^/.]+$/, '');
            zip.file(`${baseName}_resized.${extension}`, blob);
        });
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resized_images_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        // Download individually
        const format = document.getElementById('batchFormat').value;
        const extension = format.split('/')[1];
        
        for (let i = 0; i < batchProcessedBlobs.length; i++) {
            const { blob, name } = batchProcessedBlobs[i];
            const baseName = name.replace(/\.[^/.]+$/, '');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${baseName}_resized.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResizer);
} else {
    initResizer();
}
