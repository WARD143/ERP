import React, { useState } from 'react';
import { api } from '../../api/client';
import { Target, TrendingUp, TrendingDown, ArrowRight, Activity, Calculator } from 'lucide-react';

interface WhatIfAnalysisProps {
  studentId: string;
  baselinePercentage: number;
  isFaculty: boolean;
  onClose?: () => void;
}

export const WhatIfAnalysis: React.FC<WhatIfAnalysisProps> = ({ studentId, baselinePercentage, isFaculty }) => {
  const [hypotheticalScore, setHypotheticalScore] = useState<string>('');
  const [targetScore, setTargetScore] = useState<string>('75');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!hypotheticalScore) return;
    
    const score = Number(hypotheticalScore);
    if (isNaN(score) || score < 0 || score > 100) {
      setError('Please enter a valid hypothetical score between 0 and 100.');
      return;
    }

    setLoading(true);
    try {
      const payload = { hypotheticalEndTermPercentage: score };
      const response = isFaculty 
        ? await api.runFacultyWhatIfSimulation(studentId, payload)
        : await api.runWhatIfSimulation(studentId, payload);
      setResult(response.result);
    } catch (err: any) {
      setError(err.message || 'Simulation failed due to missing data.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setHypotheticalScore('');
    setError(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Calculator className="w-32 h-32 text-indigo-400" />
      </div>

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <Target className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-bold text-slate-100">What-If Analysis</h3>
      </div>
      <p className="text-xs text-slate-400 mb-6 relative z-10">
        Explore target-score scenarios and possible performance outcomes. This simulation uses actual academic structures and does not modify database records.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 relative z-10">
          <Activity className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-300">{error}</p>
        </div>
      )}

      {!result ? (
        <form onSubmit={runSimulation} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Overall Performance</label>
            <div className="text-xl font-bold text-slate-100">{baselinePercentage}%</div>
          </div>

          <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
            <label className="block text-sm font-medium text-slate-200">
              What if I score <span className="text-indigo-400 font-bold">_____</span> in my next end-term assessment?
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="100"
                required
                value={hypotheticalScore}
                onChange={(e) => setHypotheticalScore(e.target.value)}
                placeholder="e.g. 80"
                className="w-full sm:w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-slate-400 font-medium">%</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !hypotheticalScore}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Calculating...' : 'Calculate Scenario'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6 relative z-10 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Current</div>
              <div className="text-xl font-bold text-slate-300">{result.baseline.percentage}%</div>
            </div>
            <div className="hidden sm:flex items-center justify-center p-3">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </div>
            <div className="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl">
              <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mb-1">Projected</div>
              <div className="text-xl font-bold text-white">{result.simulated.percentage}%</div>
            </div>
            <div className={`p-3 border rounded-xl ${result.simulated.percentageGain >= 0 ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-rose-950/30 border-rose-900/50'}`}>
              <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${result.simulated.percentageGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Difference</div>
              <div className={`text-xl font-bold flex items-center gap-1 ${result.simulated.percentageGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.simulated.percentageGain >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {result.simulated.percentageGain > 0 ? '+' : ''}{result.simulated.percentageGain}%
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
             <h4 className="text-xs font-semibold text-slate-300 mb-3">Goal Targeting</h4>
             <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                  <div className="text-xs text-slate-400">Target Achievement (Distinction): 80.75%</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {result.simulated.percentage >= 80.75 ? <span className="text-emerald-400">ACHIEVED</span> : <span className="text-amber-400">NOT ACHIEVED</span>}
                  </div>
                </div>
                {result.targetsNeeded.scoreForDistinctionGpa8_5 !== null && (
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Required next score for Distinction:</div>
                    <div className="text-sm font-bold text-indigo-300 mt-1">{result.targetsNeeded.scoreForDistinctionGpa8_5}%</div>
                  </div>
                )}
             </div>
          </div>

          <div className="pt-2">
            <button
              onClick={reset}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-sm transition-colors"
            >
              Run Another Scenario
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
