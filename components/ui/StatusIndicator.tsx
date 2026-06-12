import React from 'react';

interface StatusIndicatorProps {
  status: 'success' | 'error' | 'pending' | 'running';
  label?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label }) => {
  const statusConfig = {
    success: { color: 'text-primary', symbol: '[OK]', label: 'SUCCESS' },
    error: { color: 'text-error', symbol: '[ERR]', label: 'FAILED' },
    pending: { color: 'text-secondary', symbol: '[--]', label: 'PENDING' },
    running: { color: 'text-primary animate-blink', symbol: '[..]', label: 'RUNNING' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-sm ${config.color}`}>{config.symbol}</span>
      {label && <span className="font-mono text-sm text-primary">{label}</span>}
    </div>
  );
};
