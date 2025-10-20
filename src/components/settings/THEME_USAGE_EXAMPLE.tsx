/**
 * Theme Customization Usage Examples
 *
 * This file demonstrates how to use the theme customization system
 * in different scenarios throughout the application.
 */

import React from 'react';
import { ThemeCustomizer } from './ThemeCustomizer';
import { useThemeCustomization } from '@/hooks/useThemeCustomization';

// ============================================================================
// Example 1: Basic Integration in Settings Page
// ============================================================================

export function SettingsAppearancePage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <ThemeCustomizer />
    </div>
  );
}

// ============================================================================
// Example 2: Quick Theme Switcher in Header
// ============================================================================

export function QuickThemeSwitcher() {
  const { currentTheme, selectPreset } = useThemeCustomization();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Change theme"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
            Quick Themes
          </div>
          <div className="space-y-1">
            {[
              'default',
              'ocean',
              'forest',
              'sunset',
              'royal',
              'monochrome',
            ].map((themeId) => (
              <button
                key={themeId}
                onClick={() => {
                  selectPreset(themeId);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm transition-colors capitalize
                  ${
                    currentTheme.id === themeId
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {themeId.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 3: Themed Component
// ============================================================================

export function ThemedCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="theme-card theme-transition-colors">
      <h3
        className="text-lg font-semibold mb-4"
        style={{ color: 'var(--theme-primary)' }}
      >
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ============================================================================
// Example 4: Themed Button Component
// ============================================================================

interface ThemedButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  onClick?: () => void;
}

export function ThemedButton({
  variant = 'primary',
  children,
  onClick,
}: ThemedButtonProps) {
  const baseClasses =
    'px-4 py-2 rounded-lg font-medium transition-all theme-transition-colors';

  const variantClasses = {
    primary: 'theme-button-primary',
    secondary: 'theme-button-secondary',
    outline: 'border-2 hover:bg-opacity-10',
  };

  const variantStyles = {
    outline: {
      borderColor: 'var(--theme-primary)',
      color: 'var(--theme-primary)',
      backgroundColor: 'transparent',
    },
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
      style={variant === 'outline' ? variantStyles.outline : undefined}
    >
      {children}
    </button>
  );
}

// ============================================================================
// Example 5: Status Badge with Theme Colors
// ============================================================================

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const badgeClasses = {
    success: 'theme-badge-success',
    warning: 'theme-badge-warning',
    error: 'theme-badge-error',
    info: 'theme-badge-info',
  };

  return <span className={badgeClasses[status]}>{children}</span>;
}

// ============================================================================
// Example 6: Density-Aware Layout
// ============================================================================

export function DensityAwareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {/* This layout will automatically adjust based on density setting */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        style={{ gap: 'var(--theme-gap)' }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Example 7: Theme Export/Import UI
// ============================================================================

export function ThemeShareWidget() {
  const { exportTheme, generateShareCode } = useThemeCustomization();
  const [shareCode, setShareCode] = React.useState('');

  const handleGenerateCode = () => {
    const code = generateShareCode();
    setShareCode(code);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareCode);
    alert('Share code copied to clipboard!');
  };

  return (
    <div className="theme-card space-y-4">
      <h3 className="font-semibold">Share Your Theme</h3>

      <div className="flex gap-2">
        <button onClick={exportTheme} className="theme-button-primary flex-1">
          Download JSON
        </button>
        <button
          onClick={handleGenerateCode}
          className="theme-button-secondary flex-1"
        >
          Generate Code
        </button>
      </div>

      {shareCode && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={shareCode}
              readOnly
              className="theme-input flex-1 font-mono text-xs"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Share this code with others to let them use your theme
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 8: Programmatic Theme Updates
// ============================================================================

export function ProgrammaticThemeExample() {
  const { updateColors, updateDensity, updateAnimations } =
    useThemeCustomization();

  const applyBrandColors = () => {
    updateColors({
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      accent: '#ffe66d',
    });
  };

  const toggleCompactMode = () => {
    updateDensity('compact');
  };

  const disableAnimations = () => {
    updateAnimations({ enabled: false });
  };

  return (
    <div className="space-y-2">
      <button
        onClick={applyBrandColors}
        className="theme-button-primary w-full"
      >
        Apply Brand Colors
      </button>
      <button
        onClick={toggleCompactMode}
        className="theme-button-secondary w-full"
      >
        Enable Compact Mode
      </button>
      <button
        onClick={disableAnimations}
        className="theme-button-secondary w-full"
      >
        Disable Animations
      </button>
    </div>
  );
}

// ============================================================================
// Example 9: Theme-Aware Chart Colors
// ============================================================================

export function useThemeChartColors() {
  const { currentTheme } = useThemeCustomization();

  return {
    primary: currentTheme.colors.primary,
    secondary: currentTheme.colors.secondary,
    accent: currentTheme.colors.accent,
    success: currentTheme.colors.success,
    warning: currentTheme.colors.warning,
    error: currentTheme.colors.error,
    info: currentTheme.colors.info,
  };
}

export function ThemedChart() {
  const colors = useThemeChartColors();

  // Use these colors in your chart library
  const chartData = {
    datasets: [
      {
        label: 'Dataset 1',
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        data: [10, 20, 30, 40, 50],
      },
      {
        label: 'Dataset 2',
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
        data: [15, 25, 35, 45, 55],
      },
    ],
  };

  return (
    <div className="theme-card">
      <h3 className="font-semibold mb-4">Themed Chart</h3>
      {/* Your chart component here */}
      <pre className="text-xs">{JSON.stringify(chartData, null, 2)}</pre>
    </div>
  );
}

// ============================================================================
// Example 10: Complete Settings Integration
// ============================================================================

export function CompleteThemeSettings() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Main Theme Customizer */}
      <ThemeCustomizer />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ThemedCard title="Share Your Theme">
          <ThemeShareWidget />
        </ThemedCard>

        <ThemedCard title="Quick Actions">
          <ProgrammaticThemeExample />
        </ThemedCard>
      </div>

      {/* Preview Components */}
      <ThemedCard title="Component Preview">
        <div className="space-y-4">
          <div className="flex gap-2">
            <ThemedButton variant="primary">Primary Button</ThemedButton>
            <ThemedButton variant="secondary">Secondary Button</ThemedButton>
            <ThemedButton variant="outline">Outline Button</ThemedButton>
          </div>

          <div className="flex gap-2">
            <StatusBadge status="success">Success</StatusBadge>
            <StatusBadge status="warning">Warning</StatusBadge>
            <StatusBadge status="error">Error</StatusBadge>
            <StatusBadge status="info">Info</StatusBadge>
          </div>

          <input
            type="text"
            placeholder="Themed input field"
            className="theme-input w-full"
          />
        </div>
      </ThemedCard>
    </div>
  );
}
