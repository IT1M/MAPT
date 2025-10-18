#!/usr/bin/env ts-node

/**
 * Translation Validation CLI Script
 * Validates translation completeness and consistency
 * 
 * Usage:
 *   npm run validate:translations
 *   ts-node scripts/validate-translations.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  validateTranslations,
  formatValidationReport,
  generateJSONReport,
  type ValidationResult,
} from '../src/utils/translation-validator';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function loadTranslationFile(locale: string): Record<string, any> {
  const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Translation file not found: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function main() {
  console.log(colorize('\n🌍 Translation Validation Tool\n', 'cyan'));
  
  try {
    // Load translation files
    console.log('Loading translation files...');
    const locales = ['en', 'ar'];
    const translations: Record<string, Record<string, any>> = {};
    
    for (const locale of locales) {
      try {
        translations[locale] = loadTranslationFile(locale);
        console.log(colorize(`  ✓ Loaded ${locale}.json`, 'green'));
      } catch (error) {
        console.error(colorize(`  ✗ Failed to load ${locale}.json: ${error}`, 'red'));
        process.exit(1);
      }
    }
    
    console.log('');
    
    // Validate translations
    console.log('Validating translations...\n');
    const results = validateTranslations(translations, 'en');
    
    // Display results for each locale
    let hasErrors = false;
    
    for (const locale in results) {
      const result = results[locale];
      const report = formatValidationReport(result, locale);
      
      console.log(report);
      
      if (!result.isValid) {
        hasErrors = true;
      }
    }
    
    // Generate JSON report if requested
    const args = process.argv.slice(2);
    if (args.includes('--json')) {
      const jsonReport = generateJSONReport(results);
      const reportPath = path.join(process.cwd(), 'translation-validation-report.json');
      fs.writeFileSync(reportPath, jsonReport, 'utf-8');
      console.log(colorize(`\n📄 JSON report saved to: ${reportPath}\n`, 'blue'));
    }
    
    // Summary
    console.log(colorize('='.repeat(60), 'cyan'));
    
    if (hasErrors) {
      console.log(colorize('\n❌ Translation validation FAILED', 'red'));
      console.log(colorize('Please fix the issues above before deploying.\n', 'yellow'));
      process.exit(1);
    } else {
      console.log(colorize('\n✅ All translations are valid!', 'green'));
      console.log(colorize('Your translations are ready for deployment.\n', 'green'));
      process.exit(0);
    }
  } catch (error) {
    console.error(colorize(`\n❌ Error: ${error}\n`, 'red'));
    process.exit(1);
  }
}

// Run the script
main();
