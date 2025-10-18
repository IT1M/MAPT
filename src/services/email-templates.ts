/**
 * Email templates for the Saudi Mais Inventory System
 * All templates return HTML, plain text, and subject
 */

import {
  type WelcomeEmailData,
  type PasswordResetEmailData,
  type SecurityAlertEmailData,
  type DailySummaryEmailData,
  type HighRejectRateAlertData,
  type BackupStatusEmailData,
  type ReportReadyEmailData,
} from './email'

const APP_NAME = 'Saudi Mais Inventory System'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const BRAND_COLOR = '#0d9488'

/**
 * Base email layout
 */
function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #06b6d4 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: ${BRAND_COLOR};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #0f766e;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .info-box {
      background-color: #f0fdfa;
      border-left: 4px solid ${BRAND_COLOR};
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .alert-box {
      background-color: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: ${BRAND_COLOR};
    }
    .stat-label {
      font-size: 14px;
      color: #6b7280;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background-color: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${APP_NAME}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Saudi Mais Medical Products. All rights reserved.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Welcome Email Template
 */
export function welcomeEmailTemplate(data: WelcomeEmailData) {
  const html = emailLayout(`
    <h2>Welcome to ${APP_NAME}! 🎉</h2>
    <p>Hello ${data.userName},</p>
    <p>Your account has been successfully created. We're excited to have you on board!</p>
    
    <div class="info-box">
      <p><strong>Your Account Details:</strong></p>
      <p>Email: ${data.email}</p>
      <p>You can now log in and start managing your inventory.</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${data.loginUrl}" class="button">Get Started</a>
    </p>
    
    <h3>What's Next?</h3>
    <ul>
      <li>Complete your profile settings</li>
      <li>Explore the dashboard</li>
      <li>Start adding inventory items</li>
      <li>Check out our help center for guides</li>
    </ul>
    
    <p>If you have any questions, our support team is here to help.</p>
    <p>Best regards,<br>The ${APP_NAME} Team</p>
  `)

  const text = `
Welcome to ${APP_NAME}!

Hello ${data.userName},

Your account has been successfully created. We're excited to have you on board!

Your Account Details:
Email: ${data.email}

Get started: ${data.loginUrl}

What's Next?
- Complete your profile settings
- Explore the dashboard
- Start adding inventory items
- Check out our help center for guides

If you have any questions, our support team is here to help.

Best regards,
The ${APP_NAME} Team
  `

  return {
    html,
    text,
    subject: `Welcome to ${APP_NAME}`,
  }
}

/**
 * Password Reset Email Template
 */
export function passwordResetEmailTemplate(data: PasswordResetEmailData) {
  const expiresIn = Math.round((data.expiresAt.getTime() - Date.now()) / (1000 * 60))
  
  const html = emailLayout(`
    <h2>Reset Your Password</h2>
    <p>Hello ${data.userName},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    
    <p style="text-align: center;">
      <a href="${data.resetUrl}" class="button">Reset Password</a>
    </p>
    
    <div class="warning-box">
      <p><strong>⏰ This link expires in ${expiresIn} minutes</strong></p>
      <p>For security reasons, this password reset link will expire soon.</p>
    </div>
    
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    
    <p><strong>Security Tips:</strong></p>
    <ul>
      <li>Never share your password with anyone</li>
      <li>Use a strong, unique password</li>
      <li>Enable two-factor authentication for extra security</li>
    </ul>
    
    <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
    <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${data.resetUrl}</p>
  `)

  const text = `
Reset Your Password

Hello ${data.userName},

We received a request to reset your password. Click the link below to create a new password:

${data.resetUrl}

⏰ This link expires in ${expiresIn} minutes

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Security Tips:
- Never share your password with anyone
- Use a strong, unique password
- Enable two-factor authentication for extra security
  `

  return {
    html,
    text,
    subject: 'Reset Your Password',
  }
}

/**
 * Security Alert Email Template
 */
export function securityAlertEmailTemplate(data: SecurityAlertEmailData) {
  const formattedTime = new Date(data.timestamp).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
  })
  
  const html = emailLayout(`
    <h2>🔐 New Device Login Detected</h2>
    <p>Hello ${data.userName},</p>
    <p>We detected a new login to your account from a device we don't recognize.</p>
    
    <div class="info-box">
      <p><strong>Login Details:</strong></p>
      <table style="margin: 0;">
        <tr>
          <td style="border: none; padding: 5px 10px 5px 0;"><strong>Device:</strong></td>
          <td style="border: none; padding: 5px 0;">${data.deviceType}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 5px 10px 5px 0;"><strong>Browser:</strong></td>
          <td style="border: none; padding: 5px 0;">${data.browser} on ${data.os}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 5px 10px 5px 0;"><strong>Location:</strong></td>
          <td style="border: none; padding: 5px 0;">${data.location}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 5px 10px 5px 0;"><strong>IP Address:</strong></td>
          <td style="border: none; padding: 5px 0;">${data.ipAddress}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 5px 10px 5px 0;"><strong>Time:</strong></td>
          <td style="border: none; padding: 5px 0;">${formattedTime}</td>
        </tr>
      </table>
    </div>
    
    <h3>Was this you?</h3>
    <p>If you recognize this activity, you can safely ignore this email.</p>
    
    <div class="alert-box">
      <p><strong>⚠️ If this wasn't you:</strong></p>
      <ol>
        <li>Change your password immediately</li>
        <li>Review your active sessions</li>
        <li>Enable two-factor authentication</li>
        <li>Contact support if you need assistance</li>
      </ol>
    </div>
    
    <p style="text-align: center;">
      <a href="${APP_URL}/settings/security" class="button">Review Security Settings</a>
    </p>
  `)

  const text = `
🔐 New Device Login Detected

Hello ${data.userName},

We detected a new login to your account from a device we don't recognize.

Login Details:
- Device: ${data.deviceType}
- Browser: ${data.browser} on ${data.os}
- Location: ${data.location}
- IP Address: ${data.ipAddress}
- Time: ${formattedTime}

Was this you?
If you recognize this activity, you can safely ignore this email.

⚠️ If this wasn't you:
1. Change your password immediately
2. Review your active sessions
3. Enable two-factor authentication
4. Contact support if you need assistance

Review Security Settings: ${APP_URL}/settings/security
  `

  return {
    html,
    text,
    subject: '🔐 New Device Login Detected',
  }
}

