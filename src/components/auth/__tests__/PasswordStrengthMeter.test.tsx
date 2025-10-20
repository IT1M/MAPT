/**
 * PasswordStrengthMeter Component Tests
 * Tests for password strength indicator
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthMeter } from '../PasswordStrengthMeter';

describe('PasswordStrengthMeter Component', () => {
  it('should render without crashing', () => {
    render(<PasswordStrengthMeter password="" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show weak strength for short password', () => {
    render(<PasswordStrengthMeter password="abc" />);

    const meter = screen.getByRole('progressbar');
    expect(meter).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
  });

  it('should show medium strength for moderate password', () => {
    render(<PasswordStrengthMeter password="Abc123" />);

    const meter = screen.getByRole('progressbar');
    expect(meter).toHaveAttribute('aria-valuenow', '2');
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
  });

  it('should show strong strength for complex password', () => {
    render(<PasswordStrengthMeter password="Abc123!@#xyz" />);

    const meter = screen.getByRole('progressbar');
    expect(meter).toHaveAttribute('aria-valuenow', '3');
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('should show empty state for no password', () => {
    render(<PasswordStrengthMeter password="" />);

    const meter = screen.getByRole('progressbar');
    expect(meter).toHaveAttribute('aria-valuenow', '0');
  });

  it('should update strength when password changes', () => {
    const { rerender } = render(<PasswordStrengthMeter password="abc" />);
    expect(screen.getByText(/weak/i)).toBeInTheDocument();

    rerender(<PasswordStrengthMeter password="Abc123!@#" />);
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('should have appropriate ARIA attributes', () => {
    render(<PasswordStrengthMeter password="Abc123" />);

    const meter = screen.getByRole('progressbar');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '3');
    expect(meter).toHaveAttribute('aria-label');
  });

  it('should show visual indicator with color', () => {
    const { container } = render(
      <PasswordStrengthMeter password="Abc123!@#" />
    );

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should calculate strength based on multiple criteria', () => {
    // Only lowercase
    const { rerender } = render(<PasswordStrengthMeter password="abcdefgh" />);
    expect(screen.getByText(/weak/i)).toBeInTheDocument();

    // Lowercase + uppercase
    rerender(<PasswordStrengthMeter password="Abcdefgh" />);
    expect(screen.getByText(/medium/i)).toBeInTheDocument();

    // Lowercase + uppercase + numbers
    rerender(<PasswordStrengthMeter password="Abcdefgh123" />);
    expect(screen.getByText(/medium/i)).toBeInTheDocument();

    // Lowercase + uppercase + numbers + special
    rerender(<PasswordStrengthMeter password="Abcdefgh123!@#" />);
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('should handle very long passwords', () => {
    const longPassword = 'A'.repeat(100) + '1!@#';
    render(<PasswordStrengthMeter password={longPassword} />);

    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('should handle special characters correctly', () => {
    const specialChars = 'Abc123!@#$%^&*()';
    render(<PasswordStrengthMeter password={specialChars} />);

    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });
});
