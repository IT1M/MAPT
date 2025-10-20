# Email Service Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Configure Environment Variables

Add to your `.env` file:

```bash
# Choose your provider
EMAIL_PROVIDER="smtp"

# For Gmail (recommended for testing)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"  # Generate at https://myaccount.google.com/apppasswords

# Sender info
SMTP_FROM="noreply@mais.sa"
SMTP_FROM_NAME="Saudi Mais Inventory System"
```

### Step 2: Test Your Configuration

```bash
npm run test:email
```

You should see:

```
✅ Email configuration is valid
✅ Welcome email sent successfully
✅ Password reset email sent successfully
...
```

### Step 3: Send Your First Email

```typescript
import { sendWelcomeEmail } from '@/services/email';

// In your registration handler
await sendWelcomeEmail('user@example.com', {
  userName: 'John Doe',
  email: 'user@example.com',
  loginUrl: 'https://yourapp.com/login',
});
```

That's it! 🎉

## 📧 Common Use Cases

### Send Welcome Email on Registration

```typescript
// src/app/api/auth/register/route.ts
import { sendWelcomeEmail } from '@/services/email';

export async function POST(request: NextRequest) {
  const newUser = await createUser(data);

  // Send welcome email (non-blocking)
  sendWelcomeEmail(newUser.email, {
    userName: newUser.name,
    email: newUser.email,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
  }).catch(console.error);

  return apiResponse.success({ user: newUser });
}
```

### Send Password Reset Email

```typescript
import { sendPasswordResetEmail } from '@/services/email';

const token = generateResetToken();
await sendPasswordResetEmail(user.email, {
  userName: user.name,
  resetUrl: `${APP_URL}/reset-password?token=${token}`,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
});
```

### Send Security Alert

```typescript
import { sendSecurityAlertEmail } from '@/services/email';

await sendSecurityAlertEmail(user.email, {
  userName: user.name,
  deviceType: 'Desktop',
  browser: 'Chrome',
  os: 'Windows 11',
  ipAddress: '192.168.1.1',
  location: 'Riyadh, Saudi Arabia',
  timestamp: new Date(),
});
```

## 📊 Monitor Email Delivery

Access the analytics dashboard at:

```
https://yourapp.com/admin/email-analytics
```

(Admin access required)

## 🔧 Troubleshooting

### Emails not sending?

1. Check your `.env` configuration
2. Run `npm run test:email` to verify setup
3. Check the email logs in database
4. Review the analytics dashboard for errors

### Gmail "Less secure app" error?

Use an [App Password](https://myaccount.google.com/apppasswords) instead of your regular password.

### Emails going to spam?

1. Use a verified sender email
2. Set up SPF records for your domain
3. Avoid spam trigger words

## 📚 Full Documentation

- [Complete Service Documentation](./EMAIL_SERVICE_README.md)
- [Integration Examples](./EMAIL_INTEGRATION_EXAMPLES.md)
- [Implementation Summary](../../.kiro/specs/auth-dashboard-enhancement/EMAIL_SYSTEM_IMPLEMENTATION_SUMMARY.md)

## 🎨 Available Templates

1. ✅ Welcome Email
2. ✅ Password Reset
3. ✅ Security Alert
4. ✅ Daily Summary
5. ✅ High Reject Rate Alert
6. ✅ Backup Status
7. ✅ Report Ready

All templates are professionally designed with:

- Responsive HTML
- Plain text fallback
- Mobile-friendly
- Brand colors
- Accessible markup

## 💡 Pro Tips

1. **Always use try-catch** for non-critical emails
2. **Don't block user actions** - send emails asynchronously
3. **Monitor delivery rates** through the analytics dashboard
4. **Test templates** before deploying to production
5. **Use the queue system** - failed emails are automatically retried

## 🆘 Need Help?

Check the troubleshooting section in [EMAIL_SERVICE_README.md](./EMAIL_SERVICE_README.md) or review the [integration examples](./EMAIL_INTEGRATION_EXAMPLES.md).