/**
 * Daily Summary Email Template
 */
export function dailySummaryEmailTemplate(data: DailySummaryEmailData) {
  const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
    dateStyle: 'full',
  })
  
  const topItemsHtml = data.topItems.map(item => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align: right;">${item.quantity}</td>
    </tr>
  `).join('')
  
  const alertsHtml = data.alerts.map(alert => `
    <div class="${alert.severity === 'high' ? 'alert-box' : 'warning-box'}">
      <p>${alert.message}</p>
    </div>
  `).join('')
  
  const html = emailLayout(`
    <h2>📊 Your Daily Inventory Summary</h2>
    <p>Hello ${data.userName},</p>
    <p>Here's your inventory summary for ${formattedDate}:</p>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${data.stats.itemsAdded}</div>
        <div class="stat-label">Items Added</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.stats.itemsUpdated}</div>
        <div class="stat-label">Items Updated</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">$${data.stats.totalValue.toLocaleString()}</div>
        <div class="stat-label">Total Value</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.stats.rejectRate}%</div>
        <div class="stat-label">Reject Rate</div>
      </div>
    </div>
    
    ${data.topItems.length > 0 ? `
      <h3>Top Items</h3>
      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th style="text-align: right;">Quantity</th>
          </tr>
        </thead>
        <tbody>
          ${topItemsHtml}
        </tbody>
      </table>
    ` : ''}
    
    ${data.alerts.length > 0 ? `
      <h3>⚠️ Alerts</h3>
      ${alertsHtml}
    ` : ''}
    
    <p style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="button">View Dashboard</a>
    </p>
  `)

  const text = `
📊 Your Daily Inventory Summary

Hello ${data.userName},

Here's your inventory summary for ${formattedDate}:

