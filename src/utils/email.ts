/**
 * Email utility functions
 *
 * Note: This is a basic implementation. In production, you should:
 * - Use a proper email service (SendGrid, AWS SES, Resend, etc.)
 * - Add email templates
 * - Handle email queue for reliability
 * - Add retry logic
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email
 * This is a placeholder implementation that logs to console
 * In production, integrate with your email service
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  // In development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email would be sent:', {
      to: options.to,
      subject: options.subject,
      text: options.text,
    });
    return;
  }

  // In production, integrate with your email service
  // Example with nodemailer (if configured):
  /*
  const nodemailer = require('nodemailer')
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  })
  */

  // For now, just log
  console.log('📧 Email sent:', options.to, options.subject);
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  password: string
): Promise<void> {
  const subject = 'Welcome to Inventory Management System';

  const text = `
Hello ${name},

Welcome to the Inventory Management System!

Your account has been created with the following credentials:

Email: ${email}
Temporary Password: ${password}

Please log in and change your password immediately for security reasons.

Login URL: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login

If you have any questions, please contact your system administrator.

Best regards,
Inventory Management Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .credentials { background-color: white; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Inventory Management System</h1>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>Welcome to the Inventory Management System! Your account has been created successfully.</p>
      
      <div class="credentials">
        <h3>Your Login Credentials</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <code>${password}</code></p>
      </div>
      
      <p><strong>Important:</strong> Please log in and change your password immediately for security reasons.</p>
      
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" class="button">
        Log In Now
      </a>
      
      <p>If you have any questions, please contact your system administrator.</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const subject = 'Password Reset Request';

  const text = `
Hello ${name},

You have requested to reset your password for the Inventory Management System.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
Inventory Management Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>You have requested to reset your password for the Inventory Management System.</p>
      
      <a href="${resetUrl}" class="button">Reset Password</a>
      
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this password reset, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}
