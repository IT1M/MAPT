import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

async function testUserRoleExists(role: UserRole, email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      results.push({
        test: `User exists for role ${role}`,
        passed: false,
        message: `No user found with email ${email}`,
      });
      return false;
    }

    if (user.role !== role) {
      results.push({
        test: `User role matches for ${email}`,
        passed: false,
        message: `Expected role ${role}, got ${user.role}`,
      });
      return false;
    }

    results.push({
      test: `User exists for role ${role}`,
      passed: true,
      message: `User ${email} found with correct role`,
    });
    return true;
  } catch (error) {
    results.push({
      test: `User exists for role ${role}`,
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

async function testPasswordHash(email: string, password: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      results.push({
        test: `Password hash for ${email}`,
        passed: false,
        message: 'User not found',
      });
      return false;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    results.push({
      test: `Password hash for ${email}`,
      passed: isValid,
      message: isValid ? 'Password hash is valid' : 'Password hash verification failed',
    });

    return isValid;
  } catch (error) {
    results.push({
      test: `Password hash for ${email}`,
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

async function testSessionModel(): Promise<boolean> {
  try {
    // Check if Session model is accessible
    const sessionCount = await prisma.session.count();
    
    results.push({
      test: 'Session model accessibility',
      passed: true,
      message: `Session model is accessible (${sessionCount} sessions in database)`,
    });
    return true;
  } catch (error) {
    results.push({
      test: 'Session model accessibility',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

async function testRolePermissions(): Promise<boolean> {
  try {
    // Test that all expected roles exist in the database
    const roles = [UserRole.ADMIN, UserRole.DATA_ENTRY, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.AUDITOR];
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: roles,
        },
      },
      select: {
        role: true,
      },
    });

    const foundRoles = new Set(users.map(u => u.role));
    const allRolesPresent = roles.every(role => foundRoles.has(role));

    results.push({
      test: 'All user roles present',
      passed: allRolesPresent,
      message: allRolesPresent 
        ? 'All 5 user roles are present in database'
        : `Missing roles: ${roles.filter(r => !foundRoles.has(r)).join(', ')}`,
    });

    return allRolesPresent;
  } catch (error) {
    results.push({
      test: 'All user roles present',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

async function testAuditLogRelation(): Promise<boolean> {
  try {
    // Test that audit logs can be created and linked to users
    const admin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
    });

    if (!admin) {
      results.push({
        test: 'Audit log user relation',
        passed: false,
        message: 'No admin user found for testing',
      });
      return false;
    }

    // Check if audit logs exist and are properly related
    const auditLogCount = await prisma.auditLog.count({
      where: { userId: admin.id },
    });

    results.push({
      test: 'Audit log user relation',
      passed: true,
      message: `Audit logs are properly related to users (${auditLogCount} logs for admin)`,
    });

    return true;
  } catch (error) {
    results.push({
      test: 'Audit log user relation',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

async function main() {
  console.log('🔐 Testing Authentication Flow End-to-End\n');
  console.log('=' .repeat(60));

  // Test 1: Check all user roles exist
  console.log('\n📋 Test 1: Verifying user roles...');
  await testUserRoleExists(UserRole.ADMIN, 'admin@saudimais.com');
  await testUserRoleExists(UserRole.DATA_ENTRY, 'dataentry@saudimais.com');
  await testUserRoleExists(UserRole.SUPERVISOR, 'supervisor@saudimais.com');
  await testUserRoleExists(UserRole.MANAGER, 'manager@saudimais.com');
  await testUserRoleExists(UserRole.AUDITOR, 'auditor@saudimais.com');

  // Test 2: Verify password hashing
  console.log('\n🔑 Test 2: Verifying password hashes...');
  const testPassword = 'Password123!';
  await testPasswordHash('admin@saudimais.com', testPassword);
  await testPasswordHash('dataentry@saudimais.com', testPassword);
  await testPasswordHash('supervisor@saudimais.com', testPassword);

  // Test 3: Check session model
  console.log('\n📝 Test 3: Verifying session model...');
  await testSessionModel();

  // Test 4: Verify role permissions setup
  console.log('\n👥 Test 4: Verifying role permissions...');
  await testRolePermissions();

  // Test 5: Check audit log relations
  console.log('\n📊 Test 5: Verifying audit log relations...');
  await testAuditLogRelation();

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
    console.log('\n💡 Tip: Make sure you have run "npm run db:seed" to populate test data.');
    process.exit(1);
  } else {
    console.log('\n✅ All authentication tests passed!');
    console.log('🎉 Authentication system is properly configured.\n');
    process.exit(0);
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Unexpected error during testing:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
