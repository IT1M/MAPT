#!/bin/bash
# Script to fix Prisma schema model names after db pull

# Backup the current schema
cp prisma/schema.prisma prisma/schema.prisma.backup

# Replace model names with PascalCase and add @@map directives
sed -i.tmp '
s/^model users {/model User {/
s/^model sessions {/model Session {/
s/^model notifications {/model Notification {/
s/^model password_reset_tokens {/model PasswordResetToken {/
s/^model two_factor_auth {/model TwoFactorAuth {/
s/^model saved_filters {/model SavedFilter {/
s/^model activity_logs {/model ActivityLog {/
s/^model help_articles {/model HelpArticle {/
s/^model email_logs {/model EmailLog {/
s/^model inventory_items {/model InventoryItem {/
s/^model products {/model Product {/
s/^model transactions {/model Transaction {/
s/^model audit_logs {/model AuditLog {/
s/^model reports {/model Report {/
s/^model backups {/model Backup {/
s/^model report_schedules {/model ReportSchedule {/
s/^model backup_configs {/model BackupConfig {/
s/^model system_settings {/model SystemSettings {/
' prisma/schema.prisma

# Clean up temp file
rm -f prisma/schema.prisma.tmp

echo "Schema model names fixed!"
