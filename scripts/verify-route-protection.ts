#!/usr/bin/env tsx
/**
 * Route Protection Verification Script
 * Validates that route permissions are correctly configured
 */

import {
  ROUTE_PERMISSIONS,
  type UserRole,
} from '../src/utils/route-permissions';
import { navigationConfig } from '../src/config/navigation';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function checkMark(condition: boolean): string {
  return condition
    ? `${colors.green}✓${colors.reset}`
    : `${colors.red}✗${colors.reset}`;
}

// Verification checks
let totalChecks = 0;
let passedChecks = 0;

function check(description: string, condition: boolean) {
  totalChecks++;
  if (condition) {
    passedChecks++;
  }
  console.log(`${checkMark(condition)} ${description}`);
  return condition;
}

// Main verification
async function verifyRouteProtection() {
  log('\n🔒 Route Protection Verification\n', 'blue');

  // 1. Check that all navigation items have corresponding route permissions
  logSection('1. Navigation Config Sync');

  const navRoutes = navigationConfig.map((item) => item.href);
  const permissionRoutes = Object.keys(ROUTE_PERMISSIONS);

  navRoutes.forEach((route) => {
    const hasPermission = permissionRoutes.includes(route);
    check(`Navigation route "${route}" has permission config`, hasPermission);
  });

  // 2. Check that all routes have at least one role
  logSection('2. Route Permission Completeness');

  Object.entries(ROUTE_PERMISSIONS).forEach(([route, roles]) => {
    check(`Route "${route}" has at least one role`, roles.length > 0);
  });

  // 3. Check that ADMIN has access to all routes
  logSection('3. Admin Access Verification');

  Object.entries(ROUTE_PERMISSIONS).forEach(([route, roles]) => {
    check(`ADMIN has access to "${route}"`, roles.includes('ADMIN'));
  });

  // 4. Check for duplicate roles in any route
  logSection('4. Duplicate Role Check');

  Object.entries(ROUTE_PERMISSIONS).forEach(([route, roles]) => {
    const uniqueRoles = [...new Set(roles)];
    check(
      `Route "${route}" has no duplicate roles`,
      roles.length === uniqueRoles.length
    );
  });

  // 5. Check navigation roles match route permissions
  logSection('5. Navigation-Permission Role Sync');

  navigationConfig.forEach((item) => {
    const routeRoles = ROUTE_PERMISSIONS[item.href];
    if (routeRoles) {
      const navRolesSet = new Set(item.roles);
      const routeRolesSet = new Set(routeRoles);

      const rolesMatch =
        navRolesSet.size === routeRolesSet.size &&
        [...navRolesSet].every((role) => routeRolesSet.has(role));

      check(
        `Navigation "${item.id}" roles match route permissions`,
        rolesMatch
      );

      if (!rolesMatch) {
        log(`  Nav roles: ${[...navRolesSet].join(', ')}`, 'yellow');
        log(`  Route roles: ${[...routeRolesSet].join(', ')}`, 'yellow');
      }
    }
  });

  // 6. Check that critical routes are properly restricted
  logSection('6. Critical Route Restrictions');

  const criticalRoutes = {
    '/audit': ['ADMIN', 'AUDITOR'],
    '/backup': ['ADMIN', 'MANAGER'],
  };

  Object.entries(criticalRoutes).forEach(([route, expectedRoles]) => {
    const actualRoles = ROUTE_PERMISSIONS[route];
    const rolesMatch =
      actualRoles &&
      actualRoles.length === expectedRoles.length &&
      expectedRoles.every((role) => actualRoles.includes(role as UserRole));

    check(`Critical route "${route}" has correct restrictions`, rolesMatch);

    if (!rolesMatch && actualRoles) {
      log(`  Expected: ${expectedRoles.join(', ')}`, 'yellow');
      log(`  Actual: ${actualRoles.join(', ')}`, 'yellow');
    }
  });

  // 7. Check that all roles are valid
  logSection('7. Valid Role Check');

  const validRoles: UserRole[] = [
    'ADMIN',
    'DATA_ENTRY',
    'SUPERVISOR',
    'MANAGER',
    'AUDITOR',
  ];

  Object.entries(ROUTE_PERMISSIONS).forEach(([route, roles]) => {
    const allValid = roles.every((role) => validRoles.includes(role));
    check(`Route "${route}" has only valid roles`, allValid);

    if (!allValid) {
      const invalidRoles = roles.filter((role) => !validRoles.includes(role));
      log(`  Invalid roles: ${invalidRoles.join(', ')}`, 'red');
    }
  });

  // 8. Check role distribution
  logSection('8. Role Distribution Analysis');

  const roleAccessCount: Record<string, number> = {};
  validRoles.forEach((role) => {
    roleAccessCount[role] = 0;
  });

  Object.values(ROUTE_PERMISSIONS).forEach((roles) => {
    roles.forEach((role) => {
      roleAccessCount[role]++;
    });
  });

  console.log('\nRole access counts:');
  Object.entries(roleAccessCount).forEach(([role, count]) => {
    const percentage = ((count / permissionRoutes.length) * 100).toFixed(1);
    log(
      `  ${role}: ${count}/${permissionRoutes.length} routes (${percentage}%)`,
      'blue'
    );
  });

  // Summary
  logSection('Verification Summary');

  const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);

  console.log(`\nTotal checks: ${totalChecks}`);
  log(
    `Passed: ${passedChecks}`,
    passedChecks === totalChecks ? 'green' : 'yellow'
  );
  log(
    `Failed: ${totalChecks - passedChecks}`,
    totalChecks - passedChecks === 0 ? 'green' : 'red'
  );
  log(
    `Success rate: ${successRate}%\n`,
    passedChecks === totalChecks ? 'green' : 'yellow'
  );

  if (passedChecks === totalChecks) {
    log('✅ All route protection checks passed!', 'green');
  } else {
    log(
      '⚠️  Some route protection checks failed. Please review the output above.',
      'yellow'
    );
  }

  // Exit with appropriate code
  process.exit(passedChecks === totalChecks ? 0 : 1);
}

// Run verification
verifyRouteProtection().catch((error) => {
  log(`\n❌ Verification failed with error:`, 'red');
  console.error(error);
  process.exit(1);
});
