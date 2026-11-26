'use client';

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { AnimatedOrb } from './LoadingSystem';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={`ui-btn ui-btn-${variant} ui-btn-${size} ${fullWidth ? 'ui-btn-block' : ''} ${className}`.trim()}
      {...props}
    >
      {loading ? <AnimatedOrb size="inline" tone={variant === 'primary' || variant === 'destructive' ? 'on-dark' : 'default'} /> : leftIcon}
      {children && <span>{children}</span>}
      {!loading && rightIcon}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  label: string;
}

export function IconButton({
  variant = 'outline',
  size = 'sm',
  loading = false,
  disabled = false,
  label,
  children,
  className = '',
  type = 'button',
  ...props
}: IconButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-label={label}
      title={props.title || label}
      aria-busy={loading || undefined}
      className={`ui-btn ui-btn-${variant} ui-btn-icon-${size} ${className}`.trim()}
      {...props}
    >
      {loading ? <AnimatedOrb size="inline" tone={variant === 'primary' || variant === 'destructive' ? 'on-dark' : 'default'} /> : children}
    </button>
  );
}
