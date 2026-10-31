import React from 'react';

interface RiskDistributionDonutProps {
  distribution: {
    LOW?: number;
    MEDIUM?: number;
    HIGH?: number;
  };
}

export const RiskDistributionDonut: React.FC<RiskDistributionDonutProps> = ({ distribution }) => {
  const low = distribution.LOW || 0;
  const med = distribution.MEDIUM || 0;
  const high = distribution.HIGH || 0;
  const total = low + med + high;

  if (total === 0) {
    return <div className="text-xs text-slate-400 py-6 text-center">No student cohort data.</div>;
  }

  // Calculate percentages
  const pLow = (low / total) * 100;
  const pMed = (med / total) * 100;
  const pHigh = (high / total) * 100;

  // SVG Circle calculation
  const radius = 38;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;

  const strokeDashHigh = (pHigh / 100) * circumference;
  const strokeDashMed = (pMed / 100) * circumference;
  const strokeDashLow = (pLow / 100) * circumference;

  const offsetHigh = 0;
  const offsetMed = -strokeDashHigh;
  const offsetLow = -(strokeDashHigh + strokeDashMed);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
      <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth={strokeWidth}
          />
          {/* High Risk Segment */}
          {high > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f43f5e"
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeDashHigh} ${circumference}`}
              strokeDashoffset={offsetHigh}
              strokeLinecap="round"
            />
          )}
          {/* Medium Risk Segment */}
          {med > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeDashMed} ${circumference}`}
              strokeDashoffset={offsetMed}
              strokeLinecap="round"
            />
          )}
          {/* Low Risk Segment */}
          {low > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeDashLow} ${circumference}`}
              strokeDashoffset={offsetLow}
              strokeLinecap="round"
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black font-mono text-slate-900 dark:text-white leading-none">
            {total}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
            Students
          </span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2">
        <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Safe / Low Risk</span>
          </div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">{low} <span className="text-[11px] text-slate-400 font-normal">({pLow.toFixed(0)}%)</span></span>
        </div>

        <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Moderate / Watchlist</span>
          </div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">{med} <span className="text-[11px] text-slate-400 font-normal">({pMed.toFixed(0)}%)</span></span>
        </div>

        <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Critical / High Risk</span>
          </div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">{high} <span className="text-[11px] text-slate-400 font-normal">({pHigh.toFixed(0)}%)</span></span>
        </div>
      </div>
    </div>
  );
};
