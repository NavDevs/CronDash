import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'error';
  children: React.ReactNode;
  href?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', children, href, className = '', ...props }, ref) => {
    const baseStyles = 'font-mono whitespace-nowrap text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2 border transition-all duration-150 hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1';
    
    const variantStyles = {
      primary: 'border-primary text-primary hover:bg-primary hover:text-background',
      secondary: 'border-secondary text-secondary hover:bg-secondary hover:text-background',
      error: 'border-error text-error hover:bg-error hover:text-background',
    };

    if (href) {
      return (
        <Link
          href={href}
          className={`${baseStyles} ${variantStyles[variant]} inline-block ${className}`}
        >
          [ {children} ]
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        [ {children} ]
      </button>
    );
  }
);

Button.displayName = 'Button';
