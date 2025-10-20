import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from './prisma';
import crypto from 'crypto';

/**
 * Two-Factor Authentication Service
 * Handles TOTP setup, verification, and backup codes
 */

const ENCRYPTION_KEY =
  process.env.TWO_FACTOR_ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data (TOTP secret)
 */
function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data (TOTP secret)
 */
function decrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate backup codes for 2FA recovery
 */
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * Hash backup codes for storage
 */
function hashBackupCodes(codes: string[]): string[] {
  return codes.map((code) =>
    crypto.createHash('sha256').update(code).digest('hex')
  );
}

/**
 * Setup 2FA for a user
 * Returns secret and QR code for authenticator app
 */
export async function setup2FA(
  userId: string,
  userEmail: string
): Promise<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}> {
  // Generate TOTP secret
  const secret = speakeasy.generateSecret({
    name: `Saudi Mais Inventory (${userEmail})`,
    issuer: 'Saudi Mais',
    length: 32,
  });

  if (!secret.base32) {
    throw new Error('Failed to generate 2FA secret');
  }

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);
  const hashedBackupCodes = hashBackupCodes(backupCodes);

  // Store encrypted secret in database (not enabled yet)
  const encryptedSecret = encrypt(secret.base32);

  await prisma.twoFactorAuth.upsert({
    where: { userId },
    create: {
      id: crypto.randomUUID(),
      userId,
      secret: encryptedSecret,
      backupCodes: hashedBackupCodes,
      enabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    update: {
      secret: encryptedSecret,
      backupCodes: hashedBackupCodes,
      enabled: false,
      updatedAt: new Date(),
    },
  });

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify TOTP code and enable 2FA
 */
export async function verify2FASetup(
  userId: string,
  token: string
): Promise<boolean> {
  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userId },
  });

  if (!twoFactor) {
    return false;
  }

  const secret = decrypt(twoFactor.secret);

  const isValid = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 60s time drift
  });

  if (isValid) {
    // Enable 2FA
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        enabled: true,
        enabledAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  return isValid;
}

/**
 * Verify TOTP code during login
 */
export async function verify2FALogin(
  userId: string,
  token: string
): Promise<boolean> {
  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userId },
  });

  if (!twoFactor || !twoFactor.enabled) {
    return false;
  }

  const secret = decrypt(twoFactor.secret);

  const isValid = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // Allow 30s time drift for login
  });

  if (isValid) {
    // Update last used timestamp
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  return isValid;
}

/**
 * Verify backup code during login
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userId },
  });

  if (!twoFactor || !twoFactor.enabled) {
    return false;
  }

  const hashedCode = crypto
    .createHash('sha256')
    .update(code.toUpperCase())
    .digest('hex');
  const codeIndex = twoFactor.backupCodes.indexOf(hashedCode);

  if (codeIndex === -1) {
    return false;
  }

  // Remove used backup code
  const updatedCodes = twoFactor.backupCodes.filter(
    (_, index) => index !== codeIndex
  );

  await prisma.twoFactorAuth.update({
    where: { userId },
    data: {
      backupCodes: updatedCodes,
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return true;
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: string): Promise<void> {
  await prisma.twoFactorAuth.update({
    where: { userId },
    data: {
      enabled: false,
      updatedAt: new Date(),
    },
  });
}

/**
 * Check if user has 2FA enabled
 */
export async function is2FAEnabled(userId: string): Promise<boolean> {
  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userId },
    select: { enabled: true },
  });

  return twoFactor?.enabled || false;
}

/**
 * Get remaining backup codes count
 */
export async function getRemainingBackupCodes(userId: string): Promise<number> {
  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userId },
    select: { backupCodes: true },
  });

  return twoFactor?.backupCodes.length || 0;
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const backupCodes = generateBackupCodes(10);
  const hashedBackupCodes = hashBackupCodes(backupCodes);

  await prisma.twoFactorAuth.update({
    where: { userId },
    data: {
      backupCodes: hashedBackupCodes,
      updatedAt: new Date(),
    },
  });

  return backupCodes;
}
