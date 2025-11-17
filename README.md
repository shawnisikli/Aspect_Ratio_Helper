# Aspect Ratio Helper

A modern web-based tool for calculating and maintaining aspect ratios for images and videos, plus powerful editing capabilities.

## Features

### Calculator
- **Preset Ratios**: Quick access to common aspect ratios (16:9, 4:3, 1:1, etc.)
- **Custom Ratios**: Define your own aspect ratios with auto-fill functionality
- **Smart Scaling**: Scale dimensions up or down with preset multipliers (25%, 50%, 150%, 200%, etc.)
- **Real-time Calculations**: Instant updates as you adjust dimensions
- **Dimension Presets**: Common pixel dimensions for quick selection
- **Swap Dimensions**: Easily flip between portrait and landscape

### Image Editor
- **Upload or Paste**: Drag & drop, click to upload, or Ctrl+V to paste images
- **Aspect Ratio Detection**: Automatically detects and displays image aspect ratio
- **Crop to Ratio**: Crop images to specific aspect ratios with visual preview
- **Interactive Cropping**: Drag and resize crop area with handles
- **Download**: Export cropped images as PNG

### Video Editor
- **Speed Control**: Slow down (0.25×, 0.5×, 0.75×) or speed up (1.25×, 1.5×, 2×, 4×) videos
- **Custom Speed**: Set any custom speed multiplier
- **Video Cropping**: Crop videos to different aspect ratios
- **Interactive Crop Area**: Drag and resize crop region with visual feedback
- **Process & Download**: Export edited videos with speed and crop changes applied
- **Duration Preview**: See new video duration before processing

## Usage

**Important for Video Editor**: To use the video processing features, you must:
1. Download FFmpeg library files (see Setup below)
2. Run the app through a local web server

### Setup:

**1. Download FFmpeg files** (required for video editing):
```bash
mkdir lib
curl -o lib/ffmpeg.min.js https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.min.js
curl -o lib/814.ffmpeg.js https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/814.ffmpeg.js
curl -o lib/ffmpeg-core.js https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js
curl -o lib/ffmpeg-core.wasm https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm
```

**2. Start local server:**
```bash
python -m http.server 8000
```

**3. Open in browser:**
```
http://localhost:8000/index.html
```

Alternatively, you can use any other local server like:
- Node.js: `npx serve`
- PHP: `php -S localhost:8000`
- VS Code: Install "Live Server" extension

**Note**: The image editor and calculator work when opening the HTML file directly, but video processing requires the local server and FFmpeg files.

## Technologies

- Pure HTML5, CSS3, and JavaScript
- FFmpeg.wasm for video processing
- No backend required - everything runs in your browser
- Modern, responsive design

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (video processing may have limitations)

## License

MIT
