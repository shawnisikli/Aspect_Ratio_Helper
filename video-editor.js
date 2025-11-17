// Video Editor functionality
let currentVideo = null;
let videoElement = null;
let currentSpeed = 1;
let originalDuration = 0;
let videoCropData = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    ratio: null,
    enabled: false
};
let videoIsDragging = false;
let videoIsResizing = false;
let videoDragStart = { x: 0, y: 0 };
let videoResizeHandle = null;

const VIDEO_CROP_RATIOS = [
    { name: 'No Crop', width: null, height: null },
    { name: '1:1', width: 1, height: 1 },
    { name: '4:3', width: 4, height: 3 },
    { name: '3:4', width: 3, height: 4 },
    { name: '16:9', width: 16, height: 9 },
    { name: '9:16', width: 9, height: 16 },
    { name: '21:9', width: 21, height: 9 },
    { name: '3:2', width: 3, height: 2 }
];

// FFmpeg instance
let ffmpeg = null;
let ffmpegLoaded = false;

// Initialize video editor
function initVideoEditor() {
    videoElement = document.getElementById('videoPreview');
    
    const videoUploadBox = document.getElementById('videoUploadBox');
    const videoInput = document.getElementById('videoInput');
    const processVideo = document.getElementById('processVideo');
    const newVideoBtn = document.getElementById('newVideoBtn');
    const resetVideoCrop = document.getElementById('resetVideoCrop');
    const customSpeed = document.getElementById('customSpeed');
    const applyCustomSpeed = document.getElementById('applyCustomSpeed');
    
    // Upload handlers
    videoUploadBox.addEventListener('click', () => videoInput.click());
    videoInput.addEventListener('change', handleVideoUpload);
    
    // Drag and drop
    videoUploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoUploadBox.style.borderColor = 'var(--accent)';
    });
    
    videoUploadBox.addEventListener('dragleave', () => {
        videoUploadBox.style.borderColor = 'var(--border)';
    });
    
    videoUploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        videoUploadBox.style.borderColor = 'var(--border)';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            loadVideo(file);
        }
    });
    
    // Action buttons
    processVideo.addEventListener('click', processAndDownloadVideo);
    newVideoBtn.addEventListener('click', () => {
        document.getElementById('videoEditorMain').style.display = 'none';
        document.querySelector('.upload-section').style.display = 'flex';
        if (videoElement.src) {
            URL.revokeObjectURL(videoElement.src);
        }
        currentVideo = null;
    });
    resetVideoCrop.addEventListener('click', resetVideoCropArea);
    
    // Speed controls
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => selectSpeed(parseFloat(btn.dataset.speed), btn));
    });
    
    applyCustomSpeed.addEventListener('click', () => {
        const speed = parseFloat(customSpeed.value);
        if (speed && !isNaN(speed) && speed > 0) {
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            currentSpeed = speed;
            updateSpeedInfo();
            customSpeed.value = '';
        }
    });
    
    customSpeed.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyCustomSpeed.click();
        }
    });
    
    // Render crop ratio buttons
    renderVideoCropRatios();
    
    // Setup crop handlers
    setupVideoCropHandlers();
    
    // Video loaded handler
    videoElement.addEventListener('loadedmetadata', () => {
        updateVideoInfo();
        resetVideoCropArea();
    });
    
    // Initialize FFmpeg
    initFFmpeg();
}

async function initFFmpeg() {
    try {
        const { FFmpeg } = FFmpegWASM;
        ffmpeg = new FFmpeg();
        
        ffmpeg.on('log', ({ message }) => {
            console.log(message);
        });
        
        ffmpeg.on('progress', ({ progress }) => {
            const percent = Math.round(progress * 100);
            document.getElementById('progressFill').style.width = percent + '%';
            document.getElementById('statusText').textContent = `Processing... ${percent}%`;
        });
        
        await ffmpeg.load({
            coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        });
        
        ffmpegLoaded = true;
        console.log('FFmpeg loaded successfully');
    } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        alert('Failed to load video processing library. Some features may not work.');
    }
}

function renderVideoCropRatios() {
    const container = document.getElementById('videoCropRatios');
    container.innerHTML = '';
    
    VIDEO_CROP_RATIOS.forEach(ratio => {
        const btn = document.createElement('button');
        btn.className = 'crop-ratio-btn';
        if (ratio.width === null) btn.classList.add('active');
        btn.textContent = ratio.name;
        btn.addEventListener('click', () => selectVideoCropRatio(ratio, btn));
        container.appendChild(btn);
    });
}

function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        loadVideo(file);
    }
}

function loadVideo(file) {
    currentVideo = file;
    const url = URL.createObjectURL(file);
    videoElement.src = url;
    
    document.querySelector('.upload-section').style.display = 'none';
    document.getElementById('videoEditorMain').style.display = 'grid';
}

