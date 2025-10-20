'use client';

import React, { useState, useEffect } from 'react';
import type { ColorScheme } from '@/types/settings';

interface ColorSchemeCustomizerProps {
  primaryColor: string;
  accentColor: string;
  onChange: (colors: ColorScheme) => void;
  onReset: () => void;
}

const COLOR_PRESETS: Array<{ name: string; primary: string; accent: string }> =
  [
    { name: 'Default', primary: '#3B82F6', accent: '#8B5CF6' },
    { name: 'Blue', primary: '#2563EB', accent: '#06B6D4' },
    { name: 'Green', primary: '#10B981', accent: '#34D399' },
    { name: 'Purple', primary: '#8B5CF6', accent: '#A78BFA' },
    { name: 'Red', primary: '#EF4444', accent: '#F87171' },
    { name: 'Orange', primary: '#F97316', accent: '#FB923C' },
    { name: 'Pink', primary: '#EC4899', accent: '#F472B6' },
    { name: 'Teal', primary: '#14B8A6', accent: '#2DD4BF' },
  ];

export function ColorSchemeCustomizer({
  primaryColor,
  accentColor,
  onChange,
  onReset,
}: ColorSchemeCustomizerProps) {
  const [localPrimary, setLocalPrimary] = useState(primaryColor);
  const [localAccent, setLocalAccent] = useState(accentColor);

  // Update local state when props change
  useEffect(() => {
    setLocalPrimary(primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    setLocalAccent(accentColor);
  }, [accentColor]);

  const handlePrimaryChange = (color: string) => {
    setLocalPrimary(color);
    onChange({ primary: color, accent: localAccent });
  };

  const handleAccentChange = (color: string) => {
    setLocalAccent(color);
    onChange({ primary: localPrimary, accent: color });
  };

  const handlePresetSelect = (preset: { primary: string; accent: string }) => {
    setLocalPrimary(preset.primary);
    setLocalAccent(preset.accent);
    onChange({ primary: preset.primary, accent: preset.accent });
  };

  const isDefaultColors =
    localPrimary === '#3B82F6' && localAccent === '#8B5CF6';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Color Scheme
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize the primary and accent colors used throughout the interface
        </p>
      </div>

      {/* Color Presets */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COLOR_PRESETS.map((preset) => {
            const isSelected =
              localPrimary === preset.primary && localAccent === preset.accent;

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`
                  relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
                aria-pressed={isSelected}
                aria-label={`${preset.name} color preset`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                {/* Color circles */}
                <div className="flex gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                    style={{ backgroundColor: preset.primary }}
                    aria-label={`Primary color: ${preset.primary}`}
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                    style={{ backgroundColor: preset.accent }}
                    aria-label={`Accent color: ${preset.accent}`}
                  />
                </div>

                {/* Preset name */}
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Color */}
        <div className="space-y-3">
          <label
            htmlFor="primary-color"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Primary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="primary-color"
              type="color"
              value={localPrimary}
              onChange={(e) => handlePrimaryChange(e.target.value)}
              className="w-16 h-16 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Primary color picker"
            />
            <div className="flex-1">
              <input
                type="text"
                value={localPrimary}
                onChange={(e) => handlePrimaryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#3B82F6"
                pattern="^#[0-9A-Fa-f]{6}$"
                aria-label="Primary color hex code"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Used for buttons, links, and highlights
              </p>
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-3">
          <label
            htmlFor="accent-color"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="accent-color"
              type="color"
              value={localAccent}
              onChange={(e) => handleAccentChange(e.target.value)}
              className="w-16 h-16 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Accent color picker"
            />
            <div className="flex-1">
              <input
                type="text"
                value={localAccent}
                onChange={(e) => handleAccentChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#8B5CF6"
                pattern="^#[0-9A-Fa-f]{6}$"
                aria-label="Accent color hex code"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Used for secondary elements and badges
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Preview
        </label>
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          {/* Buttons preview */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: localPrimary,
                boxShadow: `0 0 0 0 ${localPrimary}`,
              }}
              disabled
            >
              Primary Button
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: localAccent,
                boxShadow: `0 0 0 0 ${localAccent}`,
              }}
              disabled
            >
              Accent Button
            </button>
          </div>

          {/* Badges preview */}
          <div className="flex flex-wrap gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: localPrimary }}
            >
              Primary Badge
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: localAccent }}
            >
              Accent Badge
            </span>
          </div>

          {/* Link preview */}
          <div>
            <a
              href="#"
              className="font-medium hover:underline"
              style={{ color: localPrimary }}
              onClick={(e) => e.preventDefault()}
            >
              This is a link with primary color
            </a>
          </div>
        </div>
      </div>

      {/* Reset button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onReset}
          disabled={isDefaultColors}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Reset to Default Colors
        </button>
      </div>

      {/* Info message */}
      <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
        <svg
          className="w-4 h-4 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          Custom colors are applied using CSS variables. Some components may
          require a page refresh to fully apply the new colors.
        </span>
      </div>
    </div>
  );
}
