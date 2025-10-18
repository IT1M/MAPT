# Implementation Plan

- [x] 1. Setup infrastructure and core components
  - Create TypeScript types (UserPreferences, NotificationPreferences, SystemConfiguration) in src/types/settings.ts
  - Build validation schemas with Zod in src/utils/settings-validation.ts
  - Create SettingsLayout with responsive navigation (tabs/accordion) in src/components/settings/SettingsLayout.tsx
  - Implement SettingsNavigation with role-based filtering and SettingsSearch in src/components/settings/
  - Build custom hooks: useSettings, useAutoSave, useDebounce, useUserPreferences in src/hooks/
  - _Requirements: 1.1, 1.3, 1.4, 20.1, 21.1, 22.1_

- [x] 2. Implement profile and avatar management
  - Create AvatarUpload component with crop/resize and initials fallback in src/components/settings/AvatarUpload.tsx
  - Build ProfileForm with validation, auto-save, and read-only fields in src/components/settings/ProfileForm.tsx
  - Implement API endpoints: GET/PATCH /api/users/profile, POST/DELETE /api/users/avatar
  - Add image processing with sharp for avatar resizing
  - _Requirements: 2.1, 2.2, 2.5, 2.6, 3.1, 3.2, 3.4, 3.5_

- [x] 3. Build security settings (password, sessions, audit)
  - Create PasswordChangeForm with strength indicator and validation in src/components/settings/PasswordChangeForm.tsx
  - Build SessionManager and SessionCard components with device/browser info in src/components/settings/
  - Implement SecurityAuditLog with pagination and export in src/components/settings/SecurityAuditLog.tsx
  - Create password utilities (strength, generation, validation) in src/utils/password.ts
  - Build user-agent parser in src/utils/user-agent.ts
  - Implement API endpoints: POST /api/auth/change-password, GET/DELETE /api/auth/sessions, GET /api/auth/security-log
  - Add session tracking (device, browser, IP, location) and rate limiting
  - _Requirements: 4.1, 4.2, 4.5, 5.1, 5.3, 5.4, 5.5, 6.1, 6.3, 6.5, 16.1, 16.2_

- [x] 4. Create user management section (Admin only)
  - Build UserTable with search, filter, sort, pagination, and bulk selection in src/components/settings/UserTable.tsx
  - Create UserModal for create/edit with auto-password generation in src/components/settings/UserModal.tsx
  - Implement RolePermissionsMatrix (read-only) in src/components/settings/RolePermissionsMatrix.tsx
  - Build BulkUserActions with activate/deactivate/role change/delete in src/components/settings/BulkUserActions.tsx
  - Enhance API endpoints: GET/POST /api/users, PUT /api/users/:id, PATCH /api/users/:id/status, POST /api/users/bulk-action
  - Add welcome email functionality and audit logging
  - _Requirements: 7.3, 7.4, 8.2, 8.4, 8.5, 9.2, 9.3, 10.2, 10.3, 11.1, 11.2, 16.3_

- [ x] 5. Implement appearance customization
  - Create ThemeSelector (Light/Dark/System) with live switching in src/components/settings/ThemeSelector.tsx
  - Build UIDensitySelector and font size slider in src/components/settings/UIDensitySelector.tsx
  - Add ColorSchemeCustomizer with presets in src/components/settings/ColorSchemeCustomizer.tsx
  - Implement GET/PATCH /api/users/preferences endpoints
  - Apply changes via CSS variables and persist to user preferences
  - _Requirements: 12.1, 12.2, 12.4, 13.1, 13.2, 13.4, 21.2, 21.5_

- [x] 6. Build notification settings
  - Create NotificationSettings with email/in-app toggles and frequency selector in src/components/settings/NotificationSettings.tsx
  - Add role-based visibility for admin notifications
  - Implement test notification functionality (email + toast)
  - Create API endpoints: GET/PATCH /api/users/notifications, POST /api/users/notifications/test
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 7. Implement API & integrations (Admin only)
  - Build GeminiConfig with masked key, validation, usage stats, and feature toggles in src/components/settings/GeminiConfig.tsx
  - Create DatabaseStatus with connection indicator and metrics in src/components/settings/DatabaseStatus.tsx
  - Implement API endpoints: POST /api/settings/gemini/validate, GET /api/settings/database/status
  - _Requirements: 15.2, 15.3, 15.4, 16.1, 16.2, 24.2, 24.3, 24.4_

- [x] 8. Build system preferences (Admin/Manager)
  - Create CompanyInfo with logo upload and timezone selector in src/components/settings/CompanyInfo.tsx
  - Build InventorySettings with categories and batch number config in src/components/settings/InventorySettings.tsx
  - Implement BackupConfig with schedule and format options in src/components/settings/BackupConfig.tsx
  - Create SystemLimits with validation in src/components/settings/SystemLimits.tsx
  - Build DeveloperSettings (Admin only) in src/components/settings/DeveloperSettings.tsx
  - Enhance GET/PATCH /api/settings endpoints with validation and audit logging
  - Implement GET /api/settings/logs/export endpoint
  - _Requirements: 17.2, 17.3, 17.4, 18.1, 18.2, 19.2, 19.4, 25.1, 25.2, 25.5_

- [-] 9. Add responsive design and accessibility
  - Convert navigation to accordion on mobile with swipe gestures
  - Make forms full-width with 44px touch targets and sticky save buttons
  - Convert tables to cards on mobile with horizontal scroll
  - Implement keyboard navigation, skip links, and shortcuts (Ctrl+S, Ctrl+K, Esc)
  - Add ARIA labels, roles, and live regions for screen readers
  - Ensure WCAG AA contrast, high contrast theme, and 200% text scaling support
  - _Requirements: 22.1, 22.2, 22.3, 22.5, 23.1, 23.2, 23.3, 23.4, 23.5_

- [ ] 10. Add internationalization and search
  - Create translation keys in messages/en.json and messages/ar.json
  - Implement RTL support with mirrored layouts and flipped icons
  - Build search functionality with real-time filtering and highlighting
  - _Requirements: 1.1, 20.1, 20.2, 20.3, 20.4_

- [ ] 11. Optimize performance and finalize
  - Lazy load all section components with Suspense and error boundaries
  - Implement SWR/React Query for caching with optimistic updates
  - Add React.memo, useMemo, useCallback optimizations
  - Implement virtual scrolling for long lists
  - Update main settings page (src/app/[locale]/settings/page.tsx) with new layout
  - Add navigation links and routing integration
  - Run Lighthouse audit and optimize bundle size
  - _Requirements: 1.1, 1.2, 1.5, 15.1, 15.2, 21.1, 21.3_
