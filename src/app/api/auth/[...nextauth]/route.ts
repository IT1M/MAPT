import { handlers } from '@/services/auth'

/**
 * NextAuth API Route Handler
 * 
 * This route handles all NextAuth authentication requests:
 * - GET: Session checks, CSRF token, providers, callback
 * - POST: Sign in, sign out, callback
 */
export const { GET, POST } = handlers
