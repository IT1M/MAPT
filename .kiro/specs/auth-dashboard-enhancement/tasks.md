# Implementation Plan

- [x] 1. Database Schema Updates and Migrations
- [x] 1.1 Create new Prisma models for notifications, password reset tokens, 2FA, saved filters, activity logs, help articles, and email logs
  - Add Notification model with type, priority, and read status
  - Add PasswordResetToken model with expiration and usage tracking
  - Add TwoFactorAuth model with encrypted secret and backup codes
  - Add SavedFilter model for user filter presets
  - Add ActivityLog model for user event tracking
  - Add HelpArticle model for documentation
  - Add EmailLog model for email delivery tracking
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 6.1, 6.2, 7.1, 8.1, 9.1, 13.1, 17.1, 19.1_

- [x] 1.2 Extend existing User model with new fields
  - Add lastLogin, lastLoginIp, passwordChangedAt, lockedUntil fields
  - Add emailVerified and emailVerifiedAt fields
  - Add relations to new models
  - _Requirements: 1.4, 3.1, 6.1, 19.1, 19.2_

- [x] 1.3 Extend existing Session model with device tracking fields
  - Add deviceType, browser, os, ipAddress, location fields
  - Add userAgent, lastActive, createdAt fields
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 1.4 Generate and run database migrations
  - Run `npx prisma migrate dev` to create migration files
  - Test migrations on development database
  - Verify all indexes are created properly
  - _Requirements: All database-related requirements_

- [-] 2. Enhanced Authentication Pages
- [x] 2.1 Create professional login page with two-column layout
  - Build BrandingPanel component with logo, gradient background, and feature highlights
  - Create enhanced LoginForm with email, password, and remember me fields
  - Implement real-time validation with Zod schema
  - Add password show/hide toggle
  - Add forgot password link
  - Implement responsive design (single column on mobile)
  - Add loading states and error animations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.2 Implement registration page with password strength meter
  - Create registration form with name, email, phone, password fields
  - Build PasswordStrengthMeter component with visual indicator
  - Create PasswordRequirementsChecklist component
  - Implement async email uniqueness validation
  - Add terms & conditions checkbox with modal
  - Implement auto-login after successful registration
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.3 Build password recovery flow components
  - Create ForgotPasswordPage with email input
  - Create ResetPasswordPage with token validation
  - Build PasswordResetSuccess confirmation page
  - Implement token generation and expiration logic
  - Add password reset API endpoints
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 2.4 Implement rate limiting and security features for authentication
  - Add rate limiting middleware (5 attempts per 15 minutes)
  - Implement CAPTCHA after 5 failed attempts
  - Add account lockout after 10 failed attempts
  - Create security alert notifications
  - _Requirements: 19.1, 19.2_

- [x] 3. Session Management System
- [x] 3.1 Create session manager component and API endpoints
  - Build SessionManager component displaying all active sessions
  - Implement device/browser/OS detection from user agent
  - Add IP geolocation for location display
  - Create "Current device" badge indicator
  - Add individual session termination functionality
  - Create API endpoints: GET /api/auth/sessions, DELETE /api/auth/sessions/[id]
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 3.2 Implement new device/location login detection
  - Create logic to detect suspicious logins
  - Implement distance calculation for location comparison
  - Trigger security notifications for new devices
  - Send email alerts for suspicious activity
  - _Requirements: 6.4_

- [x] 3.3 Add session security enhancements
  - Implement session token rotation
  - Add httpOnly and secure cookie flags
  - Set appropriate sameSite policy
  - Implement session expiration (24 hours default, 30 days with remember me)
  - _Requirements: 6.5, 19.3_

- [-] 4. Role-Based Dashboard System
- [x] 4.1 Core dashboard infrastructure and routing
  - Create role-to-path mapping and redirect logic after login
  - Build shared DashboardGreeting component (time-based greeting, last login, Hijri date)
  - Implement callback URL handling and first-time user welcome modal
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2_

- [-] 4.2 Role-specific dashboard implementations
  - Admin: SystemHealthWidget, QuickActionsPanel, ActivityTimeline, UserActivityChart, AlertsPanel, SystemStatisticsCards
  - Manager: ExecutiveSummaryCards, AnalyticsOverview, AIInsightsPanel (Gemini), ReportsCenter, TeamPerformance
  - Supervisor: ItemsRequiringReview, TeamActivityMonitor, QualityControlDashboard, RecentEntriesTable, AuditHighlights
  - Data Entry: AddNewItemCard, TodaysEntries, PersonalStats, RecentBatches, TipsWidget
  - Auditor: AdvancedSearchBar, AuditOverview, AuditLogTable, ActivityHeatmap, UserBehaviorAnalysis
  - _Requirements: 5.3, 5.4, 5.5_

