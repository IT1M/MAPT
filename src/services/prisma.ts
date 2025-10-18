import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

/**
 * Create Prisma Client with enhanced configuration
 */
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  // Add error event listener for Prisma client
  client.$on('error' as never, (e: any) => {
    console.error('Prisma Client Error:', e)
  })

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
