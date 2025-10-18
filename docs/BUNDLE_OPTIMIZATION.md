# Bundle Size Optimization Guide

This document provides guidelines for optimizing bundle size in the Saudi Mais Inventory Management Application.

## Target Metrics

- **Main chunk**: < 200KB
- **Page chunks**: < 150KB each
- **Total initial load**: < 500KB (gzipped)

## Optimization Strategies

### 1. Import Optimization

#### ❌ Bad: Import entire library
```typescript
import * as Icons from 'react-icons/fa';
import _ from 'lodash';
```

#### ✅ Good: Import specific functions
```typescript
import { FaUser, FaHome } from 'react-icons/fa';
import debounce from 'lodash/debounce';
```

### 2. Dynamic Imports

#### Heavy Components
Use dynamic imports for components that are:
- Large in size (charts, editors)
- Not immediately visible (modals, dialogs)
- Conditionally rendered (admin panels)

```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### 3. Code Splitting by Route

Next.js automatically splits code by route. Ensure each page only imports what it needs:

```typescript
// ✅ Good: Page-specific imports
import { AnalyticsDashboard } from '@/components/analytics';

// ❌ Bad: Importing everything
import * as Components from '@/components';
```

### 4. Tree Shaking

Ensure libraries support tree shaking:

#### Recharts
```typescript
// ✅ Good
import { LineChart, Line, XAxis, YAxis } from 'recharts';

// ❌ Bad
import * as Recharts from 'recharts';
```

#### Date-fns
```typescript
// ✅ Good
import { format, parseISO } from 'date-fns';

// ❌ Bad
import * as dateFns from 'date-fns';
```

### 5. Remove Unused Dependencies

Regularly audit and remove unused packages:

```bash
# Analyze dependencies
npm ls --depth=0

# Remove unused package
npm uninstall <package-name>
```

### 6. Optimize Images

Use Next.js Image component for automatic optimization:

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority // For above-the-fold images
/>
```

### 7. Lazy Load Non-Critical Features

#### Analytics Charts
```typescript
const LazyChart = dynamic(() => import('./Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

#### Modals and Dialogs
```typescript
const LazyModal = dynamic(() => import('./Modal'), {
  loading: () => <ModalSkeleton />,
  ssr: false,
});
```

## Bundle Analysis

### Run Analysis
```bash
# Build the application
npm run build

# Analyze bundle
node scripts/analyze-bundle.js
```

### Using Next.js Bundle Analyzer (Optional)

Install the analyzer:
```bash
npm install --save-dev @next/bundle-analyzer
```

Update `next.config.js`:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

Run analysis:
```bash
ANALYZE=true npm run build
```

## Optimization Checklist

- [ ] All heavy components use dynamic imports
- [ ] Charts are lazy loaded with intersection observer
- [ ] Modals and dialogs are lazy loaded
- [ ] Imports are specific (not wildcard)
- [ ] Unused dependencies removed
- [ ] Images use Next.js Image component
- [ ] Bundle size < 200KB for main chunk
- [ ] Tree shaking enabled for all libraries

## Common Issues and Solutions

### Issue: Large recharts bundle

**Solution**: Import specific components
```typescript
// Instead of
import { ResponsiveContainer, LineChart, Line } from 'recharts';

// Use lazy loading
const LazyLineChart = dynamic(() => import('./charts/LineChart'), {
  ssr: false,
});
```

### Issue: Large lodash bundle

**Solution**: Use lodash-es or import specific functions
```typescript
// Instead of
import _ from 'lodash';

// Use
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

### Issue: Large date-fns bundle

**Solution**: Import specific functions
```typescript
// Instead of
import * as dateFns from 'date-fns';

// Use
import { format, parseISO, addDays } from 'date-fns';
```

## Monitoring

Monitor bundle size in CI/CD:

```yaml
# .github/workflows/deploy.yml
- name: Check bundle size
  run: |
    npm run build
    node scripts/analyze-bundle.js
```

## Resources

- [Next.js Bundle Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Import Cost VSCode Extension](https://marketplace.visualstudio.com/items?itemName=wix.vscode-import-cost)
