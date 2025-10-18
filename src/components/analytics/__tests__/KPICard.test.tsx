import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KPICard } from '../KPICard';

describe('KPICard', () => {
  it('renders with basic props', () => {
    render(
      <KPICard
        title="Test KPI"
        value={100}
        icon="📊"
      />
    );

    expect(screen.getByText('Test KPI')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('renders with trend indicator', () => {
    render(
      <KPICard
        title="Test KPI"
        value={100}
        icon="📊"
        trend={{
          direction: 'up',
          percentage: 15.5,
          label: 'vs prev period',
        }}
      />
    );

    expect(screen.getByText('↑')).toBeInTheDocument();
    expect(screen.getByText('15.5%')).toBeInTheDocument();
    expect(screen.getByText('vs prev period')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    
    render(
      <KPICard
        title="Test KPI"
        value={100}
        icon="📊"
        onClick={handleClick}
      />
    );

    const card = screen.getByText('Test KPI').closest('div')?.parentElement?.parentElement;
    if (card) {
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('renders loading state', () => {
    render(
      <KPICard
        title="Test KPI"
        value={100}
        icon="📊"
        loading={true}
      />
    );

    // Loading state should show skeleton
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('applies correct color classes', () => {
    const { container } = render(
      <KPICard
        title="Test KPI"
        value={100}
        icon="📊"
        color="danger"
      />
    );

    // Check for red color classes
    expect(container.innerHTML).toContain('bg-red-50');
  });

  it('formats numeric values with locale', () => {
    render(
      <KPICard
        title="Test KPI"
        value={1000000}
        icon="📊"
      />
    );

    // Should format with commas
    expect(screen.getByText('1,000,000')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <KPICard
        title="Test KPI"
        value={100}
        subtitle="Additional info"
        icon="📊"
      />
    );

    expect(screen.getByText('Additional info')).toBeInTheDocument();
  });
});