Statistics:
- Items Added: ${data.stats.itemsAdded}
- Items Updated: ${data.stats.itemsUpdated}
- Total Value: $${data.stats.totalValue.toLocaleString()}
- Reject Rate: ${data.stats.rejectRate}%

${data.topItems.length > 0 ? `
Top Items:
${data.topItems.map(item => `- ${item.name}: ${item.quantity}`).join('\n')}
` : ''}

${data.alerts.length > 0 ? `
⚠️ Alerts:
${data.alerts.map(alert => `- ${alert.message}`).join('\n')}
` : ''}

View Dashboard: ${APP_URL}/dashboard
  `

  return {
    html,
    text,
    subject: '📊 Your Daily Inventory Summary',
  }
}

/**
 * High Reject Rate Alert Template
 */
export function highRejectRateAlertTemplate(data: HighRejectRateAlertData) {
  const dateRange = `${new Date(data.dateRange.from).toLocaleDateString()} - ${new Date(data.dateRange.to).toLocaleDateString()}`
  
  const affectedItemsHtml = data.affectedItems.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.batch}</td>
      <td style="text-align: right; color: #ef4444; font-weight: 600;">${item.rejectCount}</td>
    </tr>
  `).join('')
  
  const html = emailLayout(`
    <h2>⚠️ High Reject Rate Alert</h2>
    <p>A high reject rate has been detected in your inventory system.</p>
    
    <div class="alert-box">
      <p><strong>Current Reject Rate: ${data.rejectRate}%</strong></p>
      <p>Threshold: ${data.threshold}%</p>
      <p>Period: ${dateRange}</p>
    </div>
    
    <h3>Affected Items</h3>
    <table>
      <thead>
        <tr>
          <th>Item Name</th>
          <th>Batch</th>
          <th style="text-align: right;">Reject Count</th>
        </tr>
      </thead>
      <tbody>
        ${affectedItemsHtml}
      </tbody>
    </table>
    
    <h3>Recommended Actions:</h3>
    <ul>
      <li>Review quality control procedures</li>
      <li>Investigate affected batches</li>
      <li>Contact suppliers if necessary</li>
      <li>Update inventory records</li>
    </ul>
    
    <p style="text-align: center;">
      <a href="${APP_URL}/data-log?filter=high-reject" class="button">Investigate Now</a>
    </p>
  `)

  const text = `
⚠️ High Reject Rate Alert

A high reject rate has been detected in your inventory system.

Current Reject Rate: ${data.rejectRate}%
Threshold: ${data.threshold}%
Period: ${dateRange}

Affected Items:
${data.affectedItems.map(item => `- ${item.name} (${item.batch}): ${item.rejectCount} rejects`).join('\n')}

Recommended Actions:
- Review quality control procedures
- Investigate affected batches
- Contact suppliers if necessary
- Update inventory records

Investigate Now: ${APP_URL}/data-log?filter=high-reject
  `

  return {
    html,
    text,
    subject: '⚠️ High Reject Rate Alert',
  }
}

/**
 * Backup Status Email Template
 */
export function backupStatusEmailTemplate(data: BackupStatusEmailData) {
  const formattedTime = new Date(data.timestamp).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
  })
  
  const html = emailLayout(`
    <h2>${data.status === 'success' ? '✅ Backup Completed Successfully' : '❌ Backup Failed'}</h2>
    
    ${data.status === 'success' ? `
      <div class="info-box">
        <p><strong>Backup Details:</strong></p>
        <p>Name: ${data.backupName}</p>
        <p>Size: ${data.size}</p>
        <p>Completed: ${formattedTime}</p>
      </div>
      
      <p>Your database backup has been completed successfully and is stored securely.</p>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/backup" class="button">View Backups</a>
      </p>
    ` : `
      <div class="alert-box">
        <p><strong>Backup Failed:</strong></p>
        <p>Name: ${data.backupName}</p>
        <p>Time: ${formattedTime}</p>
        <p>Error: ${data.error}</p>
      </div>
      
      <p>The scheduled backup has failed. Please review the error and take appropriate action.</p>
      
      <h3>Recommended Actions:</h3>
      <ul>
        <li>Check available disk space</li>
        <li>Verify backup configuration</li>
        <li>Review system logs</li>
        <li>Retry the backup manually</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/backup" class="button">Manage Backups</a>
      </p>
    `}
  `)

  const text = `
${data.status === 'success' ? '✅ Backup Completed Successfully' : '❌ Backup Failed'}

${data.status === 'success' ? `
Backup Details:
- Name: ${data.backupName}
- Size: ${data.size}
- Completed: ${formattedTime}

