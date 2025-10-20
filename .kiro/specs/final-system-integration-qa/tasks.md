# Implementation Plan

- [x] 1. Setup Testing Infrastructure
- [x] 1.1 Install and configure testing dependencies
  - Install Vitest, @testing-library/react, @testing-library/jest-dom
  - Install Playwright and browser binaries
  - Install Artillery for load testing
  - Install axe-core for accessibility testing
  - Install Lighthouse CI
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 1.2 Create test configuration files
  - Create vitest.config.ts with coverage thresholds
  - Create playwright.config.ts with multi-browser setup
  - Create .lighthouserc.json with performance targets
  - Create Artillery config in /tests/load/api-load-test.yml
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 7.1, 7.2, 7.3_

- [x] 1.3 Setup test directory structure
  - Create /tests/unit directory with subdirectories
  - Create /tests/integration directory
  - Create /tests/e2e directory
  - Create /tests/load directory
  - Create /tests/helpers with setup.ts, fixtures.ts, mocks.ts
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 1.4 Create test helper utilities
  - Create authenticatedFetch helper for API tests
  - Create createTestItem fixture generator
  - Create database cleanup utilities
  - Create mock service factories
  - _Requirements: 13.1, 13.2_

- [x] 2. Code Quality Validation
- [x] 2.1 Configure TypeScript strict mode
  - Update tsconfig.json with strict compiler options
  - Enable noUncheckedIndexedAccess, noImplicitOverride
  - Enable noUnusedLocals and noUnusedParameters
  - Run tsc --noEmit and fix all type errors
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2.2 Configure and run ESLint
  - Update .eslintrc.json with strict rules
  - Add @typescript-eslint/no-explicit-any as error
  - Add explicit-function-return-type as warning
  - Run npm run lint and fix all errors
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 2.3 Configure and run Prettier
  - Create/update .prettierrc.json with formatting rules
  - Run prettier --write on all source files
  - Verify consistent code formatting
  - _Requirements: 5.4_

- [x] 2.4 Create type definitions file
  - Create /src/types/index.ts with all shared types
  - Define User, InventoryItem, ApiResponse types
  - Define PaginatedResponse, ApiError types
  - Define form and filter types
  - _Requirements: 5.3_

- [-] 3. Database Integrity Validation
- [-] 3.1 Create database validation script
  - Create /scripts/validate-database.ts
  - Implement table existence checks
  - Implement relationship validation
  - Implement index verification
  - Add data integrity checks (no negative quantities, etc.)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3.2 Create query performance analyzer
  - Create /scripts/optimize-queries.ts
  - Benchmark common queries (Data Log, Analytics, Audit)
  - Measure query execution times
  - Generate performance recommendations
  - _Requirements: 2.3_

- [ ] 3.3 Add missing database indexes
  - Update Prisma schema with performance indexes
  - Add indexes on itemName, batch, createdAt
  - Add composite indexes for common query patterns
  - Generate and run migration
  - _Requirements: 2.2_

- [ ] 3.4 Test backup and restore functionality
  - Create test backup
  - Verify backup file integrity
  - Test restore process
  - Verify data consistency after restore
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 4. Unit Testing Implementation
- [ ] 4.1 Write validation function tests
  - Create /tests/unit/validators.test.ts
  - Test validateDataEntry with valid/invalid data
  - Test validateBatchNumber format validation
  - Test all Zod schemas
  - _Requirements: 13.1_

- [ ] 4.2 Write utility function tests
  - Create /tests/unit/utils.test.ts
  - Test date formatting functions
  - Test number formatting functions
  - Test string manipulation utilities
  - _Requirements: 13.1_

- [ ] 4.3 Write service tests
  - Create /tests/unit/services/auth.test.ts for auth service
  - Create /tests/unit/services/email.test.ts for email service
  - Create /tests/unit/services/gemini.test.ts for AI service
  - Mock external dependencies
  - _Requirements: 13.1_

- [ ] 4.4 Run unit tests and achieve 80% coverage
  - Run npm run test:unit
  - Review coverage report
  - Add tests for uncovered code
  - Verify all tests passing
  - _Requirements: 13.1, 13.5_

