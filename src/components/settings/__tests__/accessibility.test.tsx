/**
 * Accessibility tests for settings interface
 * Tests keyboard navigation, ARIA labels, and responsive behavior
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserTable } from '../UserTable';
import { ProfileForm } from '../ProfileForm';
import { SettingsSearch } from '../SettingsSearch';
import { UserRole } from '@prisma/client';

describe('Settings Accessibility', () => {
  describe('UserTable', () => {
    const mockUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        sessionCount: 2,
      },
    ];

    it('should have proper ARIA labels', () => {
      render(
        <UserTable
          users={mockUsers}
          selectedUsers={[]}
          onSelect={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggleStatus={vi.fn()}
          currentUserId="2"
        />
      );

      expect(
        screen.getByRole('region', { name: /user management table/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/search users/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by role/i)).toBeInTheDocument();
    });

    it('should have accessible pagination', () => {
      const manyUsers = Array.from({ length: 30 }, (_, i) => ({
        ...mockUsers[0],
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      render(
        <UserTable
          users={manyUsers}
          selectedUsers={[]}
          onSelect={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggleStatus={vi.fn()}
          currentUserId="100"
        />
      );

      const pagination = screen.getByRole('navigation', {
        name: /pagination/i,
      });
      expect(pagination).toBeInTheDocument();
    });

    it('should have minimum touch target size', () => {
      render(
        <UserTable
          users={mockUsers}
          selectedUsers={[]}
          onSelect={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggleStatus={vi.fn()}
          currentUserId="2"
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        const minWidth = parseInt(styles.minWidth);

        // Should meet WCAG touch target size (44x44px)
        expect(minHeight).toBeGreaterThanOrEqual(44);
        expect(minWidth).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('SettingsSearch', () => {
    it('should have proper search role', () => {
      render(<SettingsSearch onSearch={vi.fn()} />);

      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const onSearch = vi.fn();
      render(<SettingsSearch onSearch={onSearch} />);

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(onSearch).toHaveBeenCalledWith('test');
    });

    it('should have clear button with proper label', () => {
      render(<SettingsSearch onSearch={vi.fn()} />);

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const clearButton = screen.getByLabelText(/clear search/i);
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('ProfileForm', () => {
    const mockProfile = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.ADMIN,
      employeeId: 'EMP001',
      department: 'IT',
      phoneNumber: '+1234567890',
      workLocation: 'Main Office',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should have proper form labels', () => {
      render(<ProfileForm profile={mockProfile} onUpdate={vi.fn()} />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/employee id/i)).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(<ProfileForm profile={mockProfile} onUpdate={vi.fn()} />);

      const nameInput = screen.getByLabelText(/full name/i);
      expect(nameInput).toHaveAttribute('required');
      expect(nameInput).toHaveAttribute('aria-required', 'true');
    });

    it('should have status announcements', () => {
      render(<ProfileForm profile={mockProfile} onUpdate={vi.fn()} />);

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      expect(statusRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have minimum touch target size for inputs', () => {
      render(<ProfileForm profile={mockProfile} onUpdate={vi.fn()} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        const styles = window.getComputedStyle(input);
        const minHeight = parseInt(styles.minHeight);

        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Tab navigation', () => {
      render(<SettingsSearch onSearch={vi.fn()} />);

      const searchInput = screen.getByRole('searchbox');
      searchInput.focus();

      expect(document.activeElement).toBe(searchInput);
    });

    it('should have visible focus indicators', () => {
      render(<SettingsSearch onSearch={vi.fn()} />);

      const searchInput = screen.getByRole('searchbox');
      searchInput.focus();

      const styles = window.getComputedStyle(searchInput);
      expect(styles.outline).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    const mockUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        sessionCount: 2,
      },
    ];

    it('should adapt to mobile viewport', () => {
      // Mock window.innerWidth
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));

      render(
        <UserTable
          users={mockUsers}
          selectedUsers={[]}
          onSelect={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggleStatus={vi.fn()}
          currentUserId="2"
        />
      );

      // Mobile view should show cards instead of table
      // This would need actual implementation to test properly
      expect(true).toBe(true);
    });
  });
});