Your database backup has been completed successfully and is stored securely.

View Backups: ${APP_URL}/backup
` : `
Backup Failed:
- Name: ${data.backupName}
- Time: ${formattedTime}
- Error: ${data.error}

The scheduled backup has failed. Please review the error and take appropriate action.

Recommended Actions:
- Check available disk space
- Verify backup configuration
- Review system logs
- Retry the backup manually

Manage Backups: ${APP_URL}/backup
`}
  `

  return {
    html,
    text,
    subject: data.status === 'success' 
      ? '✅ Backup Completed Successfully' 
      : '❌ Backup Failed',
  }
}

/**
 * Report Ready Email Template
 */
export function reportReadyEmailTemplate(data: ReportReadyEmailData) {
  const formattedTime = new Date(data.generatedAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  })
  
  const html = emailLayout(`
    <h2>📊 Your Report is Ready</h2>
    <p>Hello ${data.userName},</p>
    <p>The report you requested has been generated and is ready for download.</p>
    
    <div class="info-box">
      <p><strong>Report Details:</strong></p>
      <p>Title: ${data.reportTitle}</p>
      <p>Type: ${data.reportType}</p>
      <p>Generated: ${formattedTime}</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${data.downloadUrl}" class="button">Download Report</a>
    </p>
    
    <p><strong>Note:</strong> This download link will expire in 7 days for security reasons.</p>
    
    <p>You can also access this report from your reports dashboard at any time.</p>
    
    <p style="text-align: center;">
      <a href="${APP_URL}/reports" style="color: ${BRAND_COLOR}; text-decoration: none;">View All Reports →</a>
    </p>
  `)

  const text = `
📊 Your Report is Ready

Hello ${data.userName},

The report you requested has been generated and is ready for download.

Report Details:
- Title: ${data.reportTitle}
- Type: ${data.reportType}
- Generated: ${formattedTime}

Download Report: ${data.downloadUrl}

Note: This download link will expire in 7 days for security reasons.

You can also access this report from your reports dashboard at any time.

View All Reports: ${APP_URL}/reports
  `

  return {
    html,
    text,
    subject: '📊 Your Report is Ready',
  }
}

/**
 * Export Ready Email Template
 */
export interface ExportReadyEmailData {
  userName: string
  filename: string
  recordCount: number
  format: string
  fileSize: string
}

export function exportReadyEmailTemplate(data: ExportReadyEmailData) {
  const html = emailLayout(`
    <h2>📦 Your Export is Ready</h2>
    <p>Hello ${data.userName},</p>
    <p>The data export you requested has been completed and is attached to this email.</p>
    
    <div class="info-box">
      <p><strong>Export Details:</strong></p>
      <p>Filename: ${data.filename}</p>
      <p>Format: ${data.format}</p>
      <p>Records: ${data.recordCount.toLocaleString()}</p>
      <p>File Size: ${data.fileSize}</p>
    </div>
    
    <p>The exported file is attached to this email. You can download it directly from your email client.</p>
    
    <p><strong>Note:</strong> For security reasons, please handle this data according to your organization's data protection policies.</p>
    
    <p style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="button">Go to Dashboard</a>
    </p>
  `)

  const text = `
📦 Your Export is Ready

Hello ${data.userName},

The data export you requested has been completed and is attached to this email.

Export Details:
- Filename: ${data.filename}
- Format: ${data.format}
- Records: ${data.recordCount.toLocaleString()}
- File Size: ${data.fileSize}

The exported file is attached to this email. You can download it directly from your email client.

Note: For security reasons, please handle this data according to your organization's data protection policies.

Go to Dashboard: ${APP_URL}/dashboard
  `

  return {
    html,
    text,
    subject: '📦 Your Export is Ready',
  }
}
