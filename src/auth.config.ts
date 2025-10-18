import type { NextAuthConfig } from 'next-auth'

/**
 * Auth configuration for middleware (Edge Runtime compatible)
 * This config doesn't include bcrypt or database operations
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/en/login',
    error: '/en/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (default)
    // Note: maxAge can be extended to 30 days when "Remember Me" is checked
    // This is handled in the login flow
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-authjs.session-token' 
        : 'authjs.session-token',
      options: {
        httpOnly: true, // Prevent JavaScript access to cookies
        sameSite: 'lax', // CSRF protection
        path: '/',
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      },
    },
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname.includes('/login')
      
      if (isOnLoginPage) {
        if (isLoggedIn) {
          // Extract locale from current path or default to 'ar'
          const locale = nextUrl.pathname.split('/')[1] || 'ar'
          // Get callback URL from query params
          const callbackUrl = nextUrl.searchParams.get('callbackUrl')
          
          // Redirect to root page which will handle role-based routing
          const redirectUrl = new URL(`/${locale}`, nextUrl)
          if (callbackUrl) {
            redirectUrl.searchParams.set('callbackUrl', callbackUrl)
          }
          return Response.redirect(redirectUrl)
        }
        return true
      }
      
      return isLoggedIn
    },
  },
  providers: [], // Providers are added in auth.ts
}