- [ ] 5. API Integration Testing
- [ ] 5.1 Create authentication API tests
  - Create /tests/integration/api/auth.test.ts
  - Test POST /api/auth/login with valid credentials
  - Test POST /api/auth/login with invalid credentials
  - Test POST /api/auth/register
  - Test password reset flow
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 5.2 Create inventory API tests
  - Create /tests/integration/api/inventory.test.ts
  - Test GET /api/inventory with pagination
  - Test POST /api/inventory item creation
  - Test PATCH /api/inventory/[id] item update
  - Test DELETE /api/inventory/[id] item deletion
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 5.3 Create analytics API tests
  - Create /tests/integration/api/analytics.test.ts
  - Test GET /api/analytics/summary
  - Test POST /api/analytics/ai-insights
  - Verify response data structure
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 5.4 Create export API tests
  - Create /tests/integration/api/export.test.ts
  - Test GET /api/inventory/export?format=csv
  - Test POST /api/reports/generate
  - Verify file generation and content
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 5.5 Test rate limiting
  - Test API rate limit enforcement
  - Verify 429 status returned after limit exceeded
  - Verify Retry-After header present
  - _Requirements: 8.5_

- [ ] 6. Navigation and Data Flow Testing
- [ ] 6.1 Create navigation flow tests
  - Create /tests/integration/navigation-flow.test.ts
  - Test complete user journey: Login → Dashboard → Data Entry → Data Log → Analytics
  - Test sidebar navigation on all pages
  - Test breadcrumbs update correctly
  - Test back button preserves state
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 6.2 Create data flow tests
  - Create /tests/integration/data-flow.test.ts
  - Test item added in Data Entry appears in Data Log
  - Test editing item in Data Log updates Analytics
  - Test deleting item removes from all views
  - Test user changes in Settings reflect in Audit logs
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 6.3 Test role-based navigation
  - Test ADMIN can access all pages
  - Test MANAGER cannot access user management
  - Test SUPERVISOR access restrictions
  - Test DATA_ENTRY limited access
  - Test unauthorized access shows 403
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 7. End-to-End Testing with Playwright
- [ ] 7.1 Create authentication E2E tests
  - Create /tests/e2e/auth-flow.spec.ts
  - Test complete login flow
  - Test registration flow
  - Test password reset flow
  - Test session management
  - _Requirements: 13.4_

- [ ] 7.2 Create data entry E2E tests
  - Create /tests/e2e/data-entry.spec.ts
  - Test adding new inventory item
  - Test form validation
  - Test autosave functionality
  - Test success notifications
  - _Requirements: 13.4_

- [ ] 7.3 Create analytics E2E tests
  - Create /tests/e2e/analytics.spec.ts
  - Test dashboard loads with charts
  - Test AI insights generation
  - Test report generation
  - Test export functionality
  - _Requirements: 13.4_

- [ ] 7.4 Create admin workflow E2E tests
  - Create /tests/e2e/admin.spec.ts
  - Test user management
  - Test system settings
  - Test backup operations
  - Test audit log viewing
  - _Requirements: 13.4_

- [ ] 7.5 Run E2E tests on multiple browsers
  - Run tests on Chrome, Firefox, Safari
  - Run tests on mobile Chrome and Safari
  - Verify all tests pass on all browsers
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 8. UI/UX Consistency Audit
- [ ] 8.1 Create visual consistency checklist
  - Verify color consistency across all pages
  - Check typography (font family, sizes, weights)
  - Verify spacing consistency (padding, margins)
  - Check border radius and shadow consistency
  - Verify button styles (primary, secondary, danger)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 8.2 Audit form inputs and controls
  - Verify input heights consistent
  - Check border and focus states
  - Verify placeholder and label styling
  - Check error and success states
  - Verify disabled states
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 8.3 Verify icon consistency
  - Check all icons from same library (lucide-react)
  - Verify icon sizes consistent (16px, 20px, 24px)
  - Check icon colors match text colors
  - Verify ARIA labels present
  - _Requirements: 3.1, 3.2_

- [ ] 8.4 Test animations and interactions
  - Verify page transitions smooth (300ms)
  - Check modal open/close animations
  - Test toast notification animations
  - Verify button hover/active states
  - Check loading spinner smoothness
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 9. Responsive Design Testing
- [ ] 9.1 Test on mobile devices (320px - 428px)
  - Test login page on mobile
  - Test dashboard on mobile
  - Test data entry form on mobile
  - Test data log table on mobile
  - Test analytics charts on mobile
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 9.2 Test on tablets (768px - 1112px)
  - Test all pages in portrait orientation
  - Test all pages in landscape orientation
  - Verify sidebar behavior
  - Check table responsiveness
  - _Requirements: 19.1, 19.2, 19.3_

