# Alerts and Notifications Configuration Guide

This guide explains how to configure alerts and notifications for monitoring critical system events.

## Overview

The alerting system monitors:

- **Error Rate** - Tracks application error rates
- **Response Time** - Monitors API response times
- **Database Connections** - Detects database connection failures
- **Performance** - Monitors Core Web Vitals
- **Deployment** - Tracks deployment status
- **Security** - Monitors security events

## Alert Severity Levels

| Severity | Description | Notification Channels |
|----------|-------------|----------------------|
| **INFO** | Informational events | Logs only |
| **WARNING** | Potential issues | Slack |
| **ERROR** | Errors requiring attention | Slack, Email |
| **CRITICAL** | Critical failures | Slack, Email, SMS (optional) |

## Default Alert Thresholds

### Error Rate Alert

- **Threshold**: > 1% error rate
- **Window**: 5 minutes
- **Severity**: ERROR (WARNING if < 2%, CRITICAL if > 2%)

### Response Time Alert

- **Threshold**: > 3000ms average
- **Window**: 5 minutes
- **Severity**: WARNING (CRITICAL if > 6000ms)

### Database Connection Alert

- **Threshold**: > 3 failures
- **Window**: 1 minute
- **Severity**: CRITICAL

### Performance Alert

- **Threshold**: Any Core Web Vital in "poor" range
- **Window**: 10 minutes
- **Severity**: WARNING

## Environment Variables

Add these to your `.env` file:

```bash
# Email Notifications
EMAIL_SERVER=smtp://smtp.example.com:587
EMAIL_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=admin@yourdomain.com

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional: SMS Notifications (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
ALERT_PHONE_NUMBER=+1234567890
```

## Setting Up Notification Channels

### Email Notifications

#### Option 1: Using SendGrid

1. Sign up for SendGrid account
2. Create API key
3. Add to environment:

```bash
EMAIL_SERVER=smtp://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:587
EMAIL_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=admin@yourdomain.com
```

#### Option 2: Using AWS SES

1. Set up AWS SES
2. Verify email addresses
3. Add to environment:

```bash
EMAIL_SERVER=smtp://YOUR_SMTP_USERNAME:YOUR_SMTP_PASSWORD@email-smtp.us-east-1.amazonaws.com:587
EMAIL_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=admin@yourdomain.com
```

### Slack Notifications

1. Create a Slack App or use Incoming Webhooks
2. Add Incoming Webhook to your workspace
3. Copy webhook URL
4. Add to environment:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

#### Slack Webhook Setup

