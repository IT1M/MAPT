import fs from 'fs';
import path from 'path';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function testLocaleFiles(): boolean {
  console.log('🌍 Testing locale files...');
  
  const locales = ['en', 'ar'];
  let allPassed = true;

  for (const locale of locales) {
    const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
    
    try {
      if (!fs.existsSync(filePath)) {
        results.push({
          test: `Locale file exists: ${locale}`,
          passed: false,
          message: `File not found: ${filePath}`,
        });
        allPassed = false;
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const translations = JSON.parse(content);

      results.push({
        test: `Locale file exists: ${locale}`,
        passed: true,
        message: `File found with ${Object.keys(translations).length} top-level keys`,
      });

      // Check for required translation keys
      const requiredKeys = ['common', 'navigation', 'auth', 'dashboard', 'errors'];
      const missingKeys = requiredKeys.filter(key => !translations[key]);

      if (missingKeys.length > 0) {
        results.push({
          test: `Required translation keys for ${locale}`,
          passed: false,
          message: `Missing keys: ${missingKeys.join(', ')}`,
        });
        allPassed = false;
      } else {
        results.push({
          test: `Required translation keys for ${locale}`,
          passed: true,
          message: 'All required keys present',
        });
      }
    } catch (error) {
      results.push({
        test: `Locale file parsing: ${locale}`,
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      allPassed = false;
    }
  }

  return allPassed;
}

function testLocaleConfiguration(): boolean {
  console.log('⚙️  Testing locale configuration...');
  
  const i18nPath = path.join(process.cwd(), 'src', 'i18n.ts');
  
  try {
    if (!fs.existsSync(i18nPath)) {
      results.push({
        test: 'i18n configuration file exists',
        passed: false,
        message: `File not found: ${i18nPath}`,
      });
      return false;
    }

    const content = fs.readFileSync(i18nPath, 'utf-8');

    // Check for locale definitions
    const hasLocales = content.includes("locales = ['en', 'ar']") || 
                       content.includes('locales = ["en", "ar"]');
    
    results.push({
      test: 'Locale definitions in i18n.ts',
      passed: hasLocales,
      message: hasLocales ? 'Locales defined correctly' : 'Locale definitions not found',
    });

    // Check for default locale
    const hasDefaultLocale = content.includes("defaultLocale: Locale = 'en'") ||
                             content.includes('defaultLocale: Locale = "en"');
    
    results.push({
      test: 'Default locale configuration',
      passed: hasDefaultLocale,
      message: hasDefaultLocale ? 'Default locale set to English' : 'Default locale not configured',
    });

    return hasLocales && hasDefaultLocale;
  } catch (error) {
    results.push({
      test: 'i18n configuration file',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

function testThemeToggleComponent(): boolean {
  console.log('🎨 Testing theme toggle component...');
  
  const themePath = path.join(process.cwd(), 'src', 'components', 'ui', 'theme-toggle.tsx');
  
  try {
    if (!fs.existsSync(themePath)) {
      results.push({
        test: 'Theme toggle component exists',
        passed: false,
        message: `File not found: ${themePath}`,
      });
      return false;
    }

    const content = fs.readFileSync(themePath, 'utf-8');

    // Check for next-themes usage
    const usesNextThemes = content.includes("from 'next-themes'");
    results.push({
      test: 'Theme toggle uses next-themes',
      passed: usesNextThemes,
      message: usesNextThemes ? 'next-themes imported' : 'next-themes not found',
    });

    // Check for useTheme hook
    const usesThemeHook = content.includes('useTheme()');
    results.push({
      test: 'Theme toggle uses useTheme hook',
      passed: usesThemeHook,
      message: usesThemeHook ? 'useTheme hook used' : 'useTheme hook not found',
    });

    // Check for setTheme function
    const hasSetTheme = content.includes('setTheme');
    results.push({
      test: 'Theme toggle has setTheme functionality',
      passed: hasSetTheme,
      message: hasSetTheme ? 'setTheme function present' : 'setTheme function not found',
    });

    // Check for accessibility
    const hasAriaLabel = content.includes('aria-label');
    results.push({
      test: 'Theme toggle has accessibility attributes',
      passed: hasAriaLabel,
      message: hasAriaLabel ? 'aria-label present' : 'aria-label not found',
    });

    return usesNextThemes && usesThemeHook && hasSetTheme && hasAriaLabel;
  } catch (error) {
    results.push({
      test: 'Theme toggle component',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

function testRTLSupport(): boolean {
  console.log('📝 Testing RTL support...');
  
  const layoutPath = path.join(process.cwd(), 'src', 'app', '[locale]', 'layout.tsx');
  
  try {
    if (!fs.existsSync(layoutPath)) {
      results.push({
        test: 'Locale layout file exists',
        passed: false,
        message: `File not found: ${layoutPath}`,
      });
      return false;
    }

    const content = fs.readFileSync(layoutPath, 'utf-8');

    // Check for dir attribute
    const hasDirAttribute = content.includes('dir=') || content.includes('dir:');
    results.push({
      test: 'RTL support with dir attribute',
      passed: hasDirAttribute,
      message: hasDirAttribute ? 'dir attribute found in layout' : 'dir attribute not found',
    });

    // Check for locale-based direction
    const hasRTLLogic = content.includes('rtl') || content.includes('ar');
    results.push({
      test: 'RTL logic for Arabic locale',
      passed: hasRTLLogic,
      message: hasRTLLogic ? 'RTL logic present' : 'RTL logic not found',
    });

    return hasDirAttribute && hasRTLLogic;
  } catch (error) {
    results.push({
      test: 'RTL support',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

function testTailwindDarkMode(): boolean {
  console.log('🌙 Testing Tailwind dark mode configuration...');
  
  const tailwindPath = path.join(process.cwd(), 'tailwind.config.ts');
  
  try {
    if (!fs.existsSync(tailwindPath)) {
      results.push({
        test: 'Tailwind config file exists',
        passed: false,
        message: `File not found: ${tailwindPath}`,
      });
      return false;
    }

    const content = fs.readFileSync(tailwindPath, 'utf-8');

    // Check for dark mode configuration
    const hasDarkMode = content.includes("darkMode: 'class'") || 
                        content.includes('darkMode: "class"');
    
    results.push({
      test: 'Tailwind dark mode configured',
      passed: hasDarkMode,
      message: hasDarkMode ? 'Dark mode set to class strategy' : 'Dark mode not configured',
    });

    return hasDarkMode;
  } catch (error) {
    results.push({
      test: 'Tailwind dark mode configuration',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

function testThemeProvider(): boolean {
  console.log('🎭 Testing theme provider setup...');
  
  const rootLayoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
  
  try {
    if (!fs.existsSync(rootLayoutPath)) {
      results.push({
        test: 'Root layout file exists',
        passed: false,
        message: `File not found: ${rootLayoutPath}`,
      });
      return false;
    }

    const content = fs.readFileSync(rootLayoutPath, 'utf-8');

    // Check for ThemeProvider
    const hasThemeProvider = content.includes('ThemeProvider');
    results.push({
      test: 'ThemeProvider in root layout',
      passed: hasThemeProvider,
      message: hasThemeProvider ? 'ThemeProvider found' : 'ThemeProvider not found',
    });

    return hasThemeProvider;
  } catch (error) {
    results.push({
      test: 'Theme provider setup',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

function testTranslationConsistency(): boolean {
  console.log('🔄 Testing translation consistency...');
  
  try {
    const enPath = path.join(process.cwd(), 'messages', 'en.json');
    const arPath = path.join(process.cwd(), 'messages', 'ar.json');

    const enContent = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    const arContent = JSON.parse(fs.readFileSync(arPath, 'utf-8'));

    const enKeys = Object.keys(enContent);
    const arKeys = Object.keys(arContent);

    // Check if both have the same top-level keys
    const missingInAr = enKeys.filter(key => !arKeys.includes(key));
    const missingInEn = arKeys.filter(key => !enKeys.includes(key));

    if (missingInAr.length > 0 || missingInEn.length > 0) {
      results.push({
        test: 'Translation key consistency',
        passed: false,
        message: `Missing in AR: ${missingInAr.join(', ') || 'none'}, Missing in EN: ${missingInEn.join(', ') || 'none'}`,
      });
      return false;
    }

    results.push({
      test: 'Translation key consistency',
      passed: true,
      message: 'Both locales have matching top-level keys',
    });

    return true;
  } catch (error) {
    results.push({
      test: 'Translation consistency',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

async function main() {
  console.log('🎨 Testing Theme and Locale Switching\n');
  console.log('=' .repeat(60));

  // Run all tests
  testLocaleFiles();
  testLocaleConfiguration();
  testThemeToggleComponent();
  testRTLSupport();
  testTailwindDarkMode();
  testThemeProvider();
  testTranslationConsistency();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.test}`);
    console.log(`   ${result.message}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n📈 Results: ${passed}/${total} tests passed`);

  if (failed > 0) {
    console.log(`\n❌ ${failed} test(s) failed. Please review the errors above.`);
    process.exit(1);
  } else {
    console.log('\n✅ All theme and locale tests passed!');
    console.log('🎉 Theme switching and internationalization are properly configured.\n');
    console.log('💡 Manual testing checklist:');
    console.log('   1. Start the app and toggle between light/dark themes');
    console.log('   2. Verify theme persists after page reload');
    console.log('   3. Switch between English and Arabic locales');
    console.log('   4. Verify RTL layout for Arabic');
    console.log('   5. Check that locale preference persists\n');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('\n❌ Unexpected error during testing:', error);
  process.exit(1);
});
