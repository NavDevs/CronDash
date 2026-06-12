import React from 'react';

interface ProgressBarProps {
  progress: number;
  total?: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, total = 100, label }) => {
  const percentage = Math.min((progress / total) * 100, 100);
  const filledBars = Math.floor(percentage / 10);
  const emptyBars = 10 - filledBars;

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="font-mono text-sm text-primary">{label}</span>}
      <div className="font-mono text-sm">
        <span className="text-primary">[</span>
        <span className="text-primary">
          {'|'.repeat(filledBars)}
        </span>
        <span className="text-primary">
          {'.'.repeat(emptyBars)}
        </span>
        <span className="text-primary">]</span>
        <span className="text-primary ml-2">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};
