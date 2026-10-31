import React, { useState } from 'react';
import { SubjectAnalytics } from '../../types';

interface SubjectBarChartProps {
  subjects: SubjectAnalytics[];
}

export const SubjectBarChart: React.FC<SubjectBarChartProps> = ({ subjects }) => {
  const [hoveredSub, setHoveredSub] = useState<SubjectAnalytics | null>(null);

  if (!subjects || subjects.length === 0) {
    return <div className="text-xs text-slate-500 py-6 text-center">No subject analytics available.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Weighted Performance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Attendance</span>
          </div>
        </div>
        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
          Min. Threshold: 75%
        </div>
      </div>

      <div className="space-y-3">
        {subjects.map((sub) => {
          const isAtRisk = sub.riskStatus === 'HIGH';
          const isWarning = sub.riskStatus === 'MEDIUM';

          return (
            <div
              key={sub.code}
              className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 transition-all duration-150"
              onMouseEnter={() => setHoveredSub(sub)}
              onMouseLeave={() => setHoveredSub(null)}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                    {sub.code}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-xs">{sub.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{sub.weightedScorePercentage}% Marks</span>
                  <span className={sub.attendancePercentage < 75 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                    {sub.attendancePercentage}% Att.
                  </span>
                </div>
              </div>

              {/* Progress bars stack */}
              <div className="space-y-1.5">
                {/* Performance bar */}
                <div className="h-2 w-full bg-slate-200/70 dark:bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAtRisk
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                        : isWarning
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                        : 'bg-gradient-to-r from-indigo-500 to-violet-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, sub.weightedScorePercentage))}%` }}
                  />
                </div>

                {/* Attendance bar */}
                <div className="h-1 w-full bg-slate-200/50 dark:bg-slate-700/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sub.attendancePercentage < 75 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, sub.attendancePercentage))}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
