import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

/**
 * Get database URL with production optimizations
 * 
 * In production, adds connection pooling parameters for optimal performance:
 * - pgbouncer=true: Enables PgBouncer compatibility mode
 * - connection_limit: Limits concurrent connections per instance
 * - pool_timeout: Maximum time to wait for a connection from the pool
 */
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || ''
  
  // In production, add connection pooling parameters if not already present
  if (process.env.NODE_ENV === 'production' && !baseUrl.includes('pgbouncer')) {
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}pgbouncer=true&connection_limit=10&pool_timeout=20`
  }
  
  return baseUrl
}

/**
 * Create Prisma Client with enhanced configuration
 * 
 * Production optimizations:
 * - Connection pooling via PgBouncer
 * - Limited connection pool size (10 connections)
 * - Error-only logging to reduce overhead
 * - Query timeout configuration
 */
const prismaClientSingleton = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  const client = new PrismaClient({
    log: isProduction 
      ? ['error'] 
      : ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    },
    // Add query timeout in production to prevent long-running queries
    ...(isProduction && {
      // @ts-ignore - Prisma doesn't expose this in types but it's supported
      __internal: {
        engine: {
          queryTimeout: 30000 // 30 seconds
        }
      }
    })
  })

  // Add error event listener for Prisma client
  client.$on('error' as never, (e: any) => {
    console.error('Prisma Client Error:', e)
  })

  // Log connection info in development
  if (!isProduction) {
    console.log('🔌 Prisma Client initialized with URL:', getDatabaseUrl().replace(/:[^:@]+@/, ':****@'))
  }

  return client
}

/**
 * Prisma Client Singleton
 * 
 * In development, we use a global variable to persist the Prisma Client
 * across hot reloads to prevent connection pool exhaustion.
 * 
 * In production, we create a new instance for each deployment.
 */
export const prisma = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

/**
 * Graceful shutdown handler
 * Ensures database connections are properly closed before process exit
 */
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...')
  await disconnectPrisma()
  process.exit(0)
}

// Register graceful shutdown handlers
process.on('beforeExit', async () => {
  await disconnectPrisma()
})

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

/**
 * Gracefully disconnect from the database
 * Useful for cleanup in serverless environments
 */
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error disconnecting from database:', error)
    throw error
  }
}

/**
 * Test database connection
 * Returns true if connection is successful, false otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}
