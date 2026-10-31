import React from 'react';

interface RiskBadgeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  score?: number;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showDot = true, size = 'md' }) => {
  const isHigh = level === 'HIGH';
  const isMedium = level === 'MEDIUM';

  const styleMap = {
    HIGH: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
    LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
  };

  const dotColor = isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500';
  const label = isHigh ? 'High Risk' : isMedium ? 'Medium Risk' : 'Low Risk';

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs transition-colors ${styleMap[level]} ${sizeClasses}`}>
      {showDot && (
        <span className="relative flex h-2 w-2">
          {isHigh && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
        </span>
      )}
      <span>{label}</span>
      {score !== undefined && (
        <span className="opacity-75 font-mono tabular-nums text-[11px]">
          ({score}/100)
        </span>
      )}
    </span>
  );
};
