# Production Database Setup Guide

This guide provides step-by-step instructions for setting up a production PostgreSQL database for the Saudi Mais Inventory Management Application.

## Table of Contents

1. [Database Options](#database-options)
2. [Vercel Postgres Setup](#vercel-postgres-setup)
3. [External PostgreSQL Setup](#external-postgresql-setup)
4. [SSL Configuration](#ssl-configuration)
5. [Connection Testing](#connection-testing)
6. [Troubleshooting](#troubleshooting)

---

## Database Options

You have several options for hosting your production PostgreSQL database:

### Option 1: Vercel Postgres (Recommended for Vercel Deployments)
- **Pros**: Seamless integration, automatic SSL, connection pooling included
- **Cons**: Vendor lock-in, pricing based on usage
- **Best for**: Applications deployed on Vercel

### Option 2: External PostgreSQL Providers
- **AWS RDS**: Enterprise-grade, highly scalable
- **Google Cloud SQL**: Good integration with Google services
- **DigitalOcean Managed Databases**: Simple and cost-effective
- **Azure Database for PostgreSQL**: Good for Microsoft ecosystem
- **Supabase**: Open-source alternative with good features

### Option 3: Self-Hosted PostgreSQL
- **Pros**: Full control, potentially lower cost
- **Cons**: Requires maintenance, security management, backup setup
- **Best for**: Organizations with existing infrastructure

---

## Vercel Postgres Setup

### Step 1: Create Vercel Postgres Database

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose your database name (e.g., `mais-inventory-prod`)
6. Select your region (choose closest to your users, e.g., `iad1` for US East)
7. Click **Create**

### Step 2: Get Connection Strings

After creation, Vercel provides several connection strings:

```bash
# Pooled connection (use for application)
POSTGRES_PRISMA_URL="postgres://user:pass@pooled-host.postgres.vercel-storage.com:5432/verceldb?sslmode=require&pgbouncer=true"

# Direct connection (use for migrations)
POSTGRES_URL_NON_POOLING="postgres://user:pass@direct-host.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
```

### Step 3: Configure Environment Variables

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

```bash
# Use the pooled connection for the application
DATABASE_URL=<POSTGRES_PRISMA_URL>

# Use the direct connection for migrations
DATABASE_URL_DIRECT=<POSTGRES_URL_NON_POOLING>
```

3. Set the environment to **Production**
4. Click **Save**

### Step 4: Link to Local Development (Optional)

To test with production database locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local
```

---

## External PostgreSQL Setup

### Step 1: Create PostgreSQL Database

#### AWS RDS Example:

1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Click **Create database**
3. Choose **PostgreSQL**
4. Select **Production** template
5. Configure:
   - DB instance identifier: `mais-inventory-prod`
   - Master username: `mais_admin`
   - Master password: (generate strong password)
   - DB instance class: `db.t3.micro` (or larger based on needs)
   - Storage: 20 GB SSD (with autoscaling)
   - VPC: Default or custom
   - Public access: **Yes** (if accessing from Vercel)
   - VPC security group: Create new or use existing
6. Click **Create database**

#### DigitalOcean Example:

1. Go to [DigitalOcean Databases](https://cloud.digitalocean.com/databases)
2. Click **Create Database Cluster**
3. Choose **PostgreSQL**
4. Select version: PostgreSQL 15 or later
5. Choose datacenter region (closest to users)
6. Select cluster configuration (1GB RAM minimum)
7. Name your database: `mais-inventory-prod`
8. Click **Create Database Cluster**

### Step 2: Configure Security

#### Firewall Rules:

Allow connections from Vercel IP ranges:

```bash
# Vercel IP ranges (check latest at https://vercel.com/docs/concepts/edge-network/regions)
76.76.21.0/24
76.76.21.21/32
# Add all Vercel IPs for your region
```

#### SSL/TLS Configuration:

1. Download SSL certificate from your provider
2. Enable SSL requirement in database settings
3. Configure connection string with SSL mode

### Step 3: Create Database User

Connect to your database and create a dedicated user:

```sql
-- Create application user
CREATE USER mais_app WITH PASSWORD 'your_secure_password';

-- Create database
CREATE DATABASE mais_inventory;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mais_inventory TO mais_app;

-- Connect to the database
\c mais_inventory

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO mais_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mais_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mais_app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO mais_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO mais_app;
```

### Step 4: Configure Connection String

Format your connection string:

```bash
# Standard PostgreSQL connection string
DATABASE_URL="postgresql://mais_app:your_secure_password@your-host.com:5432/mais_inventory?schema=public&sslmode=require"

# For direct connection (migrations)
DATABASE_URL_DIRECT="postgresql://mais_app:your_secure_password@your-host.com:5432/mais_inventory?schema=public&sslmode=require"
```

### Step 5: Set Up Connection Pooling (Recommended)

#### Option A: PgBouncer (Recommended)

Install PgBouncer on a separate server or container:

```bash
# Install PgBouncer
sudo apt-get install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
mais_inventory = host=your-postgres-host.com port=5432 dbname=mais_inventory

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

Update connection string to use PgBouncer:

```bash
DATABASE_URL="postgresql://mais_app:password@pgbouncer-host:6432/mais_inventory?schema=public&sslmode=require"
```

#### Option B: Supabase Pooler

If using Supabase, connection pooling is built-in:

```bash
# Pooled connection (port 6543)
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:6543/postgres?pgbouncer=true"

# Direct connection (port 5432)
DATABASE_URL_DIRECT="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
```

---

## SSL Configuration

### Enable SSL in Connection String

Add SSL parameters to your connection string:

```bash
# Require SSL (recommended for production)
?sslmode=require

# Verify CA certificate (most secure)
?sslmode=verify-ca&sslcert=/path/to/client-cert.pem&sslkey=/path/to/client-key.pem&sslrootcert=/path/to/ca-cert.pem

# Verify full certificate (maximum security)
?sslmode=verify-full&sslcert=/path/to/client-cert.pem&sslkey=/path/to/client-key.pem&sslrootcert=/path/to/ca-cert.pem
```

### SSL Modes Explained

- `disable`: No SSL (never use in production)
- `require`: SSL required but doesn't verify certificate
- `verify-ca`: SSL required and verifies certificate authority
- `verify-full`: SSL required and verifies certificate and hostname

**Recommendation**: Use `require` minimum, `verify-full` for maximum security.

---

## Connection Testing

### Test from Local Machine

Create a test script `scripts/test-db-connection.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

async function testConnection() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🔌 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 PostgreSQL version:', result);
    
    // Test table access
    const userCount = await prisma.user.count();
    console.log('👥 User count:', userCount);
    
    console.log('✅ All database tests passed!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

Run the test:

```bash
# Set environment variable
export DATABASE_URL="your-connection-string"

# Run test
npx tsx scripts/test-db-connection.ts
```

### Test from Vercel

Deploy a test endpoint:

```typescript
// app/api/health/db/route.ts
import { prisma } from '@/services/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

Test the endpoint:

```bash
curl https://your-app.vercel.app/api/health/db
```

---

## Troubleshooting

### Connection Timeout

**Problem**: Connection times out

**Solutions**:
1. Check firewall rules allow Vercel IPs
2. Verify database is publicly accessible (if needed)
3. Check VPC security groups (AWS)
4. Increase connection timeout in connection string:
   ```
   ?connect_timeout=30
   ```

### SSL Certificate Errors

**Problem**: SSL verification fails

**Solutions**:
1. Use `sslmode=require` instead of `verify-full`
2. Download and specify CA certificate
3. Check certificate expiration
4. Verify hostname matches certificate

### Too Many Connections

**Problem**: "too many connections" error

**Solutions**:
1. Enable connection pooling (PgBouncer)
2. Reduce `connection_limit` parameter
3. Increase max connections in PostgreSQL:
   ```sql
   ALTER SYSTEM SET max_connections = 100;
   SELECT pg_reload_conf();
   ```
4. Check for connection leaks in application code

### Authentication Failed

**Problem**: Password authentication fails

**Solutions**:
1. Verify username and password are correct
2. Check user has necessary permissions
3. Verify user can connect from your IP
4. Check `pg_hba.conf` settings (self-hosted)

### Migration Failures

**Problem**: Migrations fail in production

**Solutions**:
1. Use `DATABASE_URL_DIRECT` for migrations
2. Ensure user has DDL permissions
3. Run migrations manually if needed:
   ```bash
   DATABASE_URL=$DATABASE_URL_DIRECT npx prisma migrate deploy
   ```
4. Check for conflicting schema changes

### Performance Issues

**Problem**: Slow query performance

**Solutions**:
1. Enable connection pooling
2. Add database indexes
3. Optimize queries
4. Increase database resources
5. Monitor with `EXPLAIN ANALYZE`

---

## Security Checklist

- [ ] SSL/TLS enabled and enforced
- [ ] Strong database password (minimum 32 characters)
- [ ] Firewall rules restrict access to known IPs
- [ ] Database user has minimum required permissions
- [ ] Connection strings stored securely (encrypted environment variables)
- [ ] Regular security updates applied
- [ ] Automated backups configured
- [ ] Backup restoration tested
- [ ] Monitoring and alerting configured
- [ ] Audit logging enabled

---

## Next Steps

After setting up your production database:

1. ✅ Configure environment variables in Vercel
2. ✅ Run database migrations
3. ✅ Test database connectivity
4. ✅ Set up automated backups
5. ✅ Configure monitoring and alerts
6. ✅ Document connection details securely
7. ✅ Test backup restoration procedure

For migration instructions, see [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)

For backup configuration, see [AUDIT_BACKUP_SYSTEM.md](./AUDIT_BACKUP_SYSTEM.md)
