#!/bin/bash

###############################################################################
# Database Backup Script
# 
# This script creates a compressed PostgreSQL database backup with checksum
# verification and optional S3 upload.
#
# Usage:
#   ./scripts/backup-database.sh
#
# Environment Variables:
#   DATABASE_URL_DIRECT - Direct database connection URL (required)
#   BACKUP_DIR - Backup directory (default: /var/backups/mais-inventory/database)
#   RETENTION_DAYS - Days to keep backups (default: 30)
#   AWS_S3_BACKUP_BUCKET - S3 bucket for off-site backup (optional)
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mais-inventory/database}"
DATABASE_URL="${DATABASE_URL_DIRECT:-${DATABASE_URL:-}}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mais_inventory_${DATE}.sql.gz"
LOG_FILE="/var/log/mais-inventory/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL or DATABASE_URL_DIRECT environment variable is required"
    exit 1
fi

if ! command -v pg_dump &> /dev/null; then
    error "pg_dump command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log "Starting database backup process"
log "Backup file: $BACKUP_FILE"

# Check disk space
AVAILABLE_SPACE=$(df -BG "$BACKUP_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 5 ]; then
    error "Insufficient disk space. Available: ${AVAILABLE_SPACE}GB, Required: 5GB minimum"
    exit 1
fi
log "Available disk space: ${AVAILABLE_SPACE}GB"

# Create backup
log "Creating database backup..."
if pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/$BACKUP_FILE"; then
    log "✅ Backup created successfully"
else
    error "❌ Backup creation failed"
    exit 1
fi

# Verify backup was created
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    error "❌ Backup file not found after creation"
    exit 1
fi

# Get file size
SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
log "Backup size: $SIZE"

# Verify backup is not empty
FILE_SIZE=$(stat -f%z "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null)
if [ "$FILE_SIZE" -lt 1024 ]; then
    error "❌ Backup file is suspiciously small (${FILE_SIZE} bytes)"
    exit 1
fi

# Create checksum
log "Creating checksum..."
if command -v sha256sum &> /dev/null; then
    sha256sum "$BACKUP_DIR/$BACKUP_FILE" > "$BACKUP_DIR/$BACKUP_FILE.sha256"
elif command -v shasum &> /dev/null; then
    shasum -a 256 "$BACKUP_DIR/$BACKUP_FILE" > "$BACKUP_DIR/$BACKUP_FILE.sha256"
else
    warn "sha256sum/shasum not found, skipping checksum creation"
fi

if [ -f "$BACKUP_DIR/$BACKUP_FILE.sha256" ]; then
    log "✅ Checksum created"
fi

# Upload to S3 (optional)
if [ -n "${AWS_S3_BACKUP_BUCKET:-}" ]; then
    if command -v aws &> /dev/null; then
        log "Uploading to S3 bucket: $AWS_S3_BACKUP_BUCKET"
        
        if aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$AWS_S3_BACKUP_BUCKET/database/" && \
           aws s3 cp "$BACKUP_DIR/$BACKUP_FILE.sha256" "s3://$AWS_S3_BACKUP_BUCKET/database/"; then
            log "✅ Uploaded to S3"
        else
            warn "⚠️  S3 upload failed, but local backup is available"
        fi
    else
        warn "AWS CLI not found, skipping S3 upload"
    fi
fi

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT=0

# Find and delete old backup files
while IFS= read -r -d '' file; do
    rm -f "$file"
    rm -f "${file}.sha256"
    DELETED_COUNT=$((DELETED_COUNT + 1))
done < <(find "$BACKUP_DIR" -name "mais_inventory_*.sql.gz" -mtime +$RETENTION_DAYS -print0)

if [ $DELETED_COUNT -gt 0 ]; then
    log "Deleted $DELETED_COUNT old backup(s)"
else
    log "No old backups to delete"
fi

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "mais_inventory_*.sql.gz" | wc -l)
log "Total backups: $BACKUP_COUNT"

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Total backup storage: $TOTAL_SIZE"

log "✅ Backup process completed successfully"
log "Backup location: $BACKUP_DIR/$BACKUP_FILE"

# Exit successfully
exit 0
