/**
 * ActionButton Component
 * 
 * Mobile-optimized button with:
 * - Icon + label for clarity (user requested)
 * - Loading states
 * - Size variants (sm: 40px, md: 48px, lg: 56px)
 * - Color variants (primary, secondary, success, danger, ghost)
 * - Touch-optimized (minimum 48px tap target)
 * - Haptic feedback simulation (scale animation)
 * 
 * Usage:
 *   <ActionButton
 *     icon="bi-download"
 *     label="Descargar"
 *     onClick={handleDownload}
 *     size="md"
 *     variant="success"
 *   />
 */

import React from 'react';
import { motion } from 'framer-motion';

export type ActionButtonSize = 'sm' | 'md' | 'lg';
export type ActionButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';

export interface ActionButtonProps {
  icon?: string;
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  size?: ActionButtonSize;
  variant?: ActionButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  type = 'button',
  size = 'md',
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconOnly = false,
  className = '',
}) => {
  const isDisabled = disabled || loading;

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-3 text-base min-h-touch-lg',
    lg: 'px-6 py-4 text-lg min-h-[56px]',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-700 active:bg-primary-800',
    secondary: 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300 active:bg-neutral-400',
    success: 'bg-success-500 text-white hover:bg-success-600 active:bg-success-700',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700',
    warning: 'bg-accent text-white hover:bg-accent-600 active:bg-accent-700',
    ghost: 'bg-transparent text-primary hover:bg-primary-50 active:bg-primary-100',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={isDisabled ? {} : { scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-semibold
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      aria-label={label}
    >
      {/* Icon or Loading Spinner */}
      {loading ? (
        <i className="bi bi-arrow-repeat animate-spin"></i>
      ) : icon ? (
        <i className={icon}></i>
      ) : null}

      {/* Label (hide on mobile if iconOnly) */}
      {!iconOnly && (
        <span className={iconOnly ? 'sr-only' : ''}>
          {loading ? 'Cargando...' : label}
        </span>
      )}
    </motion.button>
  );
};
