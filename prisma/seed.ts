import { PrismaClient, UserRole, Destination, AuditAction, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in correct order to respect foreign key constraints)
  console.log('🧹 Cleaning existing data...');
  await prisma.systemSettings.deleteMany();
  await prisma.backup.deleteMany();
  await prisma.report.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // SUBTASK 10.1: Seed default users for all roles
  // ============================================
  console.log('👥 Creating default users for all roles...');
  const password = 'Password123!'; // Known password for all test users
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@mais.sa',
      name: 'Administrator',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          lowStock: true,
          expiryAlerts: true,
        },
      },
    },
  });

  const dataEntry = await prisma.user.create({
    data: {
      email: 'dataentry@mais.sa',
      name: 'Data Entry Operator',
      passwordHash,
      role: UserRole.DATA_ENTRY,
      isActive: true,
      preferences: {
        theme: 'system',
        language: 'ar',
        notifications: {
          email: false,
          lowStock: false,
          expiryAlerts: false,
        },
      },
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@mais.sa',
      name: 'Inventory Supervisor',
      passwordHash,
      role: UserRole.SUPERVISOR,
      isActive: true,
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          lowStock: true,
          expiryAlerts: false,
        },
      },
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@mais.sa',
      name: 'Inventory Manager',
      passwordHash,
      role: UserRole.MANAGER,
      isActive: true,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          lowStock: true,
          expiryAlerts: true,
        },
      },
    },
  });

  const auditor = await prisma.user.create({
    data: {
      email: 'auditor@mais.sa',
      name: 'System Auditor',
      passwordHash,
      role: UserRole.AUDITOR,
      isActive: true,
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: {
          email: true,
          lowStock: false,
          expiryAlerts: false,
        },
      },
    },
  });

  console.log('✅ Created 5 users with roles: ADMIN, DATA_ENTRY, SUPERVISOR, MANAGER, AUDITOR');

  // ============================================
  // SUBTASK 10.2: Seed sample inventory items
  // ============================================
  console.log('📦 Creating sample inventory items...');
  const inventoryItems = await Promise.all([
    // Item 1: Surgical Gloves - MAIS destination
    prisma.inventoryItem.create({
      data: {
        itemName: 'Surgical Gloves - Large',
        batch: 'SG2024-001',
        quantity: 500,
        reject: 15,
        destination: Destination.MAIS,
        category: 'PPE',
        notes: 'Sterile latex surgical gloves, size large',
        enteredById: dataEntry.id,
      },
    }),
    // Item 2: Disposable Face Masks - FOZAN destination
    prisma.inventoryItem.create({
      data: {
        itemName: 'Disposable Face Masks',
        batch: 'FM2024-045',
        quantity: 1200,
        reject: 0,
        destination: Destination.FOZAN,
        category: 'PPE',
        notes: '3-ply disposable face masks',
        enteredById: dataEntry.id,
      },
    }),
    // Item 3: Insulin Syringes - MAIS destination with rejects
    prisma.inventoryItem.create({
      data: {
        itemName: 'Insulin Syringes 1ml',
        batch: 'IS2024-123',
        quantity: 300,
        reject: 25,
        destination: Destination.MAIS,
        category: 'Syringes',
        notes: 'Sterile insulin syringes with 29G needle',
        enteredById: supervisor.id,
      },
    }),
    // Item 4: Gauze Bandages - FOZAN destination
    prisma.inventoryItem.create({
      data: {
        itemName: 'Gauze Bandages 4x4',
        batch: 'GB2024-078',
        quantity: 800,
        reject: 10,
        destination: Destination.FOZAN,
        category: 'Wound Care',
        notes: 'Sterile gauze bandages 4x4 inches',
        enteredById: dataEntry.id,
      },
    }),
    // Item 5: Digital Thermometers - MAIS destination
    prisma.inventoryItem.create({
      data: {
        itemName: 'Digital Thermometer',
        batch: 'DT2024-012',
        quantity: 150,
        reject: 5,
        destination: Destination.MAIS,
        category: 'Diagnostic Equipment',
        enteredById: supervisor.id,
      },
    }),
    // Item 6: Alcohol Swabs - FOZAN destination
    prisma.inventoryItem.create({
      data: {
        itemName: 'Alcohol Swabs',
        batch: 'AS2024-089',
        quantity: 2000,
        reject: 0,
        destination: Destination.FOZAN,
        category: 'Disinfectants',
        notes: 'Sterile alcohol prep pads, 70% isopropyl',
        enteredById: dataEntry.id,
      },
    }),
    // Item 7: IV Catheters - MAIS destination with high rejects
    prisma.inventoryItem.create({
      data: {
        itemName: 'IV Catheters 20G',
        batch: 'IV2024-056',
        quantity: 400,
        reject: 50,
        destination: Destination.MAIS,
        category: 'IV Supplies',
        notes: 'Peripheral IV catheters, 20 gauge',
        enteredById: supervisor.id,
      },
    }),
    // Item 8: Blood Collection Tubes - FOZAN destination
    prisma.inventoryItem.create({
      data: {
        itemName: 'Blood Collection Tubes',
        batch: 'BCT2024-033',
        quantity: 600,
        reject: 8,
        destination: Destination.FOZAN,
        category: 'Laboratory',
        notes: 'Vacuum blood collection tubes with EDTA',
        enteredById: dataEntry.id,
      },
    }),
    // Item 9: Surgical Masks N95 - MAIS destination
    prisma.inventoryItem.create({
      data: {
        itemName: 'N95 Respirator Masks',
        batch: 'N95-2024-021',
        quantity: 350,
        reject: 12,
        destination: Destination.MAIS,
        category: 'PPE',
        notes: 'NIOSH-approved N95 respirator masks',
        enteredById: supervisor.id,
      },
    }),
    // Item 10: Sterile Gloves Medium - FOZAN destination
    prisma.inventoryItem.create({
      data: {
        itemName: 'Sterile Gloves - Medium',
        batch: 'SG2024-002',
        quantity: 450,
        reject: 20,
        destination: Destination.FOZAN,
        category: 'PPE',
        notes: 'Powder-free sterile examination gloves',
        enteredById: dataEntry.id,
      },
    }),
  ]);

  console.log(`✅ Created ${inventoryItems.length} inventory items with varied destinations and categories`);

  // ============================================
  // SUBTASK 10.3: Seed default system settings
  // ============================================
  console.log('⚙️  Creating default system settings...');
  await Promise.all([
    // Theme settings
    prisma.systemSettings.create({
      data: {
        key: 'theme.default',
        value: 'light',
        category: 'theme',
        updatedById: admin.id,
      },
    }),
    prisma.systemSettings.create({
      data: {
        key: 'theme.allowUserOverride',
        value: true,
        category: 'theme',
        updatedById: admin.id,
      },
    }),
    // Notification settings
    prisma.systemSettings.create({
      data: {
        key: 'notifications.emailEnabled',
        value: true,
        category: 'notifications',
        updatedById: admin.id,
      },
    }),
    prisma.systemSettings.create({
      data: {
        key: 'notifications.lowStockThreshold',
        value: { percentage: 20, absolute: 50 },
        category: 'notifications',
        updatedById: admin.id,
      },
    }),
    // Stock threshold settings
    prisma.systemSettings.create({
      data: {
        key: 'inventory.criticalStockLevel',
        value: 100,
        category: 'inventory',
        updatedById: admin.id,
      },
    }),
    prisma.systemSettings.create({
      data: {
        key: 'inventory.maxRejectPercentage',
        value: 15,
        category: 'inventory',
        updatedById: admin.id,
      },
    }),
    // API configuration settings
    prisma.systemSettings.create({
      data: {
        key: 'api.rateLimit',
        value: { requestsPerMinute: 100, burstLimit: 150 },
        category: 'api',
        updatedById: admin.id,
      },
    }),
  ]);

  console.log('✅ Created 7 system settings across theme, notifications, inventory, and api categories');

  // ============================================
  // SUBTASK 10.4: Seed sample audit logs
  // ============================================
  console.log('📋 Creating sample audit logs...');
  
  // Audit log 1: Inventory item creation
  await prisma.auditLog.create({
    data: {
      userId: dataEntry.id,
      action: AuditAction.CREATE,
      entityType: 'InventoryItem',
      entityId: inventoryItems[0].id,
      oldValue: Prisma.JsonNull,
      newValue: {
        itemName: 'Surgical Gloves - Large',
        batch: 'SG2024-001',
        quantity: 500,
        reject: 15,
        destination: 'MAIS',
      },
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(),
    },
  });

  // Audit log 2: Inventory item update
  await prisma.auditLog.create({
    data: {
      userId: supervisor.id,
      action: AuditAction.UPDATE,
      entityType: 'InventoryItem',
      entityId: inventoryItems[2].id,
      oldValue: {
        quantity: 350,
        reject: 20,
      },
      newValue: {
        quantity: 300,
        reject: 25,
      },
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      timestamp: new Date(),
    },
  });

  // Audit log 3: User login
  await prisma.auditLog.create({
    data: {
      userId: manager.id,
      action: AuditAction.LOGIN,
      entityType: 'Session',
      entityId: null,
      oldValue: Prisma.JsonNull,
      newValue: {
        loginTime: new Date().toISOString(),
        method: 'credentials',
      },
      ipAddress: '192.168.1.110',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      timestamp: new Date(),
    },
  });

  // Audit log 4: Data export
  await prisma.auditLog.create({
    data: {
      userId: auditor.id,
      action: AuditAction.EXPORT,
      entityType: 'Report',
      entityId: null,
      oldValue: Prisma.JsonNull,
      newValue: {
        reportType: 'MONTHLY',
        format: 'CSV',
        recordCount: 150,
      },
      ipAddress: '192.168.1.115',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      timestamp: new Date(),
    },
  });

  // Audit log 5: Inventory item deletion (no entityId since item was deleted)
  await prisma.auditLog.create({
    data: {
      userId: supervisor.id,
      action: AuditAction.DELETE,
      entityType: 'InventoryItem',
      entityId: null,
      oldValue: {
        itemName: 'Expired Bandages',
        batch: 'EB2023-001',
        quantity: 50,
        reject: 50,
      },
      newValue: Prisma.JsonNull,
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      timestamp: new Date(),
    },
  });

  console.log('✅ Created 5 audit log entries with different action types (CREATE, UPDATE, LOGIN, EXPORT, DELETE)');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Test User Credentials:');
  console.log('   Email: admin@mais.sa | Password: Password123! | Role: ADMIN');
  console.log('   Email: dataentry@mais.sa | Password: Password123! | Role: DATA_ENTRY');
  console.log('   Email: supervisor@mais.sa | Password: Password123! | Role: SUPERVISOR');
  console.log('   Email: manager@mais.sa | Password: Password123! | Role: MANAGER');
  console.log('   Email: auditor@mais.sa | Password: Password123! | Role: AUDITOR');
  console.log('\n📊 Seeded Data Summary:');
  console.log(`   - ${5} users with different roles and preferences`);
  console.log(`   - ${inventoryItems.length} inventory items (MAIS: 5, FOZAN: 5)`);
  console.log(`   - ${7} system settings across 4 categories`);
  console.log(`   - ${5} audit log entries`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