function updateVideoInfo() {
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    originalDuration = videoElement.duration;
    
    document.getElementById('videoSize').textContent = `${width} × ${height} px`;
    document.getElementById('videoDuration').textContent = formatDuration(originalDuration);
    
    const gcd = calculateGCD(width, height);
    const ratioW = width / gcd;
    const ratioH = height / gcd;
    document.getElementById('videoRatio').textContent = `${ratioW}:${ratioH}`;
    
    updateSpeedInfo();
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function selectSpeed(speed, btnElement) {
    document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    currentSpeed = speed;
    updateSpeedInfo();
}

function updateSpeedInfo() {
    document.getElementById('currentSpeed').textContent = `${currentSpeed}×`;
    if (originalDuration) {
        const newDuration = originalDuration / currentSpeed;
        document.getElementById('newDuration').textContent = formatDuration(newDuration);
    }
}

function selectVideoCropRatio(ratio, btnElement) {
    document.querySelectorAll('#videoCropRatios .crop-ratio-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    
    if (!ratio.width || !ratio.height) {
        // No crop
        videoCropData.enabled = false;
        document.getElementById('videoCropOverlay').style.display = 'none';
        return;
    }
    
    videoCropData.enabled = true;
    videoCropData.ratio = { width: ratio.width, height: ratio.height };
    document.getElementById('videoCropOverlay').style.display = 'block';
    
    // Calculate crop dimensions
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    const targetRatio = ratio.width / ratio.height;
    const currentRatio = videoWidth / videoHeight;
    
    if (currentRatio > targetRatio) {
        // Video is wider, crop width
        videoCropData.height = videoHeight;
        videoCropData.width = videoHeight * targetRatio;
    } else {
        // Video is taller, crop height
        videoCropData.width = videoWidth;
        videoCropData.height = videoWidth / targetRatio;
    }
    
    // Center the crop
    videoCropData.x = (videoWidth - videoCropData.width) / 2;
    videoCropData.y = (videoHeight - videoCropData.height) / 2;
    
    updateVideoCropBox();
}

function resetVideoCropArea() {
    videoCropData.enabled = false;
    document.getElementById('videoCropOverlay').style.display = 'none';
    document.querySelectorAll('#videoCropRatios .crop-ratio-btn').forEach((btn, index) => {
        btn.classList.remove('active');
        if (index === 0) btn.classList.add('active');
    });
}

function updateVideoCropBox() {
    if (!videoCropData.enabled) return;
    
    const cropBox = document.getElementById('videoCropBox');
    const videoRect = videoElement.getBoundingClientRect();
    const scaleX = videoRect.width / videoElement.videoWidth;
    const scaleY = videoRect.height / videoElement.videoHeight;
    
    cropBox.style.left = (videoCropData.x * scaleX) + 'px';
    cropBox.style.top = (videoCropData.y * scaleY) + 'px';
    cropBox.style.width = (videoCropData.width * scaleX) + 'px';
    cropBox.style.height = (videoCropData.height * scaleY) + 'px';
}

function setupVideoCropHandlers() {
    const cropBox = document.getElementById('videoCropBox');
    const handles = document.querySelectorAll('#videoCropBox .crop-handle');
    
    // Drag crop box
    cropBox.addEventListener('mousedown', (e) => {
        if (!videoCropData.enabled) return;
        if (e.target.classList.contains('crop-handle')) return;
        videoIsDragging = true;
        videoDragStart.x = e.clientX;
        videoDragStart.y = e.clientY;
        e.preventDefault();
    });
    
    // Resize handles
    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            if (!videoCropData.enabled) return;
            videoIsResizing = true;
            videoResizeHandle = handle.classList[1];
            videoDragStart.x = e.clientX;
            videoDragStart.y = e.clientY;
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    // Mouse move
    document.addEventListener('mousemove', (e) => {
        if (!videoIsDragging && !videoIsResizing) return;
        if (!videoCropData.enabled) return;
        
        const videoRect = videoElement.getBoundingClientRect();
        const scaleX = videoElement.videoWidth / videoRect.width;
        const scaleY = videoElement.videoHeight / videoRect.height;
        
        const deltaX = (e.clientX - videoDragStart.x) * scaleX;
        const deltaY = (e.clientY - videoDragStart.y) * scaleY;
        
        if (videoIsDragging) {
            videoCropData.x = Math.max(0, Math.min(videoElement.videoWidth - videoCropData.width, videoCropData.x + deltaX));
            videoCropData.y = Math.max(0, Math.min(videoElement.videoHeight - videoCropData.height, videoCropData.y + deltaY));
        } else if (videoIsResizing) {
            const oldX = videoCropData.x;
            const oldY = videoCropData.y;
            const oldWidth = videoCropData.width;
            const oldHeight = videoCropData.height;
            
            if (videoResizeHandle.includes('w')) {
                videoCropData.x += deltaX;
                videoCropData.width -= deltaX;
            }
            if (videoResizeHandle.includes('e')) {
                videoCropData.width += deltaX;
            }
            if (videoResizeHandle.includes('n')) {
                videoCropData.y += deltaY;
                videoCropData.height -= deltaY;
            }
            if (videoResizeHandle.includes('s')) {
                videoCropData.height += deltaY;
            }
            
            // Maintain aspect ratio
            if (videoCropData.ratio) {
                const targetRatio = videoCropData.ratio.width / videoCropData.ratio.height;
                
                if (videoResizeHandle.includes('e') || videoResizeHandle.includes('w')) {
                    videoCropData.height = videoCropData.width / targetRatio;
                    if (videoResizeHandle.includes('n')) {
                        videoCropData.y = oldY + oldHeight - videoCropData.height;
                    }
                } else {
                    videoCropData.width = videoCropData.height * targetRatio;
                    if (videoResizeHandle.includes('w')) {
                        videoCropData.x = oldX + oldWidth - videoCropData.width;
                    }
                }
            }
            
            // Constrain to video
            if (videoCropData.x < 0 || videoCropData.y < 0 || 
                videoCropData.x + videoCropData.width > videoElement.videoWidth ||
                videoCropData.y + videoCropData.height > videoElement.videoHeight ||
                videoCropData.width < 20 || videoCropData.height < 20) {
                videoCropData.x = oldX;
                videoCropData.y = oldY;
                videoCropData.width = oldWidth;
                videoCropData.height = oldHeight;
            }
        }
        
        videoDragStart.x = e.clientX;
        videoDragStart.y = e.clientY;
        updateVideoCropBox();
    });
    
    // Mouse up
    document.addEventListener('mouseup', () => {
        videoIsDragging = false;
        videoIsResizing = false;
        videoResizeHandle = null;
    });
}

async function processAndDownloadVideo() {
    if (!currentVideo || !ffmpegLoaded) {
        alert('Please upload a video first and wait for the processing library to load.');
        return;
    }
    
    const statusDiv = document.getElementById('processingStatus');
    const progressFill = document.getElementById('progressFill');
    const statusText = document.getElementById('statusText');
    
    statusDiv.style.display = 'block';
    progressFill.style.width = '0%';
    statusText.textContent = 'Loading video...';
    
    try {
        // Read video file
        const videoData = await currentVideo.arrayBuffer();
        const inputFileName = 'input.mp4';
        const outputFileName = 'output.mp4';
        
        await ffmpeg.writeFile(inputFileName, new Uint8Array(videoData));
        
        // Build FFmpeg command
        let filterComplex = [];
        let outputOptions = [];
        
        // Speed filter
        if (currentSpeed !== 1) {
            const videoSpeed = currentSpeed;
            const audioSpeed = currentSpeed;
            filterComplex.push(`[0:v]setpts=${1/videoSpeed}*PTS[v]`);
            filterComplex.push(`[0:a]atempo=${Math.min(2, audioSpeed)}[a]`);
        }
        
        // Crop filter
        if (videoCropData.enabled) {
            const cropFilter = `crop=${Math.round(videoCropData.width)}:${Math.round(videoCropData.height)}:${Math.round(videoCropData.x)}:${Math.round(videoCropData.y)}`;
            if (filterComplex.length > 0) {
                filterComplex[0] = filterComplex[0].replace('[v]', '[vtemp]');
                filterComplex.push(`[vtemp]${cropFilter}[v]`);
            } else {
                filterComplex.push(`[0:v]${cropFilter}[v]`);
            }
        }
        
        // Build command
        let command = ['-i', inputFileName];
        
        if (filterComplex.length > 0) {
            command.push('-filter_complex', filterComplex.join(';'));
            command.push('-map', '[v]');
            if (currentSpeed !== 1) {
                command.push('-map', '[a]');
            } else {
                command.push('-map', '0:a?');
            }
        }
        
        command.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23');
        if (currentSpeed !== 1) {
            command.push('-c:a', 'aac');
        }
        command.push(outputFileName);
        
        statusText.textContent = 'Processing video...';
        await ffmpeg.exec(command);
        
        statusText.textContent = 'Preparing download...';
        
        // Read output file
        const data = await ffmpeg.readFile(outputFileName);
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        
        // Download
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed-${Date.now()}.mp4`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        statusText.textContent = 'Complete!';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 2000);
        
    } catch (error) {
        console.error('Video processing error:', error);
        statusText.textContent = 'Error processing video. Please try again.';
        alert('Failed to process video: ' + error.message);
    }
}

function calculateGCD(a, b) {
    return b === 0 ? a : calculateGCD(b, a % b);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVideoEditor);
} else {
    initVideoEditor();
}
