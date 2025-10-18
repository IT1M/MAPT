# Database Setup Guide

## Overview

This directory contains the Prisma schema and database-related scripts for the Saudi Mais Co. Medical Products Inventory Management System.

## Files

- `schema.prisma` - Database schema definition
- `seed.ts` - Database seeding script with test data
- `migrations/` - Database migration history

## Quick Start

### 1. Setup Database

Ensure PostgreSQL is running and update your `.env.local` with the connection string:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/medical_inventory"
```

### 2. Run Migrations

Create the database schema:

```bash
npm run db:migrate
```

This will:
- Create all tables defined in `schema.prisma`
- Apply any pending migrations
- Generate the Prisma Client

### 3. Seed Database

Populate with test data:

```bash
npm run db:seed
```

This creates:
- **5 test users** (one for each role: Admin, Data Entry, Supervisor, Manager, Auditor)
- **6 sample medical products** (gloves, masks, syringes, bandages, thermometers, alcohol swabs)
- **9 inventory items** with various statuses and locations
- **5 sample transactions** (receive, issue, transfer, dispose)
- **Sample audit logs** for tracking changes

### Test User Credentials

All test users have the same password: `Password123!`

| Email | Role | Permissions |
|-------|------|-------------|
| admin@saudimais.com | Admin | Full system access |
| dataentry@saudimais.com | Data Entry | Create/update inventory |
| supervisor@saudimais.com | Supervisor | Review and approve changes |
| manager@saudimais.com | Manager | View reports and analytics |
| auditor@saudimais.com | Auditor | View audit logs |

## Database Schema

### Models

#### User
- Stores user accounts with authentication credentials
- Supports 5 roles: ADMIN, DATA_ENTRY, SUPERVISOR, MANAGER, AUDITOR
- Password hashed with bcrypt (12 salt rounds)

#### Session
- Manages NextAuth sessions
- Linked to User model with cascade delete

#### Product
- Medical product catalog
- Bilingual support (English and Arabic)
- Includes stock level thresholds

#### InventoryItem
- Tracks physical inventory
- Links to Product
- Includes batch numbers, expiry dates, locations
- Status: AVAILABLE, RESERVED, EXPIRED, DAMAGED

#### Transaction
- Records all inventory movements
- Types: RECEIVE, ISSUE, ADJUST, TRANSFER, DISPOSE
- Tracks who performed the action

#### AuditLog
- Comprehensive audit trail
- Records all system changes
- Includes IP address and user agent
- Stores before/after changes as JSON

## Useful Commands

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Push schema changes without migrations (development)
npm run db:push

# Create a new migration
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with test data
npm run db:seed

# Verify database connection
npm run db:verify
```

## Resetting Database

To start fresh:

```bash
# Reset database (WARNING: deletes all data)
npm run db:push -- --force-reset

# Run migrations
npm run db:migrate

# Seed with test data
npm run db:seed
```

## Production Considerations

### Before Deployment

1. **Backup Strategy**: Implement regular database backups
2. **Connection Pooling**: Configure appropriate connection pool size
3. **Migrations**: Always test migrations on staging first
4. **Indexes**: Review and add indexes for frequently queried fields
5. **Security**: Use strong passwords and restrict database access

### Environment Variables

Production should use:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&connection_limit=10"
```

### Migration Strategy

1. Test migration on staging database
2. Backup production database
3. Run migration during low-traffic period
4. Verify data integrity
5. Monitor application logs

## Troubleshooting

### Connection Issues

```bash
# Test database connection
psql -U username -d database_name -h localhost

# Check if PostgreSQL is running
sudo systemctl status postgresql
```

### Migration Conflicts

```bash
# Reset migrations (development only)
rm -rf prisma/migrations
npm run db:push -- --force-reset
npm run db:migrate

# Resolve conflicts manually
npm run db:migrate -- --create-only
# Edit the migration file
npm run db:migrate
```

### Seed Script Fails

```bash
# Check for existing data conflicts
npm run db:studio

# Clear specific tables
# Use Prisma Studio or SQL commands

# Re-run seed
npm run db:seed
```

## Schema Changes

When modifying `schema.prisma`:

1. Make changes to the schema file
2. Generate a migration: `npm run db:migrate`
3. Review the generated SQL
4. Test on development database
5. Update seed script if needed
6. Commit migration files to version control

## Best Practices

1. **Always use migrations** in production (never `db:push`)
2. **Test migrations** on staging before production
3. **Backup before migrations** in production
4. **Use transactions** for complex data operations
5. **Index frequently queried fields** for performance
6. **Monitor query performance** with Prisma Studio
7. **Keep seed data realistic** for testing

## Support

For Prisma-specific issues:
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma GitHub](https://github.com/prisma/prisma)
- [Prisma Discord](https://pris.ly/discord)

For PostgreSQL issues:
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Community](https://www.postgresql.org/community/)
