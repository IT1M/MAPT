/**
 * Theme Configuration
 * Defines theme interface and preset themes for the application
 */

export type ThemeDensity = 'compact' | 'comfortable' | 'spacious';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    card: string;
    cardForeground: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  fonts: {
    family: string;
    size: {
      base: string;
      sm: string;
      lg: string;
      xl: string;
    };
  };
  spacing: {
    density: ThemeDensity;
  };
  animations: {
    enabled: boolean;
    speed: AnimationSpeed;
  };
}

export const PRESET_THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Medical Blue',
    description: 'Professional medical theme with calming blue tones',
    colors: {
      primary: '#0d9488',
      secondary: '#06b6d4',
      accent: '#3b82f6',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f1f5f9',
      mutedForeground: '#64748b',
      border: '#e2e8f0',
      card: '#ffffff',
      cardForeground: '#0f172a',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    fonts: {
      family: 'Inter, system-ui, sans-serif',
      size: {
        base: '16px',
        sm: '14px',
        lg: '18px',
        xl: '20px',
      },
    },
    spacing: {
      density: 'comfortable',
    },
    animations: {
      enabled: true,
      speed: 'normal',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep blue ocean-inspired theme',
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#6366f1',
      background: '#ffffff',
      foreground: '#0c4a6e',
      muted: '#f0f9ff',
      mutedForeground: '#0369a1',
      border: '#bae6fd',
      card: '#ffffff',
      cardForeground: '#0c4a6e',
      success: '#14b8a6',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#0ea5e9',
    },
    fonts: {
      family: 'Inter, system-ui, sans-serif',
      size: {
        base: '16px',
        sm: '14px',
        lg: '18px',
        xl: '20px',
      },
    },
    spacing: {
      density: 'comfortable',
    },
    animations: {
      enabled: true,
      speed: 'normal',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural green forest theme',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#84cc16',
      background: '#ffffff',
      foreground: '#064e3b',
      muted: '#f0fdf4',
      mutedForeground: '#166534',
      border: '#bbf7d0',
      card: '#ffffff',
      cardForeground: '#064e3b',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    fonts: {
      family: 'Inter, system-ui, sans-serif',
      size: {
        base: '16px',
        sm: '14px',
        lg: '18px',
        xl: '20px',
      },
    },
    spacing: {
      density: 'comfortable',
    },
    animations: {
      enabled: true,
      speed: 'normal',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm sunset colors with orange and pink tones',
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#ec4899',
      background: '#ffffff',
      foreground: '#7c2d12',
      muted: '#fff7ed',
      mutedForeground: '#c2410c',
      border: '#fed7aa',
      card: '#ffffff',
      cardForeground: '#7c2d12',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    fonts: {
      family: 'Inter, system-ui, sans-serif',
      size: {
        base: '16px',
        sm: '14px',
        lg: '18px',
        xl: '20px',
      },
    },
    spacing: {
      density: 'comfortable',
    },
    animations: {
      enabled: true,
      speed: 'normal',
    },
  },
  {
    id: 'royal',
    name: 'Royal',
    description: 'Elegant purple and gold royal theme',
    colors: {
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#d946ef',
      background: '#ffffff',
      foreground: '#4c1d95',
      muted: '#faf5ff',
      mutedForeground: '#6b21a8',
      border: '#e9d5ff',
      card: '#ffffff',
      cardForeground: '#4c1d95',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    fonts: {
      family: 'Inter, system-ui, sans-serif',
      size: {
        base: '16px',
        sm: '14px',
        lg: '18px',
        xl: '20px',
      },
    },
    spacing: {
      density: 'comfortable',
    },
    animations: {
      enabled: true,
      speed: 'normal',
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Clean black and white minimalist theme',
    colors: {
      primary: '#18181b',
      secondary: '#3f3f46',
      accent: '#71717a',
      background: '#ffffff',
      foreground: '#09090b',
      muted: '#f4f4f5',
      mutedForeground: '#52525b',
      border: '#e4e4e7',
      card: '#ffffff',
      cardForeground: '#09090b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    fonts: {
      family: 'Inter, system-ui, sans-serif',
      size: {
        base: '16px',
        sm: '14px',
        lg: '18px',
        xl: '20px',
      },
    },
    spacing: {
      density: 'comfortable',
    },
    animations: {
      enabled: true,
      speed: 'normal',
    },
  },
];

export const FONT_FAMILIES = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter (Default)' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Courier New", monospace', label: 'Courier New' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
];

export const ANIMATION_SPEEDS = {
  slow: '300ms',
  normal: '200ms',
  fast: '100ms',
};

export const DENSITY_SPACING = {
  compact: {
    padding: '0.5rem',
    gap: '0.5rem',
    fontSize: '0.875rem',
  },
  comfortable: {
    padding: '1rem',
    gap: '1rem',
    fontSize: '1rem',
  },
  spacious: {
    padding: '1.5rem',
    gap: '1.5rem',
    fontSize: '1.125rem',
  },
};
