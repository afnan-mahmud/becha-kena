import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className={`custom-input-wrapper ${error ? 'custom-input-error' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="custom-input-label">
            {label}
          </label>
        )}
        
        <div className="custom-input-container">
          {leftIcon && <div className="custom-input-icon left">{leftIcon}</div>}
          
          <input
            ref={ref}
            id={inputId}
            className={`custom-input ${leftIcon ? 'custom-input-has-left-icon' : ''} ${rightIcon ? 'custom-input-has-right-icon' : ''}`}
            aria-invalid={!!error}
            {...props}
          />
          
          {rightIcon && <div className="custom-input-icon right">{rightIcon}</div>}
        </div>
        
        {error ? (
          <span className="custom-input-error-text">{error}</span>
        ) : helperText ? (
          <span className="custom-input-helper-text">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
