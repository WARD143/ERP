import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'UP' | 'DOWN' | 'NEUTRAL';
  trendText?: string;
  statusColor?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'violet' | 'blue';
  progress?: number; // 0 to 100 for progress bar
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendText,
  statusColor = 'indigo',
  progress,
  badgeText
}) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40',
      bar: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400'
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40',
      bar: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400'
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40',
      bar: 'bg-rose-500',
      text: 'text-rose-600 dark:text-rose-400'
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/40',
      bar: 'bg-indigo-600',
      text: 'text-indigo-600 dark:text-indigo-400'
    },
    violet: {
      bg: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/40',
      bar: 'bg-violet-600',
      text: 'text-violet-600 dark:text-violet-400'
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40',
      bar: 'bg-blue-600',
      text: 'text-blue-600 dark:text-blue-400'
    }
  };

  const scheme = colorMap[statusColor] || colorMap.indigo;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      {/* Top subtle highlight gradient */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent group-hover:via-indigo-500/50 transition-all duration-300" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {title}
          </span>
          <div className="flex items-center gap-2">
            {badgeText && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scheme.bg}`}>
                {badgeText}
              </span>
            )}
            {Icon && (
              <div className={`p-2 rounded-xl border shadow-2xs ${scheme.bg}`}>
                <Icon className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-extrabold tracking-tight font-mono tabular-nums text-slate-900 dark:text-white">
            {value}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {progress !== undefined && (
          <div className="mb-2">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scheme.bar}`}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}

        {(subtitle || trendText) && (
          <div className="flex items-center justify-between gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              {trend === 'UP' && <span className="text-emerald-600 dark:text-emerald-400 font-bold">↑</span>}
              {trend === 'DOWN' && <span className="text-rose-600 dark:text-rose-400 font-bold">↓</span>}
              {trend === 'NEUTRAL' && <span className="text-slate-400 dark:text-slate-500">→</span>}
              {trendText && (
                <span className={trend === 'UP' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : trend === 'DOWN' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}>
                  {trendText}
                </span>
              )}
            </div>
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