- [ ] 5. Email Notification System
- [ ] 5.1 Complete email service implementation
  - Configure Resend/Nodemailer with SMTP credentials and queue system
  - Create all email templates (welcome, password reset, security alert, daily summary, high reject rate, backup status, report ready)
  - Implement triggers for all email types with logging and retry logic
  - Build email analytics dashboard tracking delivery status and failures
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6. In-App Notification System
- [ ] 6.1 Complete notification center with preferences
  - Build NotificationCenter component (bell icon, badge, dropdown with tabs, pagination, mark as read)
  - Create API endpoints: GET /api/notifications, PATCH /api/notifications/[id]/read
  - Implement 30-second polling with toast for critical notifications
  - Generate notifications for all event types (system, activity, approval, alerts)
  - Build preferences page (enable/disable toggles, delivery method, quiet hours)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 7. Global Search System
- [ ] 7.1 Complete global search with keyboard shortcuts
  - Build search service with full-text search across inventory, reports, users, settings (role-based filtering)
  - Create API endpoint: POST /api/search with optimized indexes
  - Build modal component (overlay, autofocus input, category grouping, keyboard navigation, loading states, debouncing)
  - Implement Ctrl+K/Cmd+K shortcut, Escape to close, arrow navigation, Enter to select
  - Add recent searches in localStorage with clear history and suggestions
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 8. Export System
- [ ] 8.1 Complete export system with audit logging
  - Implement export service supporting CSV, Excel (xlsx), PDF (pdfkit), JSON formats
  - Build export modal (format selection, column selection, filename customization, filter inclusion, progress indicator)
  - Create API endpoint: POST /api/export with file generation, streaming, auto-download
  - Add email delivery for large exports (>5000 records)
  - Implement audit logging (user, timestamp, format, record count) and export history view
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 9. Keyboard Shortcuts System
- [ ] 9.1 Complete keyboard shortcuts with help modal
  - Build useKeyboardShortcuts hook with platform detection (Ctrl vs Cmd)
  - Implement global shortcuts (Ctrl+K search, Ctrl+/ help, Ctrl+N new item, Escape close, G+D/E/L/A navigation)
  - Add page-specific shortcuts (F filter, E export, R refresh, arrows/enter table navigation, Ctrl+S save)
  - Build help modal (categorized shortcuts, search, print, platform-specific keys)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 10. Theme Customization System
- [ ] 10.1 Complete theme system with export/import
  - Define theme interface and create 6 preset themes (Default, Ocean, Forest, Sunset, Royal, Monochrome)
  - Build customizer component (preset selector, color pickers, font family/size, layout density, animation controls)
  - Implement dynamic CSS variables application with localStorage persistence and cross-tab sync
  - Add theme export/import functionality (JSON format, share code)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 11. Activity Tracking System
- [ ] 11.1 Complete activity tracking with analytics and anomaly detection
  - Build trackEvent service (metadata, IP, user agent, session ID) for all events (page views, actions, exports, searches, auth)
  - Integrate tracking throughout application on route changes and user actions
  - Build admin analytics dashboard (engagement metrics, feature usage charts, session duration, peak times heatmap, adoption rates, user journey flow)
  - Implement anomaly detection with alerts for suspicious patterns and investigation tools
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 12. Bulk Operations System
- [ ] 12.1 Complete bulk operations with API and audit logging
  - Build toolbar (appears on selection, shows count, action buttons, progress indicator)
  - Create bulk edit modal (field selection, append/replace mode, preview, confirmation)
  - Implement bulk delete with confirmation (require typing "DELETE", show list, progress, summary)
  - Create API endpoints: POST /api/inventory/bulk-edit and bulk-delete with transaction support
  - Add audit logging for all bulk operations
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 13. Advanced Filtering System
- [ ] 13.1 Complete filtering with saved filters and sharing
  - Build filter builder UI (add/remove, field/operator/value selection, AND/OR logic, filter chips)
  - Implement Prisma where clause generator supporting all operators (equals, contains, gt, lt, etc.)
  - Add saved filters (save modal, load presets, edit/delete, default filter per page, API endpoints)
  - Implement filter sharing (shareable URL, export/import, copy link)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 14. Data Import System