- [ ] 9.3 Test on desktop (1280px - 3840px)
  - Test on laptop screens (1280px - 1440px)
  - Test on desktop screens (1920px - 2560px)
  - Test on 4K displays (3840px+)
  - Verify layouts scale appropriately
  - _Requirements: 19.1, 19.2_

- [ ] 9.4 Verify touch targets on mobile
  - Check all buttons at least 44x44px
  - Verify form inputs easily tappable
  - Check dropdown menus mobile-friendly
  - Test swipe gestures where applicable
  - _Requirements: 19.2_

- [ ] 10. Accessibility Compliance Testing
- [ ] 10.1 Run automated accessibility tests
  - Install and configure axe-core
  - Create accessibility test suite
  - Run axe tests on all major pages
  - Fix all violations found
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 10.2 Test keyboard navigation
  - Verify tab order logical on all pages
  - Check all interactive elements reachable
  - Verify focus indicators visible
  - Test no keyboard traps exist
  - Test skip navigation links
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 10.3 Test with screen readers
  - Test with NVDA on Windows
  - Test with VoiceOver on Mac
  - Verify page titles announced
  - Check form labels associated
  - Verify error messages announced
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 10.4 Verify color contrast
  - Check all text meets 4.5:1 contrast ratio
  - Verify UI components meet 3:1 contrast
  - Test in both light and dark modes
  - Fix any contrast issues
  - _Requirements: 4.4_

- [ ] 10.5 Test ARIA implementation
  - Verify proper ARIA roles on custom components
  - Check ARIA labels on icons and buttons
  - Test aria-live regions for dynamic content
  - Verify modal focus management
  - _Requirements: 4.3, 4.5_

- [ ] 11. Internationalization Validation
- [ ] 11.1 Create translation verification script
  - Create /scripts/check-translations.ts
  - Compare English and Arabic translation keys
  - Detect missing translations
  - Identify suspicious untranslated values
  - Generate coverage report
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 11.2 Test RTL layout
  - Verify all pages flip correctly in Arabic
  - Check text alignment (right in Arabic)
  - Verify icon mirroring (arrows, chevrons)
  - Check padding/margin reversal
  - Test sidebar positioning
  - _Requirements: 10.2, 10.5_

- [ ] 11.3 Test language switching
  - Verify switch without page reload
  - Check language preference persists
  - Verify URL updates with locale
  - Test forms maintain data on switch
  - Check error messages translate
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 11.4 Verify locale-specific formatting
  - Test date formatting per locale
  - Test number formatting per locale
  - Verify currency formatting
  - Check time zone handling
  - _Requirements: 10.3, 10.4_

- [ ] 12. Performance Optimization
- [ ] 12.1 Run Lighthouse audits on all pages
  - Install Lighthouse CI
  - Configure .lighthouserc.json
  - Run audits on login, dashboard, data-entry, data-log, analytics
  - Verify all pages score >90
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 12.2 Analyze and optimize bundle size
  - Install @next/bundle-analyzer
  - Run ANALYZE=true npm run build
  - Identify large dependencies
  - Implement code splitting for heavy components
  - Verify bundle <500KB
  - _Requirements: 7.5_

- [ ] 12.3 Optimize images
  - Verify all images use Next.js Image component
  - Check images have explicit width/height
  - Verify WebP format used
  - Add lazy loading for below-fold images
  - _Requirements: 7.5_

- [ ] 12.4 Optimize database queries
  - Review N+1 query patterns
  - Add select to limit fetched fields
  - Implement cursor-based pagination
  - Verify all queries use indexes
  - _Requirements: 2.3, 2.5_

- [ ] 12.5 Implement caching strategies
  - Add cache headers on API routes
  - Implement React Query/SWR for data fetching
  - Consider Redis for server-side caching
  - Test cache invalidation
  - _Requirements: 7.5_

