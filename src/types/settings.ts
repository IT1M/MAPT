import { UserRole } from '@prisma/client';

// ============================================================================
// User Preferences Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type UIDensity = 'compact' | 'comfortable' | 'spacious';
export type NotificationFrequency = 'realtime' | 'hourly' | 'daily' | 'custom';
export type LogLevel = 'error' | 'warning' | 'info' | 'debug';
export type BackupFormat = 'CSV' | 'JSON' | 'SQL';

export interface ColorScheme {
  primary: string;
  accent: string;
}

export interface EmailNotifications {
  dailyInventorySummary: boolean;
  weeklyAnalyticsReport: boolean;
  newUserRegistration: boolean; // Admin only
  highRejectRateAlert: boolean;
  systemUpdates: boolean;
  backupStatus: boolean;
}

export interface InAppNotifications {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
}

export interface NotificationPreferences {
  email: EmailNotifications;
  inApp: InAppNotifications;
  frequency: NotificationFrequency;
}

export interface UserPreferences {
  theme: ThemeMode;
  uiDensity: UIDensity;
  fontSize: number;
  colorScheme?: ColorScheme;
  notifications: NotificationPreferences;
  sidebarCollapsed: boolean;
  sidebarPosition: 'left' | 'right';
  showBreadcrumbs: boolean;
}

// ============================================================================
// Profile Types
// ============================================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  employeeId?: string;
  department?: string;
  phoneNumber?: string;
  workLocation?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// Session Types
// ============================================================================

export interface UserSession {
  id: string;
  device?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  location?: string;
  lastActive: Date;
  isCurrent: boolean;
  createdAt: Date;
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'failed_login' | 'password_change' | 'session_terminated';
  timestamp: Date;
  ipAddress?: string;
  location?: string;
  success: boolean;
  details?: string;
}

// ============================================================================
// User Management Types
// ============================================================================

export interface UserWithStatus extends UserProfile {
  lastLogin?: Date;
  sessionCount: number;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  sendWelcomeEmail: boolean;
  employeeId?: string;
  department?: string;
  phoneNumber?: string;
  workLocation?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface BulkUserAction {
  action: 'activate' | 'deactivate' | 'changeRole' | 'delete';
  userIds: string[];
  data?: {
    role?: UserRole;
  };
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
}

// ============================================================================
// System Configuration Types
// ============================================================================

export interface CompanyInformation {
  name: string;
  logo?: string;
  fiscalYearStart: number; // 1-12 (month)
  timezone: string;
}

export interface InventoryConfiguration {
  defaultDestination: string | null;
  categoriesEnabled: boolean;
  predefinedCategories: string[];
  autoBatchNumbers: boolean;
  batchNumberPattern?: string;
  supervisorApproval: boolean;
  approvalThreshold?: number;
}

export interface BackupConfiguration {
  enabled: boolean;
  time: string; // HH:mm format
  retentionDays: number;
  format: BackupFormat[];
}

export interface SystemLimitsConfiguration {
  maxItemsPerUserPerDay: number;
  maxFileUploadSizeMB: number;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  rateLimitPerMinute: number;
}

export interface AIFeatures {
  insights: boolean;
  predictiveAnalytics: boolean;
  naturalLanguageQueries: boolean;
}

export interface UsageStats {
  requestsThisMonth: number;
  tokensConsumed: number;
  rateLimit: {
    limit: number;
    remaining: number;
    resetAt: Date;
  };
}

export interface GeminiConfiguration {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  cacheInsightsDuration: number;
  features: AIFeatures;
  usage?: UsageStats;
}

export interface DatabaseInfo {
  type: string;
  connected: boolean;
  lastMigration?: Date;
  size: string;
  lastBackup?: Date;
  backupStatus: 'success' | 'failed' | 'pending';
}

export interface DeveloperConfiguration {
  debugMode: boolean;
  logLevel: LogLevel;
  apiRateLimits: {
    perMinute: number;
    perHour: number;
  };
}

export interface SystemConfiguration {
  company: CompanyInformation;
  inventory: InventoryConfiguration;
  backup: BackupConfiguration;
  limits: SystemLimitsConfiguration;
  gemini: GeminiConfiguration;
  database: DatabaseInfo;
  developer: DeveloperConfiguration;
}

// ============================================================================
// Settings Navigation Types
// ============================================================================

export type SettingsSection =
  | 'profile'
  | 'security'
  | 'users'
  | 'appearance'
  | 'notifications'
  | 'api'
  | 'system';

export interface SettingsNavigationItem {
  id: SettingsSection;
  label: string;
  icon: string;
  requiredRoles?: UserRole[];
  description?: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  message: string;
  lastValidated?: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface SettingsApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: ValidationError[];
  };
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  warning?: string;
}
