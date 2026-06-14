import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prompt?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, prompt = '>', className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="font-mono text-sm text-primary">{label}</label>
        )}
        <div className="flex items-center gap-2">
          <span className="font-mono text-primary">{prompt}</span>
          <input
            ref={ref}
            className={`flex-1 min-w-0 bg-transparent border-b border-border text-primary font-mono outline-none focus:border-primary transition-colors ${className}`}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';
