# Design Document

## Overview

This design document outlines the implementation strategy for enhancing the existing bilingual support (English and Arabic) in the Saudi Mais Inventory Management Application, establishing robust environment variable management, optimizing for production deployment, and creating a comprehensive CI/CD pipeline with Vercel. The system already has next-intl configured with translation files in place, so this design focuses on completing the implementation, adding missing features, and establishing production-ready deployment infrastructure.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   English    │  │    Arabic    │  │  Language    │      │
│  │   Interface  │  │   Interface  │  │  Switcher    │      │
│  │    (LTR)     │  │    (RTL)     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js Middleware                       │   │
│  │  • Locale Detection & Routing                        │   │
│  │  • Authentication Check                              │   │
│  │  • Security Headers                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Application                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  next-intl   │  │   Server     │  │    API       │      │
│  │  Translation │  │  Components  │  │   Routes     │      │
│  │   Provider   │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   Prisma     │  │   Gemini     │      │
│  │   Database   │  │     ORM      │  │     AI       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│  • Source Code                                               │
│  • Environment Variables (.env.example)                      │
│  • CI/CD Workflows                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  GitHub Actions CI/CD                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Type Check (TypeScript)                          │   │
│  │  2. Lint Check (ESLint)                              │   │
│  │  3. Build Verification                               │   │
│  │  4. Environment Validation                           │   │
│  │  5. Deploy to Vercel                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Platform                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Build      │  │   Deploy     │  │  Monitoring  │      │
│  │   Process    │  │   Preview    │  │  Analytics   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Internationalization Components

#### 1.1 Language Switcher Component

**Location:** `src/components/ui/locale-switcher.tsx` (already exists, needs enhancement)

**Purpose:** Provide UI for switching between English and Arabic

**Interface:**
```typescript
interface LocaleSwitcherProps {
  variant?: 'dropdown' | 'toggle' | 'inline';
  showLabel?: boolean;
  showFlag?: boolean;
  className?: string;
}

interface LocaleOption {
  code: 'en' | 'ar';
  label: string;
  nativeLabel: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}
```

**Features:**
- Display current locale with flag icon
- Dropdown menu with both locales
- Preserve current URL path when switching
- Update cookie for persistence
- Smooth transition without page reload
- Accessible keyboard navigation
- ARIA labels for screen readers

#### 1.2 RTL Layout Provider

**Location:** `src/components/layout/RTLProvider.tsx` (new)

**Purpose:** Apply RTL-specific styles and layout adjustments

**Interface:**
```typescript
interface RTLProviderProps {
  locale: string;
  children: React.ReactNode;
}

interface RTLConfig {
  direction: 'ltr' | 'rtl';
  textAlign: 'left' | 'right';
  flexDirection: 'row' | 'row-reverse';
}
```

**Features:**
- Set HTML dir attribute
- Apply RTL-specific CSS classes
- Mirror layout components
- Flip directional icons
- Maintain LTR for numbers and dates

#### 1.3 Translation Validation Utility

**Location:** `src/utils/translation-validator.ts` (new)

**Purpose:** Validate translation completeness and consistency

**Interface:**
```typescript
interface ValidationResult {
  isValid: boolean;
  missingKeys: string[];
  extraKeys: string[];
  inconsistencies: TranslationInconsistency[];
}

interface TranslationInconsistency {
  key: string;
  issue: 'type_mismatch' | 'placeholder_mismatch' | 'format_error';
  details: string;
}

function validateTranslations(
  sourceLocale: Record<string, any>,
  targetLocale: Record<string, any>
): ValidationResult;
```

### 2. Environment Configuration Components

#### 2.1 Environment Variable Schema

**Location:** `src/config/env.ts` (new)

**Purpose:** Define and validate environment variables

**Interface:**
```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  
  // AI Integration
  GEMINI_API_KEY: z.string().startsWith('AIzaSy'),
  GEMINI_MODEL: z.string().default('gemini-1.5-pro'),
  
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_AI_INSIGHTS: z.string().transform(val => val === 'true'),
  NEXT_PUBLIC_ENABLE_AUTO_BACKUP: z.string().transform(val => val === 'true'),
  
  // Optional: Email
  EMAIL_SERVER: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Storage
  BACKUP_STORAGE_PATH: z.string().default('./backups'),
  REPORT_STORAGE_PATH: z.string().default('./public/reports'),
  
  // Rate Limiting
  API_RATE_LIMIT_PER_MINUTE: z.string().transform(Number).default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
```

