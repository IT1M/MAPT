/**
 * Generate placeholder PWA icons
 * This creates simple colored squares as temporary icons until proper icons are designed
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const color = '#0d9488'; // Teal color matching the theme
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG for each size
sizes.forEach(size => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${color}" rx="${size * 0.1}"/>
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.3}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="middle"
  >M</text>
</svg>`;

  const filename = path.join(iconsDir, `icon-${size}.png.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Generated ${filename}`);
});

// Create a note file
const noteContent = `# Placeholder Icons Generated

These are temporary placeholder icons. Replace them with proper icons for production.

To generate proper icons:
1. Create a 512x512 PNG logo
2. Use an online tool like https://realfavicongenerator.net/
3. Or use the instructions in generate-icons.md

Generated on: ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(iconsDir, 'README.md'), noteContent);

console.log('\n✅ Placeholder icons generated successfully!');
console.log('📝 Note: These are temporary SVG placeholders.');
console.log('🎨 Replace with proper PNG icons for production.');
console.log('📖 See public/icons/generate-icons.md for instructions.\n');
