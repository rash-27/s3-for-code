import React from 'react';

const FormInput = ({ 
  label, 
  name, 
  type = 'text', 
  register, 
  errors, 
  required = false, 
  placeholder, 
  helpText,
  options = null,
  validation = {}
}) => {
  const hasError = errors && errors[name];

  return (
    <div className="form-group">
      <label htmlFor={name} className={required ? 'required' : ''}>
        {label}
      </label>
      
      {type === 'select' ? (
        <select
          id={name}
          {...register(name, { required: required && `${label} is required`, ...validation })}
          className={hasError ? 'error' : ''}
        >
          <option value="">Choose {label.toLowerCase()}...</option>
          {options?.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type={type}
          {...register(name, { 
            required: required && `${label} is required`,
            ...(type === 'url' && {
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Please enter a valid URL'
              }
            }),
            ...validation
          })}
          placeholder={placeholder}
          className={hasError ? 'error' : ''}
        />
      )}
      
      {helpText && (
        <small className="form-help">
          {helpText}
        </small>
      )}
      
      {hasError && (
        <span className="error-message">
          {hasError.message}
        </span>
      )}
    </div>
  );
};

export default FormInput;