#### 2.2 Environment Validation Script

**Location:** `scripts/validate-env.ts` (enhance existing)

**Purpose:** Validate environment variables on startup

**Features:**
- Parse and validate all required variables
- Provide clear error messages for missing/invalid values
- Check for common configuration mistakes
- Verify API key formats
- Test database connectivity
- Generate .env.example from schema

### 3. Deployment Configuration Components

#### 3.1 Vercel Configuration

**Location:** `vercel.json` (new)

**Purpose:** Configure Vercel deployment settings

**Structure:**
```json
{
  "buildCommand": "prisma generate && npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

#### 3.2 GitHub Actions Workflow

**Location:** `.github/workflows/deploy.yml` (new)

**Purpose:** Automate CI/CD pipeline

**Stages:**
1. **Checkout:** Clone repository
2. **Setup:** Install Node.js and dependencies
3. **Validate:** Check environment variables
4. **Type Check:** Run TypeScript compiler
5. **Lint:** Run ESLint
6. **Build:** Create production build
7. **Deploy:** Deploy to Vercel
8. **Notify:** Send deployment status

#### 3.3 Next.js Configuration Enhancements

**Location:** `next.config.js` (enhance existing)

**Additions:**
```javascript
const nextConfig = {
  // ... existing config
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: false,
      },
    ];
  },
};
```

### 4. Monitoring and Error Tracking Components

#### 4.1 Error Logging Service

**Location:** `src/services/logger.ts` (new)

**Purpose:** Centralized logging with environment-aware levels

**Interface:**
```typescript
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  stack?: string;
}

class Logger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
}

export const logger = new Logger();
```

#### 4.2 Performance Monitoring

**Location:** `src/utils/performance-monitor.ts` (enhance existing)

**Purpose:** Track and report performance metrics

**Features:**
- Core Web Vitals tracking (LCP, FID, CLS)
- API response time monitoring
- Database query performance
- Client-side rendering metrics
- Report to Vercel Analytics

## Data Models

### Translation File Structure

**Location:** `messages/{locale}.json`

**Structure:**
```typescript
interface TranslationFile {
  common: CommonTranslations;
  navigation: NavigationTranslations;
  auth: AuthTranslations;
  dashboard: DashboardTranslations;
  reports: ReportsTranslations;
  inventory: InventoryTranslations;
  forms: FormsTranslations;
  errors: ErrorsTranslations;
  settings: SettingsTranslations;
  dataLog: DataLogTranslations;
  analytics: AnalyticsTranslations;
  backup: BackupTranslations;
  dataEntry: DataEntryTranslations;
}

interface CommonTranslations {
  appName: string;
  welcome: string;
  loading: string;
  save: string;
  cancel: string;
  delete: string;
  // ... more common translations
}
```

### Environment Configuration Model

```typescript
interface EnvironmentConfig {
  database: DatabaseConfig;
  auth: AuthConfig;
  ai: AIConfig;
  application: ApplicationConfig;
  features: FeatureFlags;
  email?: EmailConfig;
  storage: StorageConfig;
  rateLimit: RateLimitConfig;
  logging: LoggingConfig;
}

interface DatabaseConfig {
  url: string;
  pooling: boolean;
  maxConnections: number;
}

interface AuthConfig {
  secret: string;
  url: string;
  sessionMaxAge: number;
}

interface AIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface FeatureFlags {
  enableAIInsights: boolean;
  enableAutoBackup: boolean;
  enableEmailNotifications: boolean;
}
```

### Deployment Configuration Model

```typescript
interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  region: string;
  buildCommand: string;
  outputDirectory: string;
  environmentVariables: Record<string, string>;
  headers: SecurityHeader[];
  redirects: Redirect[];
  rewrites: Rewrite[];
}

