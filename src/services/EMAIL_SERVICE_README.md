# Email Service Documentation

## Overview

The email service provides a comprehensive email notification system for the Saudi Mais Inventory System. It supports multiple email providers (SMTP and Resend), includes professional email templates, automatic retry logic, and detailed analytics.

## Features

- ✅ Multiple email providers (SMTP, Resend)
- ✅ Professional HTML email templates
- ✅ Automatic retry logic with queue system
- ✅ Email delivery tracking and logging
- ✅ Email analytics dashboard
- ✅ Template-based email system
- ✅ Support for both HTML and plain text emails

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```bash
# Email Provider Selection
EMAIL_PROVIDER="smtp"  # or "resend"

# SMTP Configuration (when using SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Resend Configuration (when using Resend)
RESEND_API_KEY="re_your_api_key_here"

# Sender Information
SMTP_FROM="noreply@mais-inventory.com"
SMTP_FROM_NAME="Saudi Mais Inventory System"
ADMIN_EMAIL="admin@mais-inventory.com"
```

### SMTP Setup

#### Gmail

1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use `smtp.gmail.com` with port `587`

#### Office 365

1. Use `smtp.office365.com` with port `587`
2. Use your Office 365 credentials

#### Custom SMTP

Configure your SMTP server details accordingly.

### Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Set `EMAIL_PROVIDER="resend"` in your `.env`
4. Add your API key to `RESEND_API_KEY`

## Available Email Templates

### 1. Welcome Email

Sent when a new user registers.

```typescript
import { sendWelcomeEmail } from '@/services/email';

await sendWelcomeEmail('user@example.com', {
  userName: 'John Doe',
  email: 'user@example.com',
  loginUrl: 'https://app.com/login',
});
```

### 2. Password Reset Email

Sent when a user requests a password reset.

```typescript
import { sendPasswordResetEmail } from '@/services/email';

await sendPasswordResetEmail('user@example.com', {
  userName: 'John Doe',
  resetUrl: 'https://app.com/reset-password?token=abc123',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
});
```

### 3. Security Alert Email

Sent when a new device login is detected.

```typescript
import { sendSecurityAlertEmail } from '@/services/email';

await sendSecurityAlertEmail('user@example.com', {
  userName: 'John Doe',
  deviceType: 'Desktop',
  browser: 'Chrome',
  os: 'Windows 11',
  ipAddress: '192.168.1.1',
  location: 'Riyadh, Saudi Arabia',
  timestamp: new Date(),
});
```

### 4. Daily Summary Email

Sent daily with inventory statistics.

```typescript
import { sendDailySummaryEmail } from '@/services/email';

await sendDailySummaryEmail('user@example.com', {
  userName: 'John Doe',
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
  ],
  alerts: [{ message: 'Low stock alert', severity: 'medium' }],
});
```

### 5. High Reject Rate Alert

Sent when reject rate exceeds threshold.

```typescript
import { sendHighRejectRateAlert } from '@/services/email';

await sendHighRejectRateAlert(['admin@example.com'], {
  rejectRate: 18.5,
  threshold: 15,
  affectedItems: [
    { name: 'Medical Gloves', batch: 'BATCH-001', rejectCount: 45 },
  ],
  dateRange: {
    from: new Date('2024-01-01'),
    to: new Date('2024-01-07'),
  },
});
```

### 6. Backup Status Email

Sent after backup completion or failure.

```typescript
import { sendBackupStatusEmail } from '@/services/email';

// Success
await sendBackupStatusEmail('admin@example.com', {
  status: 'success',
  backupName: 'backup_2024_01_15.sql',
  timestamp: new Date(),
  size: '45.2 MB',
});

// Failure
await sendBackupStatusEmail('admin@example.com', {
  status: 'failed',
  backupName: 'backup_2024_01_15.sql',
  timestamp: new Date(),
  error: 'Insufficient disk space',
});
```

### 7. Report Ready Email

