#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 *
 * This script analyzes the Next.js build output to identify large bundles
 * and provides recommendations for optimization.
 *
 * Usage: node scripts/analyze-bundle.js
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(process.cwd(), '.next');
const BUILD_MANIFEST = path.join(BUILD_DIR, 'build-manifest.json');
const THRESHOLD_KB = 200; // Target: main chunk < 200KB

console.log('🔍 Analyzing Next.js bundle...\n');

// Check if build exists
if (!fs.existsSync(BUILD_DIR)) {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Read build manifest
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(BUILD_MANIFEST, 'utf8'));
} catch (error) {
  console.error('❌ Failed to read build manifest:', error.message);
  process.exit(1);
}

// Analyze pages
console.log('📊 Page Bundle Sizes:\n');

const pages = Object.keys(manifest.pages);
const largeBundles = [];

pages.forEach((page) => {
  const files = manifest.pages[page];
  let totalSize = 0;

  files.forEach((file) => {
    const filePath = path.join(BUILD_DIR, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    }
  });

  const sizeKB = (totalSize / 1024).toFixed(2);
  const status = totalSize / 1024 > THRESHOLD_KB ? '⚠️' : '✅';

  console.log(`${status} ${page}: ${sizeKB} KB`);

  if (totalSize / 1024 > THRESHOLD_KB) {
    largeBundles.push({ page, sizeKB });
  }
});

// Recommendations
console.log('\n📋 Optimization Recommendations:\n');

if (largeBundles.length === 0) {
  console.log('✅ All bundles are within the target size (<200KB)');
} else {
  console.log('⚠️  Large bundles detected:\n');
  largeBundles.forEach(({ page, sizeKB }) => {
    console.log(`   ${page}: ${sizeKB} KB`);
  });

  console.log('\n💡 Suggestions:');
  console.log('   1. Use dynamic imports for heavy components');
  console.log('   2. Lazy load charts and modals');
  console.log('   3. Optimize imports (import specific functions)');
  console.log('   4. Remove unused dependencies');
  console.log('   5. Use tree shaking for libraries');
}

console.log('\n✨ Analysis complete!');
