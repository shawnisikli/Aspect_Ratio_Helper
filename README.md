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

Simply open `index.html` in your web browser. No installation or build process required!

**Note**: Video processing uses FFmpeg.wasm which loads on page load. Wait for it to initialize before processing videos.

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