- [ ] 13. Load and Performance Testing
- [ ] 13.1 Create load test scenarios
  - Create /tests/load/api-load-test.yml
  - Define warm-up phase (10 users/sec, 60s)
  - Define sustained load (50 users/sec, 120s)
  - Define spike test (100 users/sec, 60s)
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 13.2 Run load tests
  - Install Artillery
  - Run load tests against staging environment
  - Monitor response times (p50, p95, p99)
  - Track error rates
  - Monitor database connections
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 13.3 Analyze load test results
  - Verify p95 response time <500ms
  - Verify p99 response time <1000ms
  - Check error rate <1%
  - Verify no memory leaks
  - Check database connection stability
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 13.4 Optimize based on load test findings
  - Address any bottlenecks identified
  - Optimize slow endpoints
  - Adjust database connection pool
  - Re-run tests to verify improvements
  - _Requirements: 14.4, 14.5_

- [ ] 14. Security Audit
- [ ] 14.1 Verify authentication security
  - Check passwords hashed with bcrypt (12+ rounds)
  - Verify JWT tokens signed securely
  - Test session expiry (24 hours)
  - Verify CSRF protection on mutations
  - Test account lockout after failed attempts
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 14.2 Test API security
  - Verify all routes check authentication
  - Test role-based access control
  - Verify input validation with Zod
  - Test SQL injection prevention
  - Test XSS prevention
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 14.3 Verify data protection
  - Check environment variables not committed
  - Verify sensitive data encrypted at rest
  - Test HTTPS enforcement
  - Verify passwords never logged
  - Check audit logs immutable
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 14.4 Test frontend security
  - Verify no sensitive data in localStorage
  - Check Content Security Policy headers
  - Test file upload validation
  - Verify user-generated content sanitized
  - Test click-jacking prevention
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 14.5 Configure security headers
  - Create/update vercel.json with security headers
  - Set X-Content-Type-Options: nosniff
  - Set X-Frame-Options: DENY
  - Set Content-Security-Policy
  - Set Permissions-Policy
  - _Requirements: 6.5_

- [ ] 15. Email System Validation
- [ ] 15.1 Test welcome email
  - Verify sends within 1 minute of registration
  - Check correct user name included
  - Test login link works
  - Verify logo displays correctly
  - Test in Gmail, Outlook, Apple Mail
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 15.2 Test password reset email
  - Verify arrives within 1 minute
  - Test reset link works
  - Verify link expires after 1 hour
  - Check clear instructions present
  - Test security warning included
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 15.3 Test notification emails
  - Test daily summary email
  - Test high reject rate alert
  - Test report ready notification
  - Verify all links work
  - Check mobile responsiveness
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 15.4 Verify email tracking
  - Check all emails logged to database
  - Verify delivery status tracked
  - Test retry logic for failed emails
  - Check plain text alternatives provided
  - _Requirements: 11.4, 11.5_

- [ ] 16. Error Handling and Edge Cases
- [ ] 16.1 Test network error handling
  - Test API timeout shows retry button
  - Test no internet shows offline message
  - Test server 500 error shows friendly message
  - Test rate limit shows appropriate message
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 16.2 Test form validation errors
  - Test required field empty shows inline error
  - Test invalid email format shows clear message
  - Test password too weak shows requirements
  - Test duplicate batch number shows warning
  - _Requirements: 12.2, 12.3_

- [ ] 16.3 Test authentication errors
  - Test invalid credentials shows appropriate message
  - Test account locked shows contact admin message
  - Test session expired redirects to login
  - Test unauthorized access shows 403 page
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 16.4 Test data edge cases
  - Test very long item names (100+ chars)
  - Test special characters in inputs
  - Test quantity = 0
  - Test reject = quantity (100% reject rate)
  - Test rapid successive saves (debouncing)
  - _Requirements: 12.4, 12.5_

- [ ] 16.5 Test empty states
  - Test empty data log shows helpful message
  - Test search no results shows suggestion
  - Test no data for analytics period
  - Test all items deleted shows empty state
  - _Requirements: 12.4, 12.5_

