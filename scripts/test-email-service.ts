#!/usr/bin/env tsx

/**
 * Test script for email service
 * Tests email configuration and template rendering
 */

import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendSecurityAlertEmail,
  sendDailySummaryEmail,
  sendHighRejectRateAlert,
  sendBackupStatusEmail,
  sendReportReadyEmail,
  testEmailConfiguration,
} from '../src/services/email';

const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

async function testEmailService() {
  console.log('🧪 Testing Email Service Configuration...\n');

  // Test 1: Configuration
  console.log('1️⃣ Testing email configuration...');
  const configValid = await testEmailConfiguration();

  if (configValid) {
    console.log('✅ Email configuration is valid\n');
  } else {
    console.log('❌ Email configuration is invalid');
    console.log('Please check your SMTP/Resend settings in .env\n');
    return;
  }

  // Test 2: Welcome Email Template
  console.log('2️⃣ Testing welcome email template...');
  try {
    await sendWelcomeEmail(TEST_EMAIL, {
      userName: 'Test User',
      email: TEST_EMAIL,
      loginUrl: 'http://localhost:3000/login',
    });
    console.log('✅ Welcome email sent successfully\n');
  } catch (error) {
    console.log('❌ Failed to send welcome email:', error);
  }

  // Test 3: Password Reset Email Template
  console.log('3️⃣ Testing password reset email template...');
  try {
    await sendPasswordResetEmail(TEST_EMAIL, {
      userName: 'Test User',
      resetUrl: 'http://localhost:3000/reset-password?token=test123',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });
    console.log('✅ Password reset email sent successfully\n');
  } catch (error) {
    console.log('❌ Failed to send password reset email:', error);
  }

  // Test 4: Security Alert Email Template
  console.log('4️⃣ Testing security alert email template...');
  try {
    await sendSecurityAlertEmail(TEST_EMAIL, {
      userName: 'Test User',
      deviceType: 'Desktop',
      browser: 'Chrome',
      os: 'Windows 11',
      ipAddress: '192.168.1.1',
      location: 'Riyadh, Saudi Arabia',
      timestamp: new Date(),
    });
    console.log('✅ Security alert email sent successfully\n');
  } catch (error) {
    console.log('❌ Failed to send security alert email:', error);
  }

  // Test 5: Daily Summary Email Template
  console.log('5️⃣ Testing daily summary email template...');
  try {
    await sendDailySummaryEmail(TEST_EMAIL, {
      userName: 'Test User',
      date: new Date(),
      stats: {
        itemsAdded: 45,
        itemsUpdated: 12,
        totalValue: 125000,
        rejectRate: 3.5,
      },
      topItems: [
        { name: 'Medical Gloves', quantity: 500 },
        { name: 'Surgical Masks', quantity: 300 },
        { name: 'Hand Sanitizer', quantity: 200 },
      ],
      alerts: [
        { message: 'Low stock alert for Item A', severity: 'medium' },
        { message: 'High reject rate detected', severity: 'high' },
      ],
    });
    console.log('✅ Daily summary email sent successfully\n');
  } catch (error) {
    console.log('❌ Failed to send daily summary email:', error);
  }

  // Test 6: High Reject Rate Alert Template
  console.log('6️⃣ Testing high reject rate alert template...');
  try {
    await sendHighRejectRateAlert([TEST_EMAIL], {
      rejectRate: 18.5,
      threshold: 15,
      affectedItems: [
        { name: 'Medical Gloves', batch: 'BATCH-001', rejectCount: 45 },
        { name: 'Surgical Masks', batch: 'BATCH-002', rejectCount: 32 },
      ],
      dateRange: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    });
    console.log('✅ High reject rate alert sent successfully\n');
  } catch (error) {
    console.log('❌ Failed to send high reject rate alert:', error);
  }

  // Test 7: Backup Status Email Template (Success)
  console.log('7️⃣ Testing backup status email template (success)...');
  try {
    await sendBackupStatusEmail(TEST_EMAIL, {
      status: 'success',
      backupName: 'backup_2024_01_15.sql',
      timestamp: new Date(),
      size: '45.2 MB',
    });
    console.log('✅ Backup success email sent successfully\n');
  } catch (error) {
    console.log('❌ Failed to send backup success email:', error);
  }

  // Test 8: Backup Status Email Template (Failed)
  console.log('8️⃣ Testing backup status email template (failed)...');
  try {
    await sendBackupStatusEmail(TEST_EMAIL, {
      status: 'failed',
      backupName: 'backup_2024_01_15.sql',
      timestamp: new Date(),
      error: 'Insufficient disk space',
    });
    console.log('✅ Backup failure email sent successfully\n');
  } catch (error) {
    console.log('❌ Failed to send backup failure email:', error);
  }

  // Test 9: Report Ready Email Template
  console.log('9️⃣ Testing report ready email template...');
  try {
    await sendReportReadyEmail(TEST_EMAIL, {
      userName: 'Test User',
      reportTitle: 'Monthly Inventory Report',
      reportType: 'Inventory Summary',
      downloadUrl: 'http://localhost:3000/reports/download/report123',
      generatedAt: new Date(),
    });
    console.log('✅ Report ready email sent successfully\n');
  } catch (error) {
    console.log('❌ Failed to send report ready email:', error);
  }

  console.log('✨ Email service testing completed!');
  console.log('\n📧 Check your inbox at:', TEST_EMAIL);
  console.log('Note: If using SMTP, emails may take a few moments to arrive.');
}

// Run tests
testEmailService()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
