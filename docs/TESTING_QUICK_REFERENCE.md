# Testing Quick Reference

## Quick Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest run src/__tests__/integration/navigation-flow.test.tsx

# Run tests matching pattern
npx vitest run src/__tests__/accessibility/

# Run tests with verbose output
npx vitest run --reporter=verbose
```

## Test Structure

```
src/
├── __tests__/
│   ├── integration/
│   │   ├── navigation-flow.test.tsx      # Navigation & auth flow tests
│   │   └── error-handling.test.tsx       # Error handling tests
│   └── accessibility/
│       ├── navigation.a11y.test.tsx      # Navigation a11y tests
│       ├── forms.a11y.test.tsx           # Form a11y tests
│       └── ui-components.a11y.test.tsx   # UI components a11y tests
├── components/
│   └── [component]/
│       └── __tests__/
│           └── [component].test.tsx      # Component unit tests
├── hooks/
│   └── __tests__/
│       └── [hook].test.ts                # Hook unit tests
└── utils/
    └── __tests__/
        └── [util].test.ts                # Utility unit tests
```

## Test Types

### Unit Tests
Test individual components, hooks, and utilities in isolation.

**Location**: `src/[module]/__tests__/`

**Example**:
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### Integration Tests
Test how multiple components work together.

**Location**: `src/__tests__/integration/`

**Example**:
```typescript
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

describe('Navigation Integration', () => {
  it('should navigate between pages', async () => {
    render(<><Sidebar /><Header /></>)
    // Test navigation flow
  })
})
```

### Accessibility Tests
Test WCAG compliance using jest-axe.

**Location**: `src/__tests__/accessibility/`

**Example**:
```typescript
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Button } from '@/components/ui/Button'

expect.extend(toHaveNoViolations)

describe('Button Accessibility', () => {
  it('should have no a11y violations', async () => {
    const { container } = render(<Button>Click</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

## Common Test Patterns

### Testing with Next.js Router
```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/en/dashboard',
}))
```

### Testing with Next-Auth
```typescript
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { role: 'ADMIN' } },
    status: 'authenticated',
  })),
}))
```

### Testing with Next-Intl
```typescript
const messages = { common: { save: 'Save' } }

const TestWrapper = ({ children }: any) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
)
```

### Testing User Interactions
```typescript
import userEvent from '@testing-library/user-event'

const user = userEvent.setup()
await user.click(screen.getByRole('button'))
await user.type(screen.getByRole('textbox'), 'Hello')
await user.keyboard('{Enter}')
```

### Testing Async Operations
```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

### Testing Accessibility
```typescript
import { axe } from 'jest-axe'

const { container } = render(<Component />)
const results = await axe(container)
expect(results).toHaveNoViolations()
```

## Debugging Tests

### Run Single Test
```bash
npx vitest run -t "should render button"
```

### Run Tests in Debug Mode
```bash
node --inspect-brk node_modules/.bin/vitest run
```

### View Test UI
```bash
npm run test:ui
```

### Check Coverage
```bash
npm run test:coverage
open coverage/index.html
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Before deployment

**GitHub Actions**: `.github/workflows/test.yml`

## Best Practices

1. **Write descriptive test names**
   ```typescript
   it('should display error message when form is invalid')
   ```

2. **Use Testing Library queries in order of priority**
   - getByRole (best)
   - getByLabelText
   - getByPlaceholderText
   - getByText
   - getByTestId (last resort)

3. **Test user behavior, not implementation**
   ```typescript
   // Good
   await user.click(screen.getByRole('button', { name: 'Submit' }))
   
   // Bad
   fireEvent.click(container.querySelector('.submit-btn'))
   ```

4. **Clean up after tests**
   ```typescript
   afterEach(() => {
     cleanup()
     vi.clearAllMocks()
   })
   ```

5. **Mock external dependencies**
   ```typescript
   vi.mock('@/services/api', () => ({
     fetchData: vi.fn(() => Promise.resolve({ data: [] }))
   }))
   ```

6. **Test accessibility**
   - Always run axe on components
   - Test keyboard navigation
   - Test screen reader announcements

7. **Keep tests fast**
   - Mock API calls
   - Use fake timers
   - Avoid unnecessary waits

## Troubleshooting

### Tests timing out
```typescript
// Increase timeout for slow tests
it('should load data', async () => {
  // test code
}, 10000) // 10 second timeout
```

### React warnings
```typescript
// Suppress expected warnings
vi.spyOn(console, 'error').mockImplementation(() => {})
```

### Module not found
```bash
# Check vitest.config.ts alias configuration
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Hydration errors
```typescript
// Wait for component to mount
await waitFor(() => {
  expect(screen.getByText('Content')).toBeInTheDocument()
})
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
