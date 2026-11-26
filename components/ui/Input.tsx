'use client';

import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, useState, ReactNode } from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  leftIcon?: ReactNode;
  rightAdornment?: ReactNode;
  prefixText?: string;
  suffixText?: string;
  shortcutHint?: string;
}

export function Input({
  label,
  helperText,
  error,
  success,
  leftIcon,
  rightAdornment,
  prefixText,
  suffixText,
  shortcutHint,
  type = 'text',
  className = '',
  id,
  required,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? `ui-input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const isSearch = type === 'search';

  const statusClass = error ? 'is-error' : success ? 'is-success' : '';
  const hasLeft = Boolean(leftIcon || isSearch || prefixText);
  const hasRight = Boolean(rightAdornment || isPassword || suffixText || shortcutHint);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary, #777B82)',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--accent-primary, #C95038)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {(leftIcon || isSearch || prefixText) && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              color: 'var(--icon-inactive, #858A91)',
              fontSize: '12px',
              fontWeight: 500,
              pointerEvents: 'none',
            }}
          >
            {leftIcon || (isSearch ? <Search size={14} /> : prefixText)}
          </span>
        )}
        <input
          id={inputId}
          type={resolvedType}
          required={required}
          className={`ui-input ${statusClass} ${className}`.trim()}
          style={{
            paddingLeft: hasLeft ? '34px' : '12px',
            paddingRight: hasRight ? '40px' : '12px',
            ...props.style,
          }}
          aria-invalid={Boolean(error) || undefined}
          {...props}
        />
        {(rightAdornment || isPassword || suffixText || shortcutHint) && (
          <span
            style={{
              position: 'absolute',
              right: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--text-muted, #96999F)',
              fontSize: '11px',
              fontWeight: 500,
            }}
          >
            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px',
                  color: 'var(--icon-inactive, #858A91)',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            ) : (
              rightAdornment ||
              suffixText ||
              (shortcutHint ? (
                <kbd
                  style={{
                    fontSize: '10px',
                    padding: '2px 5px',
                    borderRadius: '5px',
                    background: 'var(--surface-secondary, #EDEDEF)',
                    border: '1px solid var(--border-default, #E0E1E3)',
                    color: 'var(--text-secondary, #777B82)',
                  }}
                >
                  {shortcutHint}
                </kbd>
              ) : null)
            )}
          </span>
        )}
      </div>
      {(error || success || helperText) && (
        <span
          style={{
            fontSize: '10.5px',
            color: error
              ? 'var(--accent-primary, #C95038)'
              : success
              ? 'var(--accent-success, #19876D)'
              : 'var(--text-muted, #96999F)',
          }}
        >
          {error || success || helperText}
        </span>
      )}
    </div>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
}

export function Textarea({
  label,
  helperText,
  error,
  success,
  className = '',
  id,
  required,
  ...props
}: TextareaProps) {
  const inputId = id || (label ? `ui-textarea-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  const statusClass = error ? 'is-error' : success ? 'is-success' : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary, #777B82)',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--accent-primary, #C95038)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        required={required}
        className={`ui-textarea ${statusClass} ${className}`.trim()}
        aria-invalid={Boolean(error) || undefined}
        {...props}
      />
      {(error || success || helperText) && (
        <span
          style={{
            fontSize: '10.5px',
            color: error
              ? 'var(--accent-primary, #C95038)'
              : success
              ? 'var(--accent-success, #19876D)'
              : 'var(--text-muted, #96999F)',
          }}
        >
          {error || success || helperText}
        </span>
      )}
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: { value: string; label: string; disabled?: boolean }[];
}

export function Select({
  label,
  helperText,
  error,
  options,
  children,
  className = '',
  id,
  required,
  ...props
}: SelectProps) {
  const selectId = id || (label ? `ui-select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary, #777B82)',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--accent-primary, #C95038)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        className={`ui-select ${error ? 'is-error' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error) || undefined}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {(error || helperText) && (
        <span
          style={{
            fontSize: '10.5px',
            color: error ? 'var(--accent-primary, #C95038)' : 'var(--text-muted, #96999F)',
          }}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
}