Sent when a report is ready for download.

```typescript
import { sendReportReadyEmail } from '@/services/email';

await sendReportReadyEmail('user@example.com', {
  userName: 'John Doe',
  reportTitle: 'Monthly Inventory Report',
  reportType: 'Inventory Summary',
  downloadUrl: 'https://app.com/reports/download/report123',
  generatedAt: new Date(),
});
```

## Email Queue and Retry Logic

The email service includes an automatic retry mechanism:

- Failed emails are automatically retried up to 3 times
- Retry delays increase exponentially (5s, 10s, 15s)
- All email attempts are logged in the database
- Admins can manually retry failed emails from the dashboard

### Queue Status

```typescript
import { getEmailQueueStatus } from '@/services/email';

const status = getEmailQueueStatus();
console.log(status);
// { pending: 5, failed: 2, processing: true }
```

## Email Analytics Dashboard

Access the email analytics dashboard at `/admin/email-analytics` (Admin only).

### Features:

- Total emails sent/failed/pending
- Success rate percentage
- Average delivery time
- Emails by template breakdown
- Recent failures with retry option
- Daily delivery rate chart

### API Endpoints

#### Get Analytics

```
GET /api/admin/email-analytics?days=30
```

Response:

```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 1250,
      "sent": 1200,
      "failed": 30,
      "pending": 20,
      "successRate": 96.0,
      "avgDeliveryTime": 2.5
    },
    "templateStats": [...],
    "deliveryRate": [...],
    "recentFailures": [...]
  }
}
```

#### Retry Failed Emails

```
POST /api/admin/email-analytics/retry
Content-Type: application/json

{
  "emailIds": ["email_123", "email_456"]
}
```

## Testing

### Test Email Configuration

```bash
npm run test:email
```

This will:

1. Verify email configuration
2. Send test emails for all templates
3. Display results in the console

### Manual Testing

```typescript
import { testEmailConfiguration } from '@/services/email';

const isValid = await testEmailConfiguration();
console.log('Email config valid:', isValid);
```

## Database Schema

Email logs are stored in the `email_logs` table:

```prisma
model EmailLog {
  id           String    @id
  to           String
  from         String
  subject      String
  template     String
  status       EmailStatus
  metadata     Json?
  sentAt       DateTime?
  failedAt     DateTime?
  errorMessage String?
  attempts     Int       @default(0)
  createdAt    DateTime  @default(now())
}

enum EmailStatus {
  PENDING
  SENT
  FAILED
}
```

## Best Practices

1. **Always use templates**: Don't send raw HTML emails
2. **Handle errors gracefully**: Wrap email calls in try-catch
3. **Don't block user actions**: Send emails asynchronously
4. **Monitor delivery rates**: Check analytics regularly
5. **Test before production**: Use test email addresses
6. **Respect rate limits**: Don't send too many emails at once
7. **Include unsubscribe links**: For marketing emails (future)

## Troubleshooting

### Emails not sending

1. Check environment variables are set correctly
2. Verify SMTP credentials
3. Check firewall/network settings
4. Review email logs in database
5. Test configuration with `npm run test:email`

### Gmail "Less secure app" error

Use an app-specific password instead of your regular password.

### Emails going to spam

1. Set up SPF records for your domain
2. Set up DKIM signing
3. Use a verified sender email
4. Avoid spam trigger words in subject/content

### High failure rate

1. Check SMTP server status
2. Verify recipient email addresses
3. Review error messages in analytics
4. Check rate limits

## Future Enhancements

- [ ] Email templates in multiple languages (AR/EN)
- [ ] Email scheduling system
- [ ] Bulk email sending
- [ ] Email preferences per user
- [ ] Unsubscribe management
- [ ] Email open tracking
- [ ] Click tracking
- [ ] A/B testing for templates
- [ ] Integration with more providers (SendGrid, Mailgun)

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review email analytics dashboard
3. Check application logs
4. Contact system administrator
