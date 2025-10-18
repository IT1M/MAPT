/**
 * Validate Audit/Backup/Report Configuration Script
 * Run this script to validate environment variables before deployment
 */

import { validateAllConfigs, printValidationResults } from '../src/utils/config-validation';

async function main() {
  console.log('Validating Audit/Backup/Report System Configuration...\n');

  const results = validateAllConfigs();
  printValidationResults(results);

  // Exit with error code if validation failed
  if (!results.valid) {
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Configuration validation failed:', error);
  process.exit(1);
});
