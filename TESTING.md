# Testing Guide

This document provides instructions for testing the Saudi Mais Co. Medical Products Inventory Management System.

## Prerequisites

Before running tests, ensure you have:

1. **Environment Variables**: Copy `.env.example` to `.env.local` and fill in all required values
2. **Database**: PostgreSQL database running and accessible
3. **Dependencies**: All npm packages installed (`npm install`)
4. **Database Schema**: Run migrations (`npm run db:migrate`)

## Quick Start

### 1. Seed the Database

Populate the database with test data:

```bash
npm run db:seed
```

This creates:
- 5 test users (one for each role)
- 6 sample medical products
- 9 inventory items with various statuses
- 5 sample transactions
- Sample audit logs

**Test User Credentials:**
- Admin: `admin@saudimais.com` / `Password123!`
- Data Entry: `dataentry@saudimais.com` / `Password123!`
- Supervisor: `supervisor@saudimais.com` / `Password123!`
- Manager: `manager@saudimais.com` / `Password123!`
- Auditor: `auditor@saudimais.com` / `Password123!`

### 2. Validate Environment

Check that all environment variables are properly configured:

```bash
npm run validate:env
```

This validates:
- All required environment variables are present
- DATABASE_URL format is correct
- NEXTAUTH_SECRET meets security requirements
- Database connection is working
- Gemini API key is valid

### 3. Run All Tests

Execute all automated tests:

```bash
npm run test:all
```

Or run individual test suites:

```bash
# Test authentication system
npm run test:auth

# Test theme and locale switching
npm run test:theme-locale

# Test AI integration
npm run test:ai
```

## Test Suites

### Authentication Tests (`npm run test:auth`)

Tests the authentication and authorization system:

- ✅ Verifies all 5 user roles exist in database
- ✅ Validates password hashing with bcrypt
- ✅ Checks session model accessibility
- ✅ Confirms all role permissions are configured
- ✅ Tests audit log relations

**Expected Output:**
```
🔐 Testing Authentication Flow End-to-End
============================================================
✅ User exists for role ADMIN
✅ Password hash for admin@saudimais.com
...
📈 Results: 13/13 tests passed
```

### Theme & Locale Tests (`npm run test:theme-locale`)

Tests internationalization and theme switching:

- ✅ Verifies locale files exist (en.json, ar.json)
- ✅ Validates i18n configuration
- ✅ Checks theme toggle component
- ✅ Tests RTL support for Arabic
- ✅ Validates Tailwind dark mode config
- ✅ Confirms ThemeProvider setup
- ✅ Checks translation key consistency

**Expected Output:**
```
🎨 Testing Theme and Locale Switching
============================================================
✅ Locale file exists: en
✅ Locale file exists: ar
...
📈 Results: 14/14 tests passed
```

### AI Integration Tests (`npm run test:ai`)

Tests Gemini AI service integration:

- ✅ Verifies Gemini API connection
- ✅ Tests `analyzeInventoryTrends()` function
- ✅ Tests `generateInsights()` function
- ✅ Tests `predictStockNeeds()` function
- ✅ Validates caching mechanism
- ✅ Tests error handling and fallbacks
- ✅ Checks circuit breaker functionality

**Expected Output:**
```
🤖 Testing AI Integration
============================================================
✅ Gemini API initialization
✅ analyzeInventoryTrends returns array
...
📈 Results: 15/15 tests passed
```

## Manual Testing Checklist

After running automated tests, perform these manual tests:

### Authentication Flow

1. **Login**
   - [ ] Navigate to `/en/login`
   - [ ] Login with each test user
   - [ ] Verify redirect to dashboard

2. **Route Protection**
   - [ ] Try accessing `/en/settings` as non-admin (should be denied)
   - [ ] Try accessing `/en/audit` as data entry user (should be denied)
   - [ ] Verify each role can access appropriate pages

3. **Session Persistence**
   - [ ] Login and close browser
   - [ ] Reopen browser and verify still logged in
   - [ ] Check session expires after 24 hours

4. **Logout**
   - [ ] Click logout button
   - [ ] Verify redirect to login page
   - [ ] Try accessing protected route (should redirect to login)

### Theme Switching

1. **Toggle Theme**
   - [ ] Click theme toggle in header
   - [ ] Verify smooth transition to dark mode
   - [ ] Toggle back to light mode
   - [ ] Check all pages render correctly in both themes

2. **Theme Persistence**
   - [ ] Set theme to dark mode
   - [ ] Refresh page
   - [ ] Verify dark mode persists
   - [ ] Close and reopen browser
   - [ ] Verify theme still persists

### Locale Switching

