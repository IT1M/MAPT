# Email Service Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Registration │  │ Password     │  │   Backup     │          │
│  │   Handler    │  │    Reset     │  │   Service    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┼──────────────────┘                   │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Email Service Layer                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Email Service (email.ts)                     │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  • sendWelcomeEmail()                               │ │  │
│  │  │  • sendPasswordResetEmail()                         │ │  │
│  │  │  • sendSecurityAlertEmail()                         │ │  │
│  │  │  • sendDailySummaryEmail()                          │ │  │
│  │  │  • sendHighRejectRateAlert()                        │ │  │
│  │  │  • sendBackupStatusEmail()                          │ │  │
│  │  │  • sendReportReadyEmail()                           │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│         ┌──────────────────┼──────────────────┐                  │
│         │                  │                  │                   │
│         ▼                  ▼                  ▼                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Template   │  │  Email Queue │  │  Database    │           │
│  │   System    │  │   & Retry    │  │   Logger     │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  SMTP Provider  │  │ Resend Provider │  │   Email Logs    │
│   (Nodemailer)  │  │   (Resend API)  │  │   (Database)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Email Delivery │
                    │   (Recipients)  │
                    └─────────────────┘
```

## Component Breakdown

### 1. Email Service Core

**File:** `src/services/email.ts`

**Responsibilities:**

- Provide high-level email sending functions
- Handle email provider selection (SMTP/Resend)
- Manage email queue and retry logic
- Log all email attempts to database
- Track delivery status

**Key Functions:**

```typescript
sendWelcomeEmail(email, data);
sendPasswordResetEmail(email, data);
sendSecurityAlertEmail(email, data);
sendDailySummaryEmail(email, data);
sendHighRejectRateAlert(emails, data);
sendBackupStatusEmail(email, data);
sendReportReadyEmail(email, data);
```

### 2. Template System

**File:** `src/services/email-templates.ts`

**Responsibilities:**

- Generate HTML and plain text email content
- Apply consistent branding and styling
- Provide responsive email layouts
- Support dynamic data injection

**Templates:**

```typescript
welcomeEmailTemplate(data) → { html, text, subject }
passwordResetEmailTemplate(data) → { html, text, subject }
securityAlertEmailTemplate(data) → { html, text, subject }
dailySummaryEmailTemplate(data) → { html, text, subject }
highRejectRateAlertTemplate(data) → { html, text, subject }
backupStatusEmailTemplate(data) → { html, text, subject }
reportReadyEmailTemplate(data) → { html, text, subject }
```

### 3. Email Queue System

**Responsibilities:**

- Queue failed emails for retry
- Implement exponential backoff (5s, 10s, 15s)
- Maximum 3 retry attempts
- Process queue asynchronously
- Track queue status

**Queue Flow:**

```
Email Send Attempt
       │
       ▼
   Success? ──Yes──> Mark as SENT
       │
       No
       │
       ▼
Add to Queue (attempt 1)
       │
       ▼
Wait 5 seconds
       │
       ▼
Retry Attempt 2
       │
       ▼
   Success? ──Yes──> Mark as SENT
       │
       No
       │
       ▼
Wait 10 seconds
       │
       ▼
Retry Attempt 3
       │
       ▼
   Success? ──Yes──> Mark as SENT
       │
       No
       │
       ▼
Mark as FAILED
```

### 4. Database Logger

**Table:** `email_logs`

**Schema:**

```prisma
model EmailLog {
  id           String      @id
  to           String
  from         String
  subject      String
  template     String
  status       EmailStatus  // PENDING, SENT, FAILED
  metadata     Json?
  sentAt       DateTime?
  failedAt     DateTime?
  errorMessage String?
  attempts     Int         @default(0)
  createdAt    DateTime    @default(now())
}
```

**Tracking:**

- Every email attempt is logged
- Status updates (PENDING → SENT/FAILED)
- Error messages for failures
- Retry attempt count
- Metadata for debugging

### 5. Email Providers

#### SMTP Provider (Nodemailer)

**Configuration:**

```typescript
{
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  }
}
```

**Supported Services:**

- Gmail
- Office 365
- Custom SMTP servers
- Any standard SMTP provider

#### Resend Provider

**Configuration:**

```typescript
{
  apiKey: process.env.RESEND_API_KEY,
  endpoint: 'https://api.resend.com/emails'
}
```

**Features:**

- RESTful API
- Simple integration
- Built-in analytics
- High deliverability

### 6. Analytics Dashboard

**Component:** `src/components/admin/EmailAnalyticsDashboard.tsx`

**API:** `src/app/api/admin/email-analytics/route.ts`

**Metrics Tracked:**

- Total emails sent/failed/pending
- Success rate percentage
- Average delivery time
- Emails by template type
- Daily delivery rate trends
- Recent failures with details

**Visualizations:**

- Summary cards
- Template breakdown
- Delivery rate chart
- Failures table with retry

## Data Flow

### Sending an Email

```
1. Application calls sendWelcomeEmail(email, data)
   │
   ▼