- [ ] 14.1 Complete import wizard with validation and API
  - Build multi-step wizard (file upload, column mapping, validation, options, execution)
  - Implement drag & drop upload for CSV/Excel (max 10 MB) with preview of first 5 rows
  - Create column mapping interface (auto-detect, manual dropdowns, example data, required fields)
  - Build validation logic (schema validation, required fields, data types, enums, error table with row numbers and fixes)
  - Add import options (duplicate handling, default values, progress bar, cancel, completion summary)
  - Create API endpoint: POST /api/inventory/import with batch insert, transactions, audit logs, import log file
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ] 15. Help Center System
- [ ] 15.1 Complete help center with search and admin management
  - Build help center layout (search bar, category navigation, article list, breadcrumbs)
  - Create article component (markdown rendering, table of contents, related articles, feedback, print/share)
  - Implement full-text search (relevance ranking, highlighting, analytics tracking)
  - Build contact support form (category, subject, description, file attachments, priority, email sending, response time)
  - Add admin management interface (article creation/editing, category management, views/feedback tracking)
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 16. Progressive Web App (PWA) Support
- [ ] 16.1 Complete PWA with offline support and install prompt
  - Create manifest.json (app metadata, icons 192x192/512x512, standalone mode, theme colors)
  - Implement service worker (caching strategies, static assets cache, offline fallback, background sync)
  - Build offline queue system (localStorage queue, sync on reconnect, offline banner, sync progress)
  - Add install prompt UI (show after 30s on mobile, benefits explanation, analytics tracking)
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 17. Security Enhancements
- [ ] 17.1 Complete security system with 2FA and monitoring
  - Implement 2FA (setup flow with QR code, TOTP using speakeasy, backup codes, login verification, recovery flow, settings management)
  - Add rate limiting middleware (per-IP and per-user, configurable limits per endpoint, 429 status with Retry-After)
  - Build account lockout (track failed attempts, CAPTCHA after 5 attempts, lock after 10, security alerts, auto-unlock after 15 min)
  - Create security score dashboard (multi-factor calculation, color coding, breakdown, recommendations, historical tracking)
  - Implement security audit logging (auth events, permission changes, sensitive data access, timeline, investigation tools)
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 18. Performance Monitoring Dashboard
- [ ] 18.1 Complete performance monitoring with AI recommendations
  - Build real-time metrics dashboard (API response times p50/p95/p99, error rates/types, resource usage)
  - Implement metrics collection (API response tracking, database query performance, error monitoring, engagement metrics)
  - Create alert rules (slow API >2s, error rate >5%, database size >80%) with admin notifications
  - Build AI-powered optimization recommendations (analyze slow queries/endpoints, provide documentation links, track implementation)
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 19. Integration and Polish
- [ ] 19.1 System integration and UI enhancements
  - Integrate all components (notification center in header, global search trigger, keyboard shortcuts, theme customizer, API endpoints)
  - Implement error handling (error boundaries, retry logic, user-friendly messages, monitoring integration)
  - Add loading states (skeleton loaders, spinners, optimistic updates, progress indicators)
  - _Requirements: All requirements_

- [ ] 19.2 Responsive design and accessibility
  - Ensure responsive design (mobile/tablet testing, mobile layouts, 44x44px touch targets)
  - Implement accessibility (ARIA labels, keyboard navigation, screen reader testing, WCAG AA contrast, focus indicators)
  - Add internationalization (en.json and ar.json strings, RTL support, language testing, locale date/time formatting)
  - _Requirements: All requirements_

- [ ] 20. Testing and Quality Assurance
- [ ] 20.1 Comprehensive testing suite
  - Unit tests (authentication, email, search, export, activity tracking, filter builder services)
  - Integration tests (authentication, notification, search, export, bulk operation API endpoints)
  - Component tests (login/registration forms, dashboards, notification center, global search, export modal, filter builder)
  - End-to-end tests (authentication flows, role-based access, notifications, search, exports, bulk actions)
  - _Requirements: All requirements_

- [ ] 20.2 Security and performance testing
  - Security testing (SQL injection, XSS, CSRF, rate limiting, session security, 2FA)
  - Performance testing (page load times, API response times, large datasets, concurrent users, optimization)
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 21. Documentation and Deployment
- [ ] 21.1 Documentation and deployment preparation
  - Update README (new features, setup instructions, environment variables, troubleshooting)
  - Create user documentation (getting started guide, feature docs, video tutorials, FAQ)
  - Prepare deployment checklist (verify env variables, run migrations, test email, verify services, backup database)
  - _Requirements: All requirements_

- [ ] 21.2 Production deployment and monitoring
  - Deploy to Vercel with post-deployment smoke tests
  - Set up monitoring alerts and track error rates/performance
  - Monitor user feedback and plan iterative improvements
  - _Requirements: All requirements_