interface SecurityHeader {
  source: string;
  headers: Array<{
    key: string;
    value: string;
  }>;
}
```

## Error Handling

### 1. Translation Errors

**Strategy:**
- Fallback to English if translation key missing
- Log missing translation keys in development
- Display key name as fallback in production
- Provide translation validation in CI/CD

**Implementation:**
```typescript
function getTranslation(key: string, locale: string): string {
  try {
    const translation = translations[locale][key];
    if (!translation) {
      logger.warn(`Missing translation: ${key} for locale: ${locale}`);
      return translations['en'][key] || key;
    }
    return translation;
  } catch (error) {
    logger.error('Translation error', error, { key, locale });
    return key;
  }
}
```

### 2. Environment Variable Errors

**Strategy:**
- Validate on application startup
- Fail fast with clear error messages
- Provide helpful hints for common mistakes
- Document all required variables

**Implementation:**
```typescript
try {
  const env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment variable validation failed:');
    error.errors.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    console.error('\n📝 Please check your .env file against .env.example');
    process.exit(1);
  }
}
```

### 3. Deployment Errors

**Strategy:**
- Comprehensive pre-deployment checks
- Automatic rollback on failure
- Detailed error logging
- Slack/email notifications for critical failures

**Error Categories:**
- Build failures (TypeScript, ESLint)
- Environment configuration errors
- Database migration failures
- API connectivity issues
- Resource allocation errors

### 4. Runtime Errors

**Strategy:**
- Centralized error logging
- User-friendly error messages
- Automatic error reporting
- Error boundaries for React components

**Implementation:**
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
    });
    
    // Report to monitoring service
    reportError(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## Testing Strategy

### 1. Translation Testing

**Approach:**
- Automated validation of translation completeness
- Visual regression testing for RTL layouts
- Manual QA for translation accuracy
- Accessibility testing for both locales

**Test Cases:**
- All translation keys exist in both languages
- No orphaned translation keys
- Placeholder variables match between locales
- RTL layout renders correctly
- Language switcher works on all pages
- Locale persistence across sessions

### 2. Environment Configuration Testing

**Approach:**
- Unit tests for environment validation
- Integration tests with different configurations
- Smoke tests in staging environment

**Test Cases:**
- Valid environment variables pass validation
- Invalid variables fail with clear messages
- Missing required variables are detected
- Optional variables have correct defaults
- Database connection succeeds
- API keys are valid format

### 3. Deployment Testing

**Approach:**
- Automated deployment to preview environment
- Smoke tests on preview deployment
- Performance testing
- Security scanning

**Test Cases:**
- Build completes successfully
- All pages render without errors
- API routes respond correctly
- Database migrations apply successfully
- Static assets load correctly
- Security headers are present

### 4. End-to-End Testing

**Approach:**
- Automated E2E tests for critical flows
- Manual testing for complex scenarios
- Cross-browser testing
- Mobile responsiveness testing

**Test Cases:**
- User can switch languages
- Authentication works in both locales
- Data entry form works in both locales
- Reports generate in selected language
- Analytics display correctly in RTL
- Settings save and persist

## Performance Optimization

### 1. Translation Loading

**Strategy:**
- Load only required locale
- Code splitting for translation files
- Cache translations in memory
- Lazy load non-critical translations

**Implementation:**
```typescript
// Dynamic import of translations
const messages = await import(`../messages/${locale}.json`);

// Cache in memory
const translationCache = new Map<string, any>();