2. Email service logs to database (status: PENDING)
   │
   ▼
3. Get template (HTML + text + subject)
   │
   ▼
4. Select provider (SMTP or Resend)
   │
   ▼
5. Send email via provider
   │
   ├─Success──> Update log (status: SENT, sentAt: now)
   │
   └─Failure──> Update log (status: FAILED, errorMessage)
                │
                ▼
                Add to retry queue
                │
                ▼
                Retry up to 3 times
                │
                ├─Success──> Update log (status: SENT)
                │
                └─Final Failure──> Keep as FAILED
```

### Monitoring Email Delivery

```
1. Admin accesses /admin/email-analytics
   │
   ▼
2. Dashboard fetches data from API
   │
   ▼
3. API queries email_logs table
   │
   ├─> Calculate summary statistics
   ├─> Group by template
   ├─> Calculate daily rates
   └─> Get recent failures
   │
   ▼
4. Return analytics data
   │
   ▼
5. Dashboard renders visualizations
   │
   ▼
6. Admin can retry failed emails
   │
   ▼
7. Failed emails reset to PENDING
   │
   ▼
8. Queue processes pending emails
```

## Security Considerations

### Email Content

- ✅ No sensitive data in email body
- ✅ Tokens in URLs only (not in email text)
- ✅ Expiration times for reset links
- ✅ Plain text alternatives

### Transmission

- ✅ TLS/SSL encryption (SMTP)
- ✅ HTTPS for API calls (Resend)
- ✅ Secure credential storage (env vars)
- ✅ No credentials in logs

### Access Control

- ✅ Analytics dashboard: Admin only
- ✅ Retry functionality: Admin only
- ✅ Email logs: Audit trail
- ✅ Rate limiting awareness

## Performance Optimizations

### Asynchronous Processing

```typescript
// Non-blocking email send
sendWelcomeEmail(email, data).catch(console.error);

// User registration continues immediately
return apiResponse.success({ user });
```

### Queue Management

- In-memory queue for speed
- Automatic retry without blocking
- Exponential backoff to avoid spam
- Batch processing capability

### Database Efficiency

- Indexed email_logs table
- Efficient queries for analytics
- Pagination for large datasets
- Aggregation for statistics

## Scalability

### Current Implementation

- In-memory queue (single server)
- Direct database logging
- Synchronous template rendering

### Production Recommendations

- Redis-based queue (multi-server)
- Background job processing (Bull/BullMQ)
- Template caching
- CDN for email assets
- Separate email service (microservice)

## Error Handling

### Levels of Error Handling

1. **Provider Level**
   - SMTP connection errors
   - API authentication errors
   - Rate limit errors

2. **Service Level**
   - Template rendering errors
   - Database logging errors
   - Queue processing errors

3. **Application Level**
   - Graceful degradation
   - User notification (if critical)
   - Logging for debugging

### Error Recovery

```typescript
try {
  await sendEmail(...)
} catch (error) {
  // Log error
  console.error('Email failed:', error)

  // Add to retry queue
  emailQueue.add(emailJob)

  // Don't fail main operation
  // (unless email is critical)
}
```

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Delivery Rate**
   - Target: >95% success rate
   - Alert if: <90% for 1 hour

2. **Average Delivery Time**
   - Target: <5 seconds
   - Alert if: >10 seconds average

3. **Queue Size**
   - Target: <10 pending
   - Alert if: >50 pending

4. **Failed Emails**
   - Target: <5% failure rate
   - Alert if: >10% failures

### Alerting Strategy

```typescript
// Check metrics every 5 minutes
if (successRate < 90) {
  sendAlert('Email delivery rate below 90%');
}

if (queueSize > 50) {
  sendAlert('Email queue backing up');
}

if (avgDeliveryTime > 10) {
  sendAlert('Email delivery slow');
}
```

## Integration Points

### Current Integrations

- ✅ User registration
- ✅ Password reset
- ✅ Session management (security alerts)
- ✅ Backup system
- ✅ Report generation

### Future Integrations

- [ ] Daily summary cron job
- [ ] High reject rate monitoring
- [ ] User preferences
- [ ] Notification system
- [ ] Scheduled reports

## Testing Strategy

### Unit Tests

- Template rendering
- Email validation
- Queue operations
- Provider selection

### Integration Tests

- SMTP connection
- Resend API calls
- Database logging
- Retry mechanism

### End-to-End Tests

- Full email flow
- Analytics dashboard
- Retry functionality
- Error scenarios

## Maintenance

### Regular Tasks

- Monitor delivery rates
- Review failed emails
- Clean old email logs
- Update templates
- Test provider connectivity

### Quarterly Reviews

- Analyze email metrics
- Optimize templates
- Review error patterns
- Update documentation
- Plan enhancements
