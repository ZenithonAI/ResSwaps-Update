import React, { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'gold' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none transition-all duration-200 shadow-sm hover:shadow';
  
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-teal-600 hover:bg-teal-700 text-white',
    outline: 'border border-ivory-700 bg-transparent text-ivory-200 hover:bg-onyx-800/20',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-onyx-800/20 text-ivory-300 hover:text-gold-500',
    gold: 'bg-gold-600 hover:bg-gold-500 text-onyx-950 shadow-sm',
    glass: 'bg-onyx-800/20 border border-onyx-700/40 text-ivory-200 hover:bg-onyx-700/30',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const disabledStyles = disabled || isLoading
    ? 'opacity-60 cursor-not-allowed shadow-none'
    : '';
  
  const widthStyles = fullWidth ? 'w-full' : '';
  
  const mergedClassName = twMerge(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    disabledStyles,
    widthStyles,
    className
  );

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={mergedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </motion.button>
  );
};

export default Button;