1. Go to https://api.slack.com/apps
2. Click "Create New App"
3. Choose "From scratch"
4. Name your app (e.g., "Mais Alerts")
5. Select your workspace
6. Go to "Incoming Webhooks"
7. Activate Incoming Webhooks
8. Click "Add New Webhook to Workspace"
9. Select channel (e.g., #alerts)
10. Copy webhook URL

### SMS Notifications (Optional)

Using Twilio:

1. Sign up for Twilio account
2. Get phone number
3. Get Account SID and Auth Token
4. Add to environment:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
ALERT_PHONE_NUMBER=+1234567890
```

## Customizing Alert Thresholds

Update thresholds programmatically:

```typescript
import { alertingService, AlertType } from '@/services/alerting';

// Update error rate threshold
alertingService.updateThreshold(AlertType.ERROR_RATE, {
  threshold: 2, // 2%
  window: 10 * 60 * 1000, // 10 minutes
  enabled: true,
});

// Update response time threshold
alertingService.updateThreshold(AlertType.RESPONSE_TIME, {
  threshold: 5000, // 5 seconds
  window: 5 * 60 * 1000, // 5 minutes
  enabled: true,
});

// Disable performance alerts
alertingService.updateThreshold(AlertType.PERFORMANCE, {
  enabled: false,
});
```

## Using the Alerting Service

### Creating Manual Alerts

```typescript
import { alertingService, AlertType, AlertSeverity } from '@/services/alerting';

// Create a critical alert
alertingService.createAlert(
  AlertType.SECURITY,
  AlertSeverity.CRITICAL,
  'Unauthorized access attempt detected',
  {
    ip: '192.168.1.1',
    userId: 'user123',
    endpoint: '/api/admin',
  }
);
```

### Tracking Metrics

```typescript
import { alertingService, AlertType } from '@/services/alerting';

// Track error rate (0 = success, 1 = error)
alertingService.trackMetric(AlertType.ERROR_RATE, 1);

// Track response time
alertingService.trackMetric(AlertType.RESPONSE_TIME, 2500);

// Track database connection failure
alertingService.trackMetric(AlertType.DATABASE_CONNECTION, 1);
```

### Resolving Alerts

```typescript
import { alertingService } from '@/services/alerting';

// Resolve an alert
alertingService.resolveAlert('alert_1234567890_abc123');

// Get unresolved alerts
const unresolvedAlerts = alertingService.getAlerts({
  resolved: false,
});
```

### Getting Alert Statistics

```typescript
import { alertingService } from '@/services/alerting';

const stats = alertingService.getStatistics();
console.log(stats);
// {
//   total: 45,
//   byType: { error_rate: 12, response_time: 8, ... },
//   bySeverity: { critical: 3, error: 15, warning: 27 },
//   resolved: 40,
//   unresolved: 5
// }
```

## Integration with Monitoring

### API Error Tracking

Automatically track API errors:

```typescript
import { withErrorLogging } from '@/middleware/error-logging';
import { alertingService, AlertType } from '@/services/alerting';

export const GET = withErrorLogging(async (req) => {
  const startTime = Date.now();
  
  try {
    // Your API logic
    const result = await fetchData();
    
    // Track successful request
    const duration = Date.now() - startTime;
    alertingService.trackMetric(AlertType.RESPONSE_TIME, duration);
    alertingService.trackMetric(AlertType.ERROR_RATE, 0);
    
    return NextResponse.json(result);
  } catch (error) {
    // Track error
    alertingService.trackMetric(AlertType.ERROR_RATE, 1);
    throw error;
  }
});
```

### Database Connection Monitoring

```typescript
import { prisma } from '@/services/prisma';
import { alertingService, AlertType } from '@/services/alerting';

async function queryDatabase() {
  try {
    const result = await prisma.user.findMany();
    return result;
  } catch (error) {
    // Track database connection failure
    alertingService.trackMetric(AlertType.DATABASE_CONNECTION, 1);
    throw error;
  }
}
```

## Vercel Integration

### Deployment Notifications

Configure in Vercel Dashboard:

1. Go to **Settings** > **Notifications**
2. Add notification integrations:
   - Slack
   - Email
   - Webhook
3. Select events:
   - Deployment Started
   - Deployment Ready
   - Deployment Failed
   - Deployment Canceled

### Log Drains

Send logs to external services:

1. Go to **Settings** > **Log Drains**
2. Add log drain:
   - Datadog
   - Logtail
   - Axiom
   - Custom HTTP endpoint

## Alert Dashboard (Future Enhancement)

Create a dashboard to view alerts:

```typescript
// pages/admin/alerts.tsx
import { alertingService } from '@/services/alerting';

export default function AlertsPage() {
  const alerts = alertingService.getAlerts({ limit: 50 });
  const stats = alertingService.getStatistics();
  
  return (
    <div>
      <h1>System Alerts</h1>
      <AlertStatistics stats={stats} />
      <AlertList alerts={alerts} />
    </div>
  );
}
```

## Testing Alerts

### Test Email Notifications

```bash
# Set up test environment variables
export EMAIL_SERVER="smtp://test@example.com:password@smtp.example.com:587"
export EMAIL_FROM="test@example.com"
export ALERT_EMAIL_TO="your-email@example.com"

# Run test script
npm run test:alerts
```

### Test Slack Notifications

```bash
# Set up test webhook
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/TEST/WEBHOOK"

# Send test alert
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test alert from Mais Inventory System"}'
```

## Best Practices

1. **Set Appropriate Thresholds** - Avoid alert fatigue
2. **Use Severity Levels Correctly** - Reserve CRITICAL for true emergencies
3. **Monitor Alert Volume** - Too many alerts = ignored alerts
4. **Regular Review** - Review and adjust thresholds monthly
5. **Document Responses** - Create runbooks for common alerts
6. **Test Regularly** - Test notification channels monthly
7. **Resolve Alerts** - Mark alerts as resolved when fixed
8. **Group Similar Alerts** - Avoid duplicate notifications

## Troubleshooting

### Emails Not Sending

1. Verify EMAIL_SERVER configuration
2. Check SMTP credentials
3. Verify sender email is authorized
4. Check spam folder
5. Review application logs

### Slack Notifications Not Working

1. Verify webhook URL is correct
2. Check webhook is active in Slack
3. Test webhook with curl
4. Review application logs
5. Check Slack app permissions

### Too Many Alerts

1. Review and adjust thresholds
2. Increase time windows
3. Disable non-critical alerts
4. Implement alert grouping
5. Add cooldown periods

### Missing Alerts

1. Verify thresholds are not too high
2. Check alert service is initialized
3. Verify metrics are being tracked
4. Review application logs
5. Test alert creation manually

## Support

For issues or questions:

1. Check application logs
2. Review this documentation
3. Test notification channels manually
4. Contact system administrator
5. Review Vercel logs and metrics

## Additional Resources

- [Vercel Notifications](https://vercel.com/docs/concepts/observability/notifications)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)
- [Twilio SMS](https://www.twilio.com/docs/sms)
