#!/bin/bash

# Script to replace next-intl imports with local hooks

echo "Fixing next-intl imports..."

# Replace useTranslations import
find src/components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s/import { useTranslations } from 'next-intl'/import { useTranslations } from '@\/hooks\/useTranslations'/g" {} \;

# Replace useLocale import
find src/components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s/import { useLocale } from 'next-intl'/import { useLocale } from '@\/hooks\/useLocale'/g" {} \;

# Replace combined imports
find src/components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s/import { useTranslations, useLocale } from 'next-intl'/import { useTranslations } from '@\/hooks\/useTranslations'\nimport { useLocale } from '@\/hooks\/useLocale'/g" {} \;

find src/components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s/import { useLocale, useTranslations } from 'next-intl'/import { useTranslations } from '@\/hooks\/useTranslations'\nimport { useLocale } from '@\/hooks\/useLocale'/g" {} \;

echo "Done! All next-intl imports have been replaced."
