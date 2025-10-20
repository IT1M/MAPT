import NextAuth, { DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { prisma } from './prisma';
import { UserRole } from '.prisma/client';
import { authConfig } from '@/auth.config';
import {
  recordFailedLogin,
  recordSuccessfulLogin,
  isAccountLocked,
  getLoginSecurityStatus,
} from './login-security';

/**
 * Permission types for role-based access control
 */
export type Permission =
  | 'inventory:read'
  | 'inventory:write'
  | 'inventory:delete'
  | 'reports:view'
  | 'users:manage'
  | 'settings:manage'
  | 'audit:view';

/**
 * Extended user type with role and permissions
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      permissions: Permission[];
      lastLogin?: Date | null;
      lastLoginIp?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    lastLogin?: Date | null;
    lastLoginIp?: string | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    permissions: Permission[];
    lastLogin?: Date | null;
    lastLoginIp?: string | null;
  }
}

/**
 * Permission mapping for each user role
 * Defines what actions each role can perform
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'inventory:read',
    'inventory:write',
    'inventory:delete',
    'reports:view',
    'users:manage',
    'settings:manage',
    'audit:view',
  ],
  DATA_ENTRY: ['inventory:read', 'inventory:write'],
  SUPERVISOR: [
    'inventory:read',
    'inventory:write',
    'inventory:delete',
    'reports:view',
  ],
  MANAGER: ['inventory:read', 'reports:view'],
  AUDITOR: ['inventory:read', 'reports:view', 'audit:view'],
};

/**
 * Export NextAuth handlers with full configuration
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        console.log('🔐 [AUTH] Starting authorization...');
        console.log('📧 [AUTH] Email:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ [AUTH] Missing credentials');
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Get request metadata for security tracking
        const ipAddress = (req?.headers?.get('x-forwarded-for') ||
          req?.headers?.get('x-real-ip') ||
          'unknown') as string;
        const userAgent = (req?.headers?.get('user-agent') ||
          'unknown') as string;

        try {
          // Check if account is locked
          console.log('🔒 [AUTH] Checking account lock status...');
          const locked = await isAccountLocked(email);
          if (locked) {
            console.log('❌ [AUTH] Account is locked');
            const status = await getLoginSecurityStatus(email);
            console.log('⏰ [AUTH] Lockout ends at:', status.lockoutEndsAt);
            return null;
          }

          // Find user by email
          console.log('🔍 [AUTH] Looking up user in database...');
          const user = await prisma.user.findUnique({
            where: {
              email: email,
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
              passwordHash: true,
              lastLogin: true,
              lastLoginIp: true,
            },
          });

          if (!user) {
            console.log('❌ [AUTH] User not found');
            // Record failed attempt even for non-existent users to prevent enumeration
            await recordFailedLogin(email, ipAddress, userAgent);
            return null;
          }

          console.log(
            '✅ [AUTH] User found:',
            user.email,
            '- Role:',
            user.role
          );

          // Check if user is active
          if (!user.isActive) {
            console.log('❌ [AUTH] User account is inactive');
            return null;
          }

          // Verify password using bcrypt
          console.log('🔑 [AUTH] Verifying password...');
          const isPasswordValid = await compare(password, user.passwordHash);

          if (!isPasswordValid) {
            console.log('❌ [AUTH] Invalid password');
            // Record failed login attempt
            await recordFailedLogin(email, ipAddress, userAgent);
            return null;
          }

          console.log('✅ [AUTH] Password valid - Login successful!');

          // Record successful login
          await recordSuccessfulLogin(user.id, email, ipAddress, userAgent);

          // Return user object (without password hash)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            lastLogin: user.lastLogin,
            lastLoginIp: user.lastLoginIp,
          };
        } catch (error) {
          console.error('❌ [AUTH] Authentication error:', error);
          // Record failed attempt on error
          await recordFailedLogin(email, ipAddress, userAgent).catch((err) =>
            console.error('Failed to record failed login:', err)
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    /**
     * JWT callback - called when JWT is created or updated
     * Add user role and permissions to the token
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = ROLE_PERMISSIONS[user.role];
        token.lastLogin = user.lastLogin;
        token.lastLoginIp = user.lastLoginIp;
      }
      return token;
    },
    /**
     * Session callback - called when session is checked
     * Add role and permissions to the session object
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.permissions = token.permissions as Permission[];
        session.user.lastLogin = token.lastLogin as Date | null;
        session.user.lastLoginIp = token.lastLoginIp as string | null;
      }
      return session;
    },
  },
});
