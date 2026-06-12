import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`border border-border bg-background ${className}`}>
      {title && (
        <div className="border-b border-border px-4 py-2 bg-muted/20">
          <span className="font-mono text-sm text-primary">+--- {title.toUpperCase()} ---+</span>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};
