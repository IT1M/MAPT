/**
 * Theme Customization Test Page
 * This page is for testing the theme customization system
 * Access at: /theme-test
 */

import { ThemeCustomizer } from '@/components/settings/ThemeCustomizer'
import {
  ThemedCard,
  ThemedButton,
  StatusBadge,
  QuickThemeSwitcher,
} from '@/components/settings/THEME_USAGE_EXAMPLE'

export default function ThemeTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Theme Customization Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Test and preview the theme customization system
            </p>
          </div>
          <QuickThemeSwitcher />
        </div>

        {/* Main Theme Customizer */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <ThemeCustomizer />
        </div>

        {/* Preview Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ThemedCard title="Button Variants">
            <div className="space-y-3">
              <ThemedButton variant="primary">Primary Button</ThemedButton>
              <ThemedButton variant="secondary">Secondary Button</ThemedButton>
              <ThemedButton variant="outline">Outline Button</ThemedButton>
            </div>
          </ThemedCard>

          <ThemedCard title="Status Badges">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="success">Success</StatusBadge>
              <StatusBadge status="warning">Warning</StatusBadge>
              <StatusBadge status="error">Error</StatusBadge>
              <StatusBadge status="info">Info</StatusBadge>
            </div>
          </ThemedCard>

          <ThemedCard title="Form Elements">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Text input"
                className="theme-input w-full"
              />
              <input
                type="email"
                placeholder="Email input"
                className="theme-input w-full"
              />
              <textarea
                placeholder="Textarea"
                className="theme-input w-full"
                rows={3}
              />
            </div>
          </ThemedCard>

          <ThemedCard title="Color Swatches">
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <div
                  className="w-full h-12 rounded border"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                />
                <p className="text-xs text-center">Primary</p>
              </div>
              <div className="space-y-1">
                <div
                  className="w-full h-12 rounded border"
                  style={{ backgroundColor: 'var(--theme-secondary)' }}
                />
                <p className="text-xs text-center">Secondary</p>
              </div>
              <div className="space-y-1">
                <div
                  className="w-full h-12 rounded border"
                  style={{ backgroundColor: 'var(--theme-accent)' }}
                />
                <p className="text-xs text-center">Accent</p>
              </div>
              <div className="space-y-1">
                <div
                  className="w-full h-12 rounded border"
                  style={{ backgroundColor: 'var(--theme-success)' }}
                />
                <p className="text-xs text-center">Success</p>
              </div>
            </div>
          </ThemedCard>
        </div>

        {/* Typography Preview */}
        <ThemedCard title="Typography Preview">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Heading 1</h1>
              <h2 className="text-3xl font-bold mb-2">Heading 2</h2>
              <h3 className="text-2xl font-bold mb-2">Heading 3</h3>
              <h4 className="text-xl font-bold mb-2">Heading 4</h4>
            </div>
            <div>
              <p className="text-lg mb-2">Large paragraph text</p>
              <p className="text-base mb-2">Base paragraph text</p>
              <p className="text-sm mb-2">Small paragraph text</p>
              <p className="text-xs">Extra small paragraph text</p>
            </div>
          </div>
        </ThemedCard>

        {/* Density Preview */}
        <ThemedCard title="Density Preview">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Change the density setting in the Layout tab to see how spacing adjusts
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="theme-card">
                <h4 className="font-semibold mb-2">Card 1</h4>
                <p className="text-sm">Content with theme padding</p>
              </div>
              <div className="theme-card">
                <h4 className="font-semibold mb-2">Card 2</h4>
                <p className="text-sm">Content with theme padding</p>
              </div>
              <div className="theme-card">
                <h4 className="font-semibold mb-2">Card 3</h4>
                <p className="text-sm">Content with theme padding</p>
              </div>
            </div>
          </div>
        </ThemedCard>

        {/* Animation Preview */}
        <ThemedCard title="Animation Preview">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Toggle animations in the Layout tab to see the difference
            </p>
            <div className="flex gap-4">
              <button className="theme-button-primary theme-transition-transform hover:scale-105">
                Hover me (with animation)
              </button>
              <button className="theme-button-secondary theme-transition-colors">
                Hover me (color transition)
              </button>
            </div>
          </div>
        </ThemedCard>
      </div>
    </div>
  )
}