- [ ] 17. Cross-Browser Testing
- [ ] 17.1 Test on Chrome
  - Test all major pages on Chrome desktop
  - Test on Chrome mobile (Android)
  - Verify all features work correctly
  - Check console for errors
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 17.2 Test on Firefox
  - Test all major pages on Firefox desktop
  - Verify layouts render correctly
  - Check all features work
  - Test date/time pickers
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 17.3 Test on Safari
  - Test all major pages on Safari desktop
  - Test on Safari iOS (iPhone)
  - Verify WebKit-specific features
  - Check animations smooth
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 17.4 Test on Edge
  - Test all major pages on Edge
  - Verify Chromium compatibility
  - Check all features work
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 17.5 Document browser compatibility
  - Create browser compatibility matrix
  - Document any known issues
  - Add polyfills if needed
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 18. Documentation
- [ ] 18.1 Update README.md
  - Document all features
  - Add setup instructions
  - Update environment variables section
  - Add troubleshooting section
  - Include testing instructions
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 18.2 Create API documentation
  - Create docs/API.md
  - Document all endpoints with examples
  - Include request/response schemas
  - Add authentication requirements
  - Document error codes
  - _Requirements: 15.2_

- [ ] 18.3 Create user guide
  - Create docs/USER_GUIDE.md
  - Document getting started
  - Explain all features with screenshots
  - Add FAQ section
  - Include keyboard shortcuts
  - _Requirements: 15.3_

- [ ] 18.4 Create deployment guide
  - Create docs/DEPLOYMENT.md
  - Document pre-deployment checklist
  - Add Vercel deployment steps
  - Include environment variable setup
  - Document post-deployment verification
  - Add rollback procedure
  - _Requirements: 15.4_

- [ ] 18.5 Add inline code comments
  - Review complex functions
  - Add JSDoc comments to public APIs
  - Document business logic
  - Explain non-obvious code
  - _Requirements: 15.5_

- [ ] 19. CI/CD Integration
- [ ] 19.1 Create GitHub Actions workflow
  - Create .github/workflows/qa-pipeline.yml
  - Add TypeScript check step
  - Add ESLint step
  - Add unit tests step
  - Add integration tests step
  - Add E2E tests step
  - Add Lighthouse CI step
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 19.2 Configure test result uploads
  - Upload test results as artifacts
  - Upload coverage reports
  - Upload Playwright traces on failure
  - Upload Lighthouse reports
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 19.3 Setup automated alerts
  - Configure failure notifications
  - Setup Slack/email alerts for CI failures
  - Add status badges to README
  - _Requirements: 17.1, 17.2, 17.3_

- [ ] 20. Production Deployment Preparation
- [ ] 20.1 Create pre-deployment checklist
  - Verify all environment variables documented
  - Check database migrations ready
  - Verify all tests passing
  - Check security audit complete
  - Verify documentation complete
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 20.2 Test database migrations
  - Run migrations on staging database
  - Verify data integrity after migration
  - Test rollback procedure
  - Document migration steps
  - _Requirements: 20.3_

- [ ] 20.3 Create deployment scripts
  - Create deployment automation scripts
  - Add database backup before deployment
  - Add smoke tests after deployment
  - Create rollback script
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 20.4 Setup monitoring and alerting
  - Configure Vercel Analytics
  - Setup error tracking (Sentry)
  - Configure uptime monitoring
  - Create admin alert rules
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 20.5 Prepare rollback procedure
  - Document rollback steps
  - Test rollback on staging
  - Create database restore procedure
  - Document recovery time objectives
  - _Requirements: 20.4, 20.5_

- [ ] 21. Final Validation and Sign-Off
- [ ] 21.1 Run complete test suite
  - Run all unit tests
  - Run all integration tests
  - Run all E2E tests
  - Run load tests
  - Verify 100% passing
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 21.2 Perform final manual testing
  - Test all critical user journeys
  - Verify all features work end-to-end
  - Test on multiple devices and browsers
  - Check all documentation accurate
  - _Requirements: All requirements_

- [ ] 21.3 Generate QA report
  - Compile all test results
  - Create summary of findings
  - Document any known issues
  - List performance metrics
  - Include security audit results
  - _Requirements: All requirements_

- [ ] 21.4 Create sign-off document
  - Create final sign-off checklist
  - Document all deliverables completed
  - Include quality metrics
  - Add deployment status
  - Get stakeholder signatures
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 21.5 Deploy to production
  - Execute deployment procedure
  - Run post-deployment smoke tests
  - Monitor error rates and performance
  - Verify all features working
  - Send launch announcement
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_
