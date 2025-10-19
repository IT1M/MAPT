# PWA Icon Generation Guide

## Required Icons

The PWA manifest requires the following icon sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## How to Generate Icons

### Option 1: Using Online Tools
1. Visit https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload your logo/icon (minimum 512x512 PNG)
3. Download the generated icon pack
4. Place all icons in this directory

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Linux

# Generate all sizes from a source image
convert source-icon.png -resize 72x72 icon-72.png
convert source-icon.png -resize 96x96 icon-96.png
convert source-icon.png -resize 128x128 icon-128.png
convert source-icon.png -resize 144x144 icon-144.png
convert source-icon.png -resize 152x152 icon-152.png
convert source-icon.png -resize 192x192 icon-192.png
convert source-icon.png -resize 384x384 icon-384.png
convert source-icon.png -resize 512x512 icon-512.png
```

### Option 3: Using Sharp (Node.js)
```javascript
const sharp = require('sharp');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('source-icon.png')
    .resize(size, size)
    .toFile(`icon-${size}.png`);
});
```

## Design Guidelines

- Use a simple, recognizable logo
- Ensure good contrast for visibility
- Test on both light and dark backgrounds
- Make sure the icon is centered with appropriate padding
- Use PNG format with transparency
- Recommended: Medical/healthcare themed icon with teal color (#0d9488)

## Temporary Placeholder

Until you generate proper icons, you can use a simple colored square or the default Next.js icon.
The PWA will still work, but custom icons provide a better user experience.
