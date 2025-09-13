import React from 'react';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  size = 'normal',
  onClick, 
  disabled = false, 
  loading = false,
  ariaLabel,
  className = '',
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'normal' ? `btn-${size}` : '';
  const loadingClass = loading ? 'btn-loading' : '';
  
  const buttonClass = [
    baseClass,
    variantClass,
    sizeClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      {...props}
    >
      {loading ? (
        <>
          <span className="loading-spinner" aria-hidden="true">⟳</span>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
