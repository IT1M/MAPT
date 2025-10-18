import NextAuth, { DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcrypt'
import { prisma } from './prisma'
import { UserRole } from '.prisma/client'
import { authConfig } from '@/auth.config'

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
  | 'audit:view'

/**
 * Extended user type with role and permissions
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      permissions: Permission[]
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: UserRole
    permissions: Permission[]
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
  DATA_ENTRY: [
    'inventory:read',
    'inventory:write',
  ],
  SUPERVISOR: [
    'inventory:read',
    'inventory:write',
    'inventory:delete',
    'reports:view',
  ],
  MANAGER: [
    'inventory:read',
    'reports:view',
  ],
  AUDITOR: [
    'inventory:read',
    'reports:view',
    'audit:view',
  ],
}

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
      async authorize(credentials) {
        console.log('🔐 [AUTH] Starting authorization...')
        console.log('📧 [AUTH] Email:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ [AUTH] Missing credentials')
          return null
        }

        try {
          // Find user by email
          console.log('🔍 [AUTH] Looking up user in database...')
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string,
            },
          })

          if (!user) {
            console.log('❌ [AUTH] User not found')
            return null
          }

          console.log('✅ [AUTH] User found:', user.email, '- Role:', user.role)

          // Verify password using bcrypt
          console.log('🔑 [AUTH] Verifying password...')
          const isPasswordValid = await compare(
            credentials.password as string,
            user.passwordHash
          )

          if (!isPasswordValid) {
            console.log('❌ [AUTH] Invalid password')
            return null
          }

          console.log('✅ [AUTH] Password valid - Login successful!')

          // Return user object (without password hash)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('❌ [AUTH] Authentication error:', error)
          return null
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
        token.id = user.id
        token.role = user.role
        token.permissions = ROLE_PERMISSIONS[user.role]
      }
      return token
    },
    /**
     * Session callback - called when session is checked
     * Add role and permissions to the session object
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.permissions = token.permissions as Permission[]
      }
      return session
    },
  },
})
