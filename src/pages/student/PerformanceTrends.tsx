import React from 'react';
import { StudentAnalytics, ForecastResult } from '../../types';
import { TrendLineChart } from '../../components/charts/TrendLineChart';
import { TrendingUp, TrendingDown, Minus, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PerformanceTrendsProps {
  analytics: StudentAnalytics;
  forecast: ForecastResult;
}

export const PerformanceTrends: React.FC<PerformanceTrendsProps> = ({ analytics, forecast }) => {
  const improvingSubs = analytics.subjects.filter(s => s.trend === 'IMPROVING');
  const decliningSubs = analytics.subjects.filter(s => s.trend === 'DECLINING');
  const stableSubs = analytics.subjects.filter(s => s.trend === 'STABLE');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <span>Continuous Assessment Performance Trends</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chronological learning trajectory, slope detection, and transition across continuous evaluation cycles
        </p>
      </div>

      {!analytics.hasDetailedSubjectData ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-200">Chronological Evolution Unavailable</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Detailed sequential internal assessment timelines cannot be plotted because this student's performance relies on single-point overall UCI dataset metrics.
          </p>
        </div>
      ) : (
        <>
          {/* Main Trajectory Chart */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Chronological Score Evolution</h2>
                <p className="text-xs text-slate-400">Progression from Semester 4 Final to Semester 5 Mid-Terms & Projected End-Term</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 ${
                  analytics.trendStatus === 'IMPROVING'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : analytics.trendStatus === 'DECLINING'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {analytics.trendStatus === 'IMPROVING' && <TrendingUp className="w-3.5 h-3.5" />}
                  {analytics.trendStatus === 'DECLINING' && <TrendingDown className="w-3.5 h-3.5" />}
                  {analytics.trendStatus === 'STABLE' && <Minus className="w-3.5 h-3.5" />}
                  <span>{analytics.trendStatus} TRAJECTORY</span>
                </span>
              </div>
            </div>

            <TrendLineChart dataPoints={forecast.trajectoryPoints} height={260} />
          </div>

          {/* Trajectory Segmentation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Improving Subjects */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Improving Courses ({improvingSubs.length})</span>
                </span>
              </div>
              {improvingSubs.length > 0 ? (
                <div className="space-y-2">
                  {improvingSubs.map(s => (
                    <div key={s.code} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-xs">
                      <div className="font-semibold text-emerald-200">{s.code} · {s.name}</div>
                      <div className="text-[11px] text-emerald-400/80 mt-0.5">
                        IA-1: {(s.ia1Marks/s.ia1Max*100).toFixed(0)}% → Mid-Term: {(s.midTermMarks/s.midTermMax*100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-3">No subjects currently exhibiting positive upward slope.</div>
              )}
            </div>

            {/* Stable Subjects */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Minus className="w-4 h-4 text-slate-400" />
                  <span>Stable Courses ({stableSubs.length})</span>
                </span>
              </div>
              {stableSubs.length > 0 ? (
                <div className="space-y-2">
                  {stableSubs.map(s => (
                    <div key={s.code} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                      <div className="font-semibold text-slate-200">{s.code} · {s.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Consistency maintained across internal milestones (score: {s.weightedScorePercentage}%)
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-3">No subjects in the neutral range.</div>
              )}
            </div>

            {/* Declining Subjects */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4" />
                  <span>Declining Courses ({decliningSubs.length})</span>
                </span>
              </div>
              {decliningSubs.length > 0 ? (
                <div className="space-y-2">
                  {decliningSubs.map(s => (
                    <div key={s.code} className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 text-xs">
                      <div className="font-semibold text-rose-200">{s.code} · {s.name}</div>
                      <div className="text-[11px] text-rose-400/80 mt-0.5">
                        Score dropped from IA-1 ({(s.ia1Marks/s.ia1Max*100).toFixed(0)}%) to Mid-Term ({(s.midTermMarks/s.midTermMax*100).toFixed(0)}%)
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-emerald-400/80 py-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>No negative downward drops detected.</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