1. **Switch Locale**
   - [ ] Click locale switcher
   - [ ] Switch from English to Arabic
   - [ ] Verify all text translates
   - [ ] Check navigation items are translated

2. **RTL Layout**
   - [ ] In Arabic locale, verify layout is right-to-left
   - [ ] Check form inputs align correctly
   - [ ] Verify navigation menu is on the right side
   - [ ] Test all interactive elements work in RTL

3. **Locale Persistence**
   - [ ] Switch to Arabic
   - [ ] Refresh page
   - [ ] Verify Arabic persists
   - [ ] Close and reopen browser
   - [ ] Verify locale still persists

### AI Features

1. **Dashboard Insights**
   - [ ] Navigate to dashboard
   - [ ] Verify AI insights widget loads
   - [ ] Check insights are relevant to inventory data
   - [ ] Verify priority badges display correctly

2. **Inventory Trends**
   - [ ] Check trends widget on dashboard
   - [ ] Verify trend indicators (increasing/decreasing/stable)
   - [ ] Check confidence scores display
   - [ ] Verify recommendations are actionable

3. **Error Handling**
   - [ ] Temporarily set invalid GEMINI_API_KEY
   - [ ] Restart app
   - [ ] Verify fallback responses display
   - [ ] Check no errors in console
   - [ ] Restore valid API key

### Inventory Management

1. **View Inventory**
   - [ ] Navigate to `/en/inventory`
   - [ ] Verify inventory items display
   - [ ] Check pagination works
   - [ ] Test search functionality
   - [ ] Try filtering by status

2. **Add Inventory Item**
   - [ ] Click "Add Item" button
   - [ ] Fill in form with valid data
   - [ ] Submit form
   - [ ] Verify success message
   - [ ] Check item appears in list

3. **Edit Inventory Item**
   - [ ] Click edit on an item
   - [ ] Modify quantity
   - [ ] Save changes
   - [ ] Verify update success
   - [ ] Check audit log records change

4. **Delete Inventory Item**
   - [ ] Click delete on an item
   - [ ] Confirm deletion
   - [ ] Verify item removed
   - [ ] Check audit log records deletion

### Audit Logs

1. **View Audit Logs** (as Admin or Auditor)
   - [ ] Navigate to `/en/audit`
   - [ ] Verify logs display
   - [ ] Check user actions are recorded
   - [ ] Verify timestamps are correct
   - [ ] Test filtering by user/action/entity

## Troubleshooting

### Database Connection Fails

```bash
# Check database is running
psql -U postgres -c "SELECT version();"

# Verify DATABASE_URL in .env.local
cat .env.local | grep DATABASE_URL

# Test connection manually
npm run db:verify
```

### Gemini API Errors

```bash
# Verify API key is set
cat .env.local | grep GEMINI_API_KEY

# Test API connection
npm run test:ai

# Check API quota at: https://makersuite.google.com/app/apikey
```

### Seed Script Fails

```bash
# Reset database
npm run db:push -- --force-reset

# Run migrations
npm run db:migrate

# Try seeding again
npm run db:seed
```

### Tests Fail

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npm run db:generate

# Run tests again
npm run test:all
```

## Continuous Integration

For CI/CD pipelines, run tests in this order:

```bash
# 1. Install dependencies
npm ci

# 2. Generate Prisma client
npm run db:generate

# 3. Run migrations
npm run db:migrate

# 4. Seed database
npm run db:seed

# 5. Validate environment
npm run validate:env

# 6. Run all tests
npm run test:all

# 7. Build application
npm run build
```

## Performance Benchmarks

Expected test execution times:

- **Environment Validation**: ~2-5 seconds
- **Authentication Tests**: ~1-3 seconds
- **Theme/Locale Tests**: <1 second
- **AI Integration Tests**: ~5-15 seconds (depending on API response time)
- **Database Seeding**: ~2-5 seconds

Total automated test time: **~10-30 seconds**

## Next Steps

After all tests pass:

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Access Application**
   - Open http://localhost:3000
   - Login with test credentials
   - Explore all features

3. **Monitor Logs**
   - Check console for errors
   - Review network requests
   - Monitor API responses

4. **Production Deployment**
   - Run `npm run build` to verify production build
   - Deploy to your hosting platform
   - Run smoke tests on production

## Support

If you encounter issues:

1. Check this testing guide
2. Review error messages carefully
3. Verify all prerequisites are met
4. Check environment variables
5. Ensure database is accessible
6. Verify API keys are valid

For additional help, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth Documentation](https://next-auth.js.org)
- [Gemini AI Documentation](https://ai.google.dev/docs)
