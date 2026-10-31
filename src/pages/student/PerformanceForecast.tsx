import React from 'react';
import { ForecastResult, StudentAnalytics } from '../../types';
import { TrendLineChart } from '../../components/charts/TrendLineChart';
import { LineChart, AlertCircle, Info, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceForecastProps {
  forecast: ForecastResult;
  analytics: StudentAnalytics;
  onNavigateTab: (tabId: string) => void;
}

export const PerformanceForecast: React.FC<PerformanceForecastProps> = ({
  forecast,
  analytics,
  onNavigateTab
}) => {
  if (!forecast.hasSufficientData) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
        <h2 className="text-base font-semibold text-slate-100">Performance Forecasting Unavailable</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {forecast.message || 'Insufficient historical data for a reliable forecast.'} A minimum of 2 evaluated assessment cycles are required to generate regression-backed grade trajectories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <LineChart className="w-5 h-5 text-sky-400" />
          <span>Predictive Performance & End-Term Grade Forecasting</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Time-weighted autoregressive extrapolation based on continuous assessments (IA1, IA2, Mid-Term) and historical semester records
        </p>
      </div>

      {/* Top Forecast Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">Current Continuous GPA</div>
          <div className="text-2xl font-bold font-mono text-slate-200 mt-1">
            {forecast.currentGpa.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Internal CIE Marks Basis</div>
        </div>

        <div className="p-5 rounded-xl bg-sky-950/20 border border-sky-900/40">
          <div className="text-xs text-sky-300 font-medium">Projected Final Semester GPA</div>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
            {forecast.projectedFinalGpa.toFixed(2)}
          </div>
          <div className="text-[11px] text-sky-400/80 mt-1">
            Trajectory: {forecast.projectedFinalGpa >= forecast.currentGpa ? 'Upward' : 'Downward'}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">95% Confidence Interval</div>
          <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">
            {forecast.confidenceInterval.minGpa} – {forecast.confidenceInterval.maxGpa}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Based on ±4.2% standard estimation error</div>
        </div>
      </div>

      {/* Trajectory Curve */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">End-Term Assessment Projection Line</h2>
            <p className="text-xs text-slate-400">Solid line indicates recorded assessments; dashed line shows predicted trajectory</p>
          </div>
          <span className="text-[11px] font-mono text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800">
            Linear OLS Autoregression
          </span>
        </div>

        <TrendLineChart dataPoints={forecast.trajectoryPoints} height={260} />
      </div>

      {/* Subject-Wise Final Projections Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Course-Wise Projected Final Grades
          </div>
          <div className="text-[11px] text-slate-400">
            Continuous Internal Weight: 40% · Final Exam Weight: 60%
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Current CIE %</th>
                <th className="py-3 px-4">Projected Final %</th>
                <th className="py-3 px-4">Estimated Grade</th>
                <th className="py-3 px-4">Trajectory</th>
                <th className="py-3 px-4">Failure Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {forecast.subjectForecasts.map((sub) => (
                <tr key={sub.subjectCode} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    <div>{sub.subjectName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{sub.subjectCode}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                    {sub.currentScorePercentage}%
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-sky-400">
                    {sub.projectedFinalPercentage}%
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                    {sub.projectedGrade}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-1">
                      {sub.trajectory === 'UPWARD' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                      {sub.trajectory === 'DOWNWARD' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                      {sub.trajectory === 'STABLE' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
                      <span className={sub.trajectory === 'UPWARD' ? 'text-emerald-400' : sub.trajectory === 'DOWNWARD' ? 'text-rose-400' : 'text-slate-400'}>
                        {sub.trajectory}
                      </span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[11px] font-semibold ${
                      sub.riskOfFailure === 'HIGH' ? 'text-rose-400' : sub.riskOfFailure === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {sub.riskOfFailure} RISK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Transparency Box */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Algorithm: <span className="text-slate-300 font-mono">{forecast.modelEvaluation.algorithm}</span> ·
            Mean Absolute Error (MAE): <span className="text-slate-300 font-mono">±{forecast.modelEvaluation.meanAbsoluteError}%</span> ·
            R² Goodness of Fit: <span className="text-slate-300 font-mono">{forecast.modelEvaluation.rSquared}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
