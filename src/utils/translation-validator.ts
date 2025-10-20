/**
 * Translation Validation Utility
 * Validates translation completeness and consistency between locales
 */

export interface ValidationResult {
  isValid: boolean;
  missingKeys: string[];
  extraKeys: string[];
  inconsistencies: TranslationInconsistency[];
  summary: ValidationSummary;
}

export interface TranslationInconsistency {
  key: string;
  issue: 'placeholder_mismatch' | 'type_mismatch' | 'empty_value';
  details: string;
  sourceValue?: any;
  targetValue?: any;
}

export interface ValidationSummary {
  totalKeys: number;
  validKeys: number;
  missingKeysCount: number;
  extraKeysCount: number;
  inconsistenciesCount: number;
}

/**
 * Extract all keys from a nested object with dot notation
 */
function extractKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        keys.push(...extractKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }

  return keys;
}

/**
 * Get value from nested object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Extract placeholder variables from a string (e.g., {count}, {name})
 */
function extractPlaceholders(str: string): string[] {
  const matches = str.match(/\{([^}]+)\}/g);
  return matches ? matches.map((m) => m.slice(1, -1)) : [];
}

/**
 * Compare translation keys between two locales
 */
export function compareTranslations(
  sourceLocale: Record<string, any>,
  targetLocale: Record<string, any>,
  sourceLocaleName = 'source',
  targetLocaleName = 'target'
): ValidationResult {
  const sourceKeys = extractKeys(sourceLocale);
  const targetKeys = extractKeys(targetLocale);

  const sourceKeySet = new Set(sourceKeys);
  const targetKeySet = new Set(targetKeys);

  // Find missing keys (in source but not in target)
  const missingKeys = sourceKeys.filter((key) => !targetKeySet.has(key));

  // Find extra keys (in target but not in source)
  const extraKeys = targetKeys.filter((key) => !sourceKeySet.has(key));

  // Find inconsistencies in common keys
  const commonKeys = sourceKeys.filter((key) => targetKeySet.has(key));
  const inconsistencies: TranslationInconsistency[] = [];

  for (const key of commonKeys) {
    const sourceValue = getNestedValue(sourceLocale, key);
    const targetValue = getNestedValue(targetLocale, key);

    // Check for empty values
    if (
      targetValue === '' ||
      targetValue === null ||
      targetValue === undefined
    ) {
      inconsistencies.push({
        key,
        issue: 'empty_value',
        details: `Translation is empty in ${targetLocaleName}`,
        sourceValue,
        targetValue,
      });
      continue;
    }

    // Check for type mismatch
    if (typeof sourceValue !== typeof targetValue) {
      inconsistencies.push({
        key,
        issue: 'type_mismatch',
        details: `Type mismatch: ${typeof sourceValue} in ${sourceLocaleName}, ${typeof targetValue} in ${targetLocaleName}`,
        sourceValue,
        targetValue,
      });
      continue;
    }

    // Check for placeholder consistency (only for strings)
    if (typeof sourceValue === 'string' && typeof targetValue === 'string') {
      const sourcePlaceholders = extractPlaceholders(sourceValue);
      const targetPlaceholders = extractPlaceholders(targetValue);

      const sourcePlaceholderSet = new Set(sourcePlaceholders);
      const targetPlaceholderSet = new Set(targetPlaceholders);

      const missingPlaceholders = sourcePlaceholders.filter(
        (p) => !targetPlaceholderSet.has(p)
      );
      const extraPlaceholders = targetPlaceholders.filter(
        (p) => !sourcePlaceholderSet.has(p)
      );

      if (missingPlaceholders.length > 0 || extraPlaceholders.length > 0) {
        const details: string[] = [];
        if (missingPlaceholders.length > 0) {
          details.push(
            `Missing placeholders: ${missingPlaceholders.join(', ')}`
          );
        }
        if (extraPlaceholders.length > 0) {
          details.push(`Extra placeholders: ${extraPlaceholders.join(', ')}`);
        }

        inconsistencies.push({
          key,
          issue: 'placeholder_mismatch',
          details: details.join('; '),
          sourceValue,
          targetValue,
        });
      }
    }
  }

  const summary: ValidationSummary = {
    totalKeys: sourceKeys.length,
    validKeys: commonKeys.length - inconsistencies.length,
    missingKeysCount: missingKeys.length,
    extraKeysCount: extraKeys.length,
    inconsistenciesCount: inconsistencies.length,
  };

  const isValid = missingKeys.length === 0 && inconsistencies.length === 0;

  return {
    isValid,
    missingKeys,
    extraKeys,
    inconsistencies,
    summary,
  };
}

/**
 * Validate all translations against a source locale
 */
export function validateTranslations(
  translations: Record<string, Record<string, any>>,
  sourceLocale = 'en'
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};
  const source = translations[sourceLocale];

  if (!source) {
    throw new Error(
      `Source locale "${sourceLocale}" not found in translations`
    );
  }

  for (const locale in translations) {
    if (locale !== sourceLocale) {
      results[locale] = compareTranslations(
        source,
        translations[locale],
        sourceLocale,
        locale
      );
    }
  }

  return results;
}

/**
 * Format validation results as a readable report
 */
export function formatValidationReport(
  result: ValidationResult,
  localeName: string
): string {
  const lines: string[] = [];

  lines.push(`\n=== Translation Validation Report for "${localeName}" ===\n`);

  // Summary
  lines.push('Summary:');
  lines.push(`  Total Keys: ${result.summary.totalKeys}`);
  lines.push(`  Valid Keys: ${result.summary.validKeys}`);
  lines.push(`  Missing Keys: ${result.summary.missingKeysCount}`);
  lines.push(`  Extra Keys: ${result.summary.extraKeysCount}`);
  lines.push(`  Inconsistencies: ${result.summary.inconsistenciesCount}`);
  lines.push(`  Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n`);

  // Missing keys
  if (result.missingKeys.length > 0) {
    lines.push(`Missing Keys (${result.missingKeys.length}):`);
    result.missingKeys.forEach((key) => {
      lines.push(`  ❌ ${key}`);
    });
    lines.push('');
  }

  // Extra keys
  if (result.extraKeys.length > 0) {
    lines.push(`Extra Keys (${result.extraKeys.length}):`);
    result.extraKeys.forEach((key) => {
      lines.push(`  ⚠️  ${key}`);
    });
    lines.push('');
  }

  // Inconsistencies
  if (result.inconsistencies.length > 0) {
    lines.push(`Inconsistencies (${result.inconsistencies.length}):`);
    result.inconsistencies.forEach((inc) => {
      lines.push(`  ⚠️  ${inc.key}`);
      lines.push(`     Issue: ${inc.issue}`);
      lines.push(`     Details: ${inc.details}`);
      if (inc.sourceValue !== undefined) {
        lines.push(`     Source: "${inc.sourceValue}"`);
      }
      if (inc.targetValue !== undefined) {
        lines.push(`     Target: "${inc.targetValue}"`);
      }
      lines.push('');
    });
  }

  if (result.isValid) {
    lines.push('✅ All translations are valid!\n');
  } else {
    lines.push(
      '❌ Translation validation failed. Please fix the issues above.\n'
    );
  }

  return lines.join('\n');
}

/**
 * Generate a JSON report of validation results
 */
export function generateJSONReport(
  results: Record<string, ValidationResult>
): string {
  return JSON.stringify(results, null, 2);
}
