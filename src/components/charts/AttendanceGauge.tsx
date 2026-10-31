import React from 'react';

interface AttendanceGaugeProps {
  percentage: number;
  totalClasses?: number;
  attendedClasses?: number;
}

export const AttendanceGauge: React.FC<AttendanceGaugeProps> = ({
  percentage,
  totalClasses,
  attendedClasses
}) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const isDanger = clamped < 65;
  const isWarning = clamped >= 65 && clamped < 75;
  const isSafe = clamped >= 75;

  const color = isDanger ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981';

  // Semi-circle meter
  const radius = 45;
  const strokeWidth = 9;
  const circumference = Math.PI * radius; // 180 degrees
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="relative w-48 h-28 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 110 65" className="w-full h-full">
          {/* Background Arc */}
          <path
            d="M 10 55 A 45 45 0 0 1 100 55"
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* 75% Institutional Threshold Line tick */}
          <line
            x1={55 + 40 * Math.cos(Math.PI * (1 - 0.75))}
            y1={55 - 40 * Math.sin(Math.PI * (1 - 0.75))}
            x2={55 + 50 * Math.cos(Math.PI * (1 - 0.75))}
            y2={55 - 50 * Math.sin(Math.PI * (1 - 0.75))}
            stroke="#f59e0b"
            strokeWidth="2"
          />

          {/* Foreground Colored Arc */}
          <path
            d="M 10 55 A 45 45 0 0 1 100 55"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute bottom-2 inset-x-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white leading-none">
            {clamped}%
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-1">
            Aggregate
          </span>
        </div>
      </div>

      <div className="w-full mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Min. Required: <strong>75%</strong></span>
          <span className={isSafe ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
            {isSafe ? 'Eligible for Exams' : 'Condonation Alert'}
          </span>
        </div>
        {totalClasses !== undefined && attendedClasses !== undefined && (
          <p className="text-[11px] text-slate-400 font-mono">
            Attended {attendedClasses} of {totalClasses} scheduled sessions
          </p>
        )}
      </div>
    </div>
  );
};
