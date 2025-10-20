/**
 * PWA Implementation Verification Script
 * Checks that all PWA files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying PWA Implementation...\n');

let errors = 0;
let warnings = 0;

// Check manifest.json
console.log('📄 Checking manifest.json...');
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('  ✅ Manifest exists and is valid JSON');
    console.log(`  ✅ App name: ${manifest.name}`);
    console.log(`  ✅ Icons defined: ${manifest.icons.length}`);
    console.log(`  ✅ Display mode: ${manifest.display}`);
  } catch (error) {
    console.log('  ❌ Manifest is invalid JSON');
    errors++;
  }
} else {
  console.log('  ❌ Manifest not found');
  errors++;
}

// Check service worker
console.log('\n🔧 Checking service worker...');
const swPath = path.join(__dirname, '..', 'public', 'sw.js');
if (fs.existsSync(swPath)) {
  console.log('  ✅ Service worker exists');
  const swContent = fs.readFileSync(swPath, 'utf8');
  if (swContent.includes('CACHE_NAME')) {
    console.log('  ✅ Cache configuration found');
  }
  if (swContent.includes('addEventListener')) {
    console.log('  ✅ Event listeners configured');
  }
} else {
  console.log('  ❌ Service worker not found');
  errors++;
}

// Check icons
console.log('\n🎨 Checking icons...');
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const requiredSizes = [72, 96, 128, 144, 152, 192, 384, 512];
if (fs.existsSync(iconsDir)) {
  const icons = fs.readdirSync(iconsDir).filter((f) => f.endsWith('.png'));
  console.log(`  ✅ Icons directory exists with ${icons.length} icons`);

  requiredSizes.forEach((size) => {
    const iconFile = `icon-${size}.png`;
    if (icons.includes(iconFile)) {
      console.log(`  ✅ ${iconFile} found`);
    } else {
      console.log(`  ⚠️  ${iconFile} missing`);
      warnings++;
    }
  });
} else {
  console.log('  ❌ Icons directory not found');
  errors++;
}

// Check PWA components
console.log('\n⚛️  Checking PWA components...');
const components = [
  'src/components/pwa/OfflineBanner.tsx',
  'src/components/pwa/InstallPrompt.tsx',
  'src/components/pwa/PWAProvider.tsx',
  'src/components/pwa/PWAStatus.tsx',
  'src/components/pwa/index.ts',
];

components.forEach((comp) => {
  const compPath = path.join(__dirname, '..', comp);
  if (fs.existsSync(compPath)) {
    console.log(`  ✅ ${path.basename(comp)} exists`);
  } else {
    console.log(`  ❌ ${path.basename(comp)} not found`);
    errors++;
  }
});

// Check utilities
console.log('\n🛠️  Checking PWA utilities...');
const utilities = [
  'src/lib/offline-queue.ts',
  'src/lib/pwa-register.ts',
  'src/hooks/usePWA.ts',
];

utilities.forEach((util) => {
  const utilPath = path.join(__dirname, '..', util);
  if (fs.existsSync(utilPath)) {
    console.log(`  ✅ ${path.basename(util)} exists`);
  } else {
    console.log(`  ❌ ${path.basename(util)} not found`);
    errors++;
  }
});

// Check offline page
console.log('\n📱 Checking offline page...');
const offlinePage = path.join(
  __dirname,
  '..',
  'src',
  'app',
  'offline',
  'page.tsx'
);
if (fs.existsSync(offlinePage)) {
  console.log('  ✅ Offline page exists');
} else {
  console.log('  ❌ Offline page not found');
  errors++;
}

// Check layout integration
console.log('\n🏗️  Checking layout integration...');
const layoutPath = path.join(__dirname, '..', 'src', 'app', 'layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  if (layoutContent.includes('PWAProvider')) {
    console.log('  ✅ PWAProvider integrated in layout');
  } else {
    console.log('  ⚠️  PWAProvider not found in layout');
    warnings++;
  }
  if (layoutContent.includes('manifest')) {
    console.log('  ✅ Manifest linked in metadata');
  } else {
    console.log('  ⚠️  Manifest not linked in metadata');
    warnings++;
  }
} else {
  console.log('  ❌ Layout file not found');
  errors++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Verification Summary\n');

if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed! PWA implementation is complete.');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(s) found`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warning(s) found`);
  }
}

console.log('\n💡 Next Steps:');
console.log('  1. Replace placeholder icons with proper PNG icons');
console.log('  2. Add screenshots to public/screenshots/');
console.log('  3. Test on real mobile devices');
console.log('  4. Build and test in production mode');
console.log('\n📖 See docs/PWA_IMPLEMENTATION.md for details\n');

process.exit(errors > 0 ? 1 : 0);
