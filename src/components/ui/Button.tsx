import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-280 border-none outline-none cursor-pointer';
  
  const variantStyles = {
    primary: 'bg-[var(--color-primary-accent)] text-[rgba(0,0,0,0.92)] shadow-[0_10px_28px_-8px_var(--color-primary-accent-glow)] hover:translate-y-[-2px] hover:shadow-[0_14px_36px_-10px_var(--color-primary-accent-glow)]',
    outline: 'bg-transparent text-text-primary border border-border hover:bg-[rgba(0,0,0,0.04)] hover:border-[rgba(255,126,0,0.55)] hover:translate-y-[-1px]',
    ghost: 'bg-transparent text-text-secondary hover:bg-[rgba(0,0,0,0.03)] hover:text-text-primary',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