function getTranslations(locale: string) {
  if (translationCache.has(locale)) {
    return translationCache.get(locale);
  }
  const messages = require(`../messages/${locale}.json`);
  translationCache.set(locale, messages);
  return messages;
}
```

### 2. Build Optimization

**Strategy:**
- Enable Next.js production optimizations
- Minimize bundle size
- Tree shaking unused code
- Image optimization
- Font optimization

**Configuration:**
```javascript
// next.config.js
module.exports = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['recharts', 'react-icons'],
  },
};
```

### 3. Runtime Performance

**Strategy:**
- Implement code splitting
- Lazy load heavy components
- Use React.memo for expensive renders
- Optimize database queries
- Implement caching strategies

**Key Optimizations:**
- Virtualized tables for large datasets
- Debounced search inputs
- Optimistic UI updates
- Background data fetching
- Service worker for offline support

### 4. Database Performance

**Strategy:**
- Connection pooling
- Query optimization
- Proper indexing
- Read replicas for heavy queries
- Caching layer (Redis)

**Configuration:**
```typescript
// Prisma connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=10',
    },
  },
});
```

## Security Considerations

### 1. Environment Variables

**Measures:**
- Never commit .env files
- Use Vercel encrypted environment variables
- Rotate secrets regularly
- Separate secrets per environment
- Audit access to secrets

### 2. API Security

**Measures:**
- Rate limiting on all API routes
- CSRF protection
- Input validation and sanitization
- SQL injection prevention (Prisma)
- XSS protection

### 3. Authentication

**Measures:**
- Secure session management
- HTTP-only cookies
- HTTPS only in production
- Password hashing (bcrypt)
- Session timeout

### 4. Headers and CSP

**Measures:**
- Strict Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy
- Permissions-Policy

## Deployment Strategy

### 1. Environment Setup

**Environments:**
- **Development:** Local development with hot reload
- **Preview:** Automatic preview deployments for PRs
- **Production:** Main branch deployments

**Configuration:**
- Separate environment variables per environment
- Different database instances
- Staging database for testing migrations
- Production database with backups

### 2. Deployment Process

**Steps:**
1. Developer pushes code to feature branch
2. GitHub Actions runs CI checks
3. Vercel creates preview deployment
4. QA tests preview deployment
5. PR approved and merged to main
6. GitHub Actions runs full CI/CD
7. Vercel deploys to production
8. Smoke tests run on production
9. Monitoring alerts activated

### 3. Rollback Strategy

**Approach:**
- Instant rollback via Vercel dashboard
- Keep last 10 deployments available
- Database migration rollback procedure
- Automated health checks post-deployment

**Rollback Triggers:**
- Failed health checks
- Error rate spike
- Performance degradation
- Manual trigger by admin

### 4. Monitoring and Alerts

**Metrics:**
- Error rate
- Response time
- Database connection pool
- Memory usage
- CPU usage
- Core Web Vitals

**Alerts:**
- Error rate > 1%
- Response time > 3s
- Database connection failures
- Memory usage > 80%
- Failed deployments

## Migration Plan

### Phase 1: Environment Configuration (Week 1)

1. Create environment variable schema
2. Enhance validation script
3. Update .env.example
4. Document all variables
5. Test in development

### Phase 2: Translation Enhancements (Week 1-2)

1. Create translation validation utility
2. Enhance language switcher
3. Implement RTL provider
4. Add missing translations
5. Test RTL layouts

### Phase 3: Deployment Setup (Week 2)

1. Create vercel.json
2. Set up GitHub Actions workflow
3. Configure environment variables in Vercel
4. Set up database connection
5. Test preview deployments

### Phase 4: Monitoring and Optimization (Week 3)

1. Implement error logging
2. Set up performance monitoring
3. Configure alerts
4. Optimize build process
5. Load testing

### Phase 5: Production Deployment (Week 3-4)

1. Final QA testing
2. Database migration dry run
3. Production deployment
4. Post-deployment verification
5. Documentation and handoff

## Success Criteria

1. **Internationalization:**
   - All UI text translatable
   - Language switcher works on all pages
   - RTL layout correct for Arabic
   - No missing translations
   - Locale persists across sessions

2. **Environment Configuration:**
   - All variables validated on startup
   - Clear error messages for misconfigurations
   - Separate configs for dev/prod
   - Secrets properly encrypted
   - Documentation complete

3. **Deployment:**
   - Automated CI/CD pipeline
   - Preview deployments for PRs
   - Production deployments < 5 minutes
   - Zero-downtime deployments
   - Rollback capability

4. **Performance:**
   - Lighthouse score > 90
   - First Contentful Paint < 1.5s
   - Time to Interactive < 3s
   - API response time < 500ms
   - Database queries optimized

5. **Monitoring:**
   - Error tracking active
   - Performance metrics collected
   - Alerts configured
   - Logs centralized
   - Dashboards accessible
