import React from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      placeholder,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className={`custom-select-wrapper ${error ? 'custom-select-error' : ''} ${className}`}>
        {label && (
          <label htmlFor={selectId} className="custom-select-label">
            {label}
          </label>
        )}
        
        <div className="custom-select-container">
          <select
            ref={ref}
            id={selectId}
            className="custom-select"
            aria-invalid={!!error}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="custom-select-icon">
            <ChevronDown size={16} />
          </div>
        </div>
        
        {error && <span className="custom-select-error-text">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
