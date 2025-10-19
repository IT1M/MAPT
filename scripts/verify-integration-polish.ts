#!/usr/bin/env tsx

/**
 * Verification Script for Integration and Polish
 * Checks that all components are properly integrated
 */

import fs from 'fs'
import path from 'path'

interface CheckResult {
  name: string
  passed: boolean
  message: string
}

const results: CheckResult[] = []

function checkFileExists(filePath: string, description: string): void {
  const fullPath = path.join(process.cwd(), filePath)
  const exists = fs.existsSync(fullPath)
  
  results.push({
    name: description,
    passed: exists,
    message: exists ? `✓ ${filePath}` : `✗ Missing: ${filePath}`,
  })
}

function checkFileContains(filePath: string, searchString: string, description: string): void {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    results.push({
      name: description,
      passed: false,
      message: `✗ File not found: ${filePath}`,
    })
    return
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8')
  const contains = content.includes(searchString)
  
  results.push({
    name: description,
    passed: contains,
    message: contains
      ? `✓ ${description}`
      : `✗ ${filePath} does not contain: ${searchString}`,
  })
}

console.log('🔍 Verifying Integration and Polish Implementation...\n')

// Check new component files
console.log('📦 Checking Component Files...')
checkFileExists('src/components/shared/SkeletonLoader.tsx', 'Skeleton Loader Component')
checkFileExists('src/components/shared/LoadingStates.tsx', 'Loading States Component')
checkFileExists('src/components/providers/GlobalKeyboardShortcutsProvider.tsx', 'Global Keyboard Shortcuts Provider')
checkFileExists('src/components/ui/Toast.tsx', 'Toast Notification System')
checkFileExists('src/components/shared/index.ts', 'Shared Components Index')
checkFileExists('src/components/providers/AppProviders.tsx', 'App Providers')

// Check utility files
console.log('\n🛠️  Checking Utility Files...')
checkFileExists('src/utils/error-handler-enhanced.ts', 'Enhanced Error Handler')
checkFileExists('src/utils/accessibility-enhanced.ts', 'Enhanced Accessibility Utilities')
checkFileExists('src/utils/responsive-design.ts', 'Responsive Design Utilities')

// Check documentation
console.log('\n📚 Checking Documentation...')
checkFileExists('docs/ACCESSIBILITY_RESPONSIVE_GUIDE.md', 'Accessibility & Responsive Guide')
checkFileExists('.kiro/specs/auth-dashboard-enhancement/INTEGRATION_POLISH_SUMMARY.md', 'Integration Summary')

// Check integrations
console.log('\n🔗 Checking Integrations...')
checkFileContains(
  'src/app/(dashboard)/layout.tsx',
  'GlobalKeyboardShortcutsProvider',
  'Global Keyboard Shortcuts integrated in layout'
)
checkFileContains(
  'src/app/(dashboard)/layout.tsx',
  'PageErrorBoundary',
  'Error Boundary integrated in layout'
)

// Check exports
console.log('\n📤 Checking Exports...')
checkFileContains(
  'src/components/shared/index.ts',
  'ErrorBoundary',
  'ErrorBoundary exported from shared'
)
checkFileContains(
  'src/components/shared/index.ts',
  'SkeletonLoader',
  'SkeletonLoader exported from shared'
)
checkFileContains(
  'src/components/shared/index.ts',
  'LoadingStates',
  'LoadingStates exported from shared'
)

// Print results
console.log('\n' + '='.repeat(60))
console.log('📊 Verification Results')
console.log('='.repeat(60) + '\n')

const passed = results.filter((r) => r.passed).length
const failed = results.filter((r) => !r.passed).length
const total = results.length

results.forEach((result) => {
  console.log(result.message)
})

console.log('\n' + '='.repeat(60))
console.log(`✅ Passed: ${passed}/${total}`)
console.log(`❌ Failed: ${failed}/${total}`)
console.log('='.repeat(60))

if (failed > 0) {
  console.log('\n⚠️  Some checks failed. Please review the issues above.')
  process.exit(1)
} else {
  console.log('\n🎉 All checks passed! Integration and Polish is complete.')
  process.exit(0)
}
