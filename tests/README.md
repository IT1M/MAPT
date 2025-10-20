# Test Suite Documentation

This directory contains the comprehensive test suite for the Saudi Mais Medical Inventory System.

## Directory Structure

```
tests/
├── unit/                    # Unit tests for utilities and services
│   ├── utils/              # Utility function tests
│   ├── validators/         # Validation function tests
│   └── services/           # Service layer tests
├── integration/            # Integration tests
│   └── api/               # API endpoint tests
├── e2e/                   # End-to-end tests (Playwright)
├── load/                  # Load testing (Artillery)
│   ├── api-load-test.yml  # Load test configuration
│   └── load-test-processor.js
└── helpers/               # Test utilities
    ├── setup.ts           # Test environment setup
    ├── fixtures.ts        # Test data fixtures
    ├── mocks.ts           # Mock services
    ├── api-helpers.ts     # API testing utilities
    ├── db-helpers.ts      # Database utilities
    └── index.ts           # Unified exports
```

## Running Tests

### Unit Tests
```bash
npm run test:unit          # Run all unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run with coverage report
```

### Integration Tests
```bash
npm run test:integration   # Run all integration tests
```

### End-to-End Tests
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run E2E tests with UI
```

### Load Tests
```bash
npm run test:load         # Run load tests
```

### Performance Tests
```bash
npm run test:lighthouse   # Run Lighthouse CI
```

### All Tests
```bash
npm test                  # Run all tests
```

## Test Helpers

### Fixtures
Create test data easily:
```typescript
import { createTestUser, createTestItem } from '@/tests/helpers';

const user = await createTestUser({ role: 'ADMIN' });
const item = await createTestItem(user.id);
```

### Mocks
Mock external services:
```typescript
import { mockGeminiService, mockEmailService } from '@/tests/helpers';

mockGeminiService.generateInsights.mockResolvedValue({ insights: [...] });
```

### API Helpers
Test API endpoints:
```typescript
import { authenticatedFetch, makeAuthenticatedRequest } from '@/tests/helpers';

const response = await makeAuthenticatedRequest('/api/inventory', 'GET', null, userId);
```

### Database Helpers
Clean and seed test data:
```typescript
import { DatabaseCleaner, DatabaseSeeder } from '@/tests/helpers';

await DatabaseCleaner.cleanAll();
await DatabaseSeeder.seedTestUsers();
```

## Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect } from '@/tests/helpers';
import { formatDate } from '@/utils/formatters';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('15/01/2024');
  });
});
```

### Integration Test Example
```typescript
import { describe, it, expect } from '@/tests/helpers';
import { createTestUser, makeAuthenticatedRequest } from '@/tests/helpers';

describe('GET /api/inventory', () => {
  it('should return inventory items', async () => {
    const user = await createTestUser();
    const response = await makeAuthenticatedRequest('/api/inventory', 'GET', null, user.id);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('items');
  });
});
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'Test123!@#');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

## Coverage Requirements

- Minimum 80% code coverage for all categories:
  - Lines: 80%
  - Functions: 80%
  - Branches: 80%
  - Statements: 80%

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data after tests
3. **Descriptive Names**: Use clear, descriptive test names
4. **Arrange-Act-Assert**: Follow the AAA pattern
5. **Mock External Services**: Don't make real API calls to external services
6. **Fast Tests**: Keep unit tests fast (< 100ms each)
7. **Realistic Data**: Use realistic test data that matches production

## Continuous Integration

Tests run automatically on:
- Every push to any branch
- Every pull request
- Before deployment to staging/production

See `.github/workflows/qa-pipeline.yml` for CI configuration.
