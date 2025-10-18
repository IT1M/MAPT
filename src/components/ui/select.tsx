import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    
    const baseStyles = 'w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white dark:bg-gray-800';
    
    const normalStyles = 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:text-gray-100 dark:focus:border-primary-400';
    
    const errorStyles = 'border-danger-500 focus:border-danger-500 focus:ring-danger-500 dark:border-danger-400';
    
    const selectClassName = `${baseStyles} ${error ? errorStyles : normalStyles} ${className}`;
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 rtl:text-right"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={selectClassName}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p
            id={`${selectId}-error`}
            className="mt-1 text-sm text-danger-600 dark:text-danger-400 rtl:text-right"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${selectId}-helper`}
            className="mt-1 text-sm text-gray-500 dark:text-gray-400 rtl:text-right"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
