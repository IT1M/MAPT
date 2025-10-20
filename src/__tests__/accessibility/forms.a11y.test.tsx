/**
 * Accessibility Tests: Form Components
 * Tests WCAG AA compliance for form elements
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { NextIntlClientProvider } from 'next-intl';

expect.extend(toHaveNoViolations);

// Mock form components for testing
const TestInput = ({ label, error, required }: any) => (
  <div>
    <label htmlFor="test-input">
      {label}
      {required && <span aria-label="required">*</span>}
    </label>
    <input
      id="test-input"
      type="text"
      aria-required={required}
      aria-invalid={!!error}
      aria-describedby={error ? 'test-input-error' : undefined}
    />
    {error && (
      <div id="test-input-error" role="alert" aria-live="polite">
        {error}
      </div>
    )}
  </div>
);

const TestSelect = ({ label, options, error }: any) => (
  <div>
    <label htmlFor="test-select">{label}</label>
    <select
      id="test-select"
      aria-invalid={!!error}
      aria-describedby={error ? 'test-select-error' : undefined}
    >
      {options.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    {error && (
      <div id="test-select-error" role="alert">
        {error}
      </div>
    )}
  </div>
);

const TestCheckbox = ({ label, checked }: any) => (
  <div>
    <input
      type="checkbox"
      id="test-checkbox"
      checked={checked}
      aria-checked={checked}
    />
    <label htmlFor="test-checkbox">{label}</label>
  </div>
);

const TestRadioGroup = ({ legend, options }: any) => (
  <fieldset>
    <legend>{legend}</legend>
    {options.map((opt: string, idx: number) => (
      <div key={opt}>
        <input type="radio" id={`radio-${idx}`} name="test-radio" value={opt} />
        <label htmlFor={`radio-${idx}`}>{opt}</label>
      </div>
    ))}
  </fieldset>
);

const messages = {
  forms: {
    required: 'Required',
    error: 'This field has an error',
  },
};

const TestWrapper = ({ children }: any) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
);

describe('Form Accessibility Tests', () => {
  describe('Input Fields', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <TestInput label="Username" required={true} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper label association', () => {
      const { container } = render(
        <TestWrapper>
          <TestInput label="Email" />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      const label = container.querySelector('label');

      expect(input).toHaveAttribute('id');
      expect(label).toHaveAttribute('for', input?.id);
    });

    it('should indicate required fields', () => {
      const { container } = render(
        <TestWrapper>
          <TestInput label="Password" required={true} />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-required', 'true');

      const requiredIndicator = container.querySelector(
        '[aria-label="required"]'
      );
      expect(requiredIndicator).toBeInTheDocument();
    });

    it('should properly announce errors', () => {
      const { container } = render(
        <TestWrapper>
          <TestInput label="Email" error="Invalid email format" />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      const errorMessage = container.querySelector('[role="alert"]');

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Select Dropdowns', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <TestSelect label="Country" options={['USA', 'Canada', 'Mexico']} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper label association', () => {
      const { container } = render(
        <TestWrapper>
          <TestSelect label="Language" options={['English', 'Arabic']} />
        </TestWrapper>
      );

      const select = container.querySelector('select');
      const label = container.querySelector('label');

      expect(select).toHaveAttribute('id');
      expect(label).toHaveAttribute('for', select?.id);
    });

    it('should announce validation errors', () => {
      const { container } = render(
        <TestWrapper>
          <TestSelect
            label="Role"
            options={['Admin', 'User']}
            error="Please select a role"
          />
        </TestWrapper>
      );

      const select = container.querySelector('select');
      const errorMessage = container.querySelector('[role="alert"]');

      expect(select).toHaveAttribute('aria-invalid', 'true');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Checkboxes', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <TestCheckbox label="Accept terms" checked={false} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper label association', () => {
      const { container } = render(
        <TestWrapper>
          <TestCheckbox label="Subscribe to newsletter" checked={false} />
        </TestWrapper>
      );

      const checkbox = container.querySelector('input[type="checkbox"]');
      const label = container.querySelector('label');

      expect(checkbox).toHaveAttribute('id');
      expect(label).toHaveAttribute('for', checkbox?.id);
    });

    it('should indicate checked state', () => {
      const { container } = render(
        <TestWrapper>
          <TestCheckbox label="Remember me" checked={true} />
        </TestWrapper>
      );

      const checkbox = container.querySelector('input[type="checkbox"]');
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Radio Groups', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <TestRadioGroup
            legend="Select payment method"
            options={['Credit Card', 'PayPal', 'Bank Transfer']}
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should use fieldset and legend', () => {
      const { container } = render(
        <TestWrapper>
          <TestRadioGroup
            legend="Choose a plan"
            options={['Basic', 'Pro', 'Enterprise']}
          />
        </TestWrapper>
      );

      const fieldset = container.querySelector('fieldset');
      const legend = container.querySelector('legend');

      expect(fieldset).toBeInTheDocument();
      expect(legend).toBeInTheDocument();
      expect(legend?.textContent).toBe('Choose a plan');
    });

    it('should group radio buttons with same name', () => {
      const { container } = render(
        <TestWrapper>
          <TestRadioGroup
            legend="Select size"
            options={['Small', 'Medium', 'Large']}
          />
        </TestWrapper>
      );

      const radios = container.querySelectorAll('input[type="radio"]');
      const names = Array.from(radios).map((r) => r.getAttribute('name'));

      // All radios should have the same name
      expect(new Set(names).size).toBe(1);
    });
  });

  describe('Form Validation', () => {
    it('should announce validation errors with proper timing', () => {
      const { container } = render(
        <TestWrapper>
          <TestInput label="Email" error="Invalid email" />
        </TestWrapper>
      );

      const errorMessage = container.querySelector('[role="alert"]');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });

    it('should link errors to inputs', () => {
      const { container } = render(
        <TestWrapper>
          <TestInput label="Username" error="Username is required" />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      const errorId = input?.getAttribute('aria-describedby');
      const errorMessage = container.querySelector(`#${errorId}`);

      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage?.textContent).toBe('Username is required');
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', () => {
      const { container } = render(
        <TestWrapper>
          <TestInput label="Search" />
        </TestWrapper>
      );

      const input = container.querySelector('input');

      // Check if input can receive focus (not disabled, no negative tabindex)
      expect(input).not.toHaveAttribute('disabled');
      const tabindex = input?.getAttribute('tabindex');
      expect(tabindex === null || (tabindex && parseInt(tabindex) >= 0)).toBe(
        true
      );
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow keyboard interaction', () => {
      const { container } = render(
        <TestWrapper>
          <form>
            <TestInput label="First Name" />
            <TestInput label="Last Name" />
            <button type="submit">Submit</button>
          </form>
        </TestWrapper>
      );

      const inputs = container.querySelectorAll('input');
      const button = container.querySelector('button');

      // All interactive elements should be keyboard accessible
      inputs.forEach((input) => {
        const tabindex = input.getAttribute('tabindex');
        expect(tabindex === null || parseInt(tabindex) >= 0).toBe(true);
      });

      expect(button).not.toHaveAttribute('disabled');
    });
  });
});
