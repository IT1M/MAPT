import type { NextAuthConfig } from 'next-auth'

/**
 * Auth configuration for middleware (Edge Runtime compatible)
 * This config doesn't include bcrypt or database operations
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname.includes('/login')
      
      if (isOnLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl))
        return true
      }
      
      return isLoggedIn
    },
  },
  providers: [], // Providers are added in auth.ts
}
