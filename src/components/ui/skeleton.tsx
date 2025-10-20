import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseStyles = 'bg-gray-200 dark:bg-gray-700';

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height)
    style.height = typeof height === 'number' ? `${height}px` : height;

  const combinedClassName = `${baseStyles} ${animationStyles[animation]} ${variantStyles[variant]} ${className}`;

  return <div className={combinedClassName} style={style} />;
};

// Card Skeleton Component
export interface SkeletonCardProps {
  className?: string;
  hasHeader?: boolean;
  hasFooter?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  hasHeader = true,
  hasFooter = false,
  lines = 3,
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {hasHeader && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <Skeleton width="60%" height={24} />
        </div>
      )}
      <div className="px-6 py-4 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? '80%' : '100%'}
            height={16}
          />
        ))}
      </div>
      {hasFooter && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <Skeleton width={100} height={36} variant="rectangular" />
          <Skeleton width={100} height={36} variant="rectangular" />
        </div>
      )}
    </div>
  );
};

// Table Skeleton Component
export interface SkeletonTableProps {
  className?: string;
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  className = '',
  rows = 5,
  columns = 4,
  hasHeader = true,
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {hasHeader && (
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} className="px-6 py-3">
                    <Skeleton width="80%" height={16} />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <Skeleton width="90%" height={16} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Form Skeleton Component
export interface SkeletonFormProps {
  className?: string;
  fields?: number;
  hasSubmitButton?: boolean;
}

export const SkeletonForm: React.FC<SkeletonFormProps> = ({
  className = '',
  fields = 4,
  hasSubmitButton = true,
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton width="30%" height={16} />
          <Skeleton width="100%" height={40} variant="rectangular" />
        </div>
      ))}
      {hasSubmitButton && (
        <div className="pt-4">
          <Skeleton width={120} height={40} variant="rectangular" />
        </div>
      )}
    </div>
  );
};

// Dashboard Stats Skeleton Component
export interface SkeletonStatsProps {
  className?: string;
  count?: number;
}

export const SkeletonStats: React.FC<SkeletonStatsProps> = ({
  className = '',
  count = 4,
}) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton width={60} height={60} variant="circular" />
            <Skeleton width={40} height={40} variant="rectangular" />
          </div>
          <Skeleton width="60%" height={20} className="mb-2" />
          <Skeleton width="40%" height={32} />
        </div>
      ))}
    </div>
  );
};

// List Item Skeleton Component
export interface SkeletonListItemProps {
  className?: string;
  hasAvatar?: boolean;
  lines?: number;
}

export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  className = '',
  hasAvatar = true,
  lines = 2,
}) => {
  return (
    <div className={`flex items-start gap-4 p-4 ${className}`}>
      {hasAvatar && <Skeleton width={48} height={48} variant="circular" />}
      <div className="flex-1 space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === 0 ? '70%' : '90%'}
            height={index === 0 ? 20 : 16}
          />
        ))}
      </div>
    </div>
  );
};

// List Skeleton Component
export interface SkeletonListProps {
  className?: string;
  items?: number;
  hasAvatar?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  className = '',
  items = 5,
  hasAvatar = true,
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 ${className}`}
    >
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonListItem key={index} hasAvatar={hasAvatar} />
      ))}
    </div>
  );
};

// Page Skeleton Component - Full page loading state
export interface SkeletonPageProps {
  className?: string;
  hasHeader?: boolean;
  hasSidebar?: boolean;
}

export const SkeletonPage: React.FC<SkeletonPageProps> = ({
  className = '',
  hasHeader = true,
  hasSidebar = false,
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {hasHeader && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <Skeleton width="30%" height={32} />
        </div>
      )}
      <div className="flex">
        {hasSidebar && (
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                width="100%"
                height={40}
                variant="rectangular"
              />
            ))}
          </div>
        )}
        <div className="flex-1 p-6 space-y-6">
          <SkeletonStats count={4} />
          <SkeletonTable rows={8} columns={5} />
        </div>
      </div>
    </div>
  );
};
