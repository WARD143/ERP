import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { RiskConfiguration } from '../../types';
import { SlidersHorizontal, CheckCircle2, AlertCircle, Save, Info, Sparkles } from 'lucide-react';

export const RiskThresholdConfig: React.FC = () => {
  const [config, setConfig] = useState<RiskConfiguration | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    api.getRiskConfig()
      .then(res => setConfig(res.config))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await api.updateRiskConfig(config);
      setConfig(res.config);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      alert('Failed to update thresholds: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading risk configuration parameters...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
          <span>Early Warning Risk Engine Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Define institutional academic policies, statutory attendance limits, and multi-factor classification cutoffs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Form */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <form onSubmit={handleSave} className="space-y-5">
            {savedSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Thresholds updated successfully. Full cohort risk assessment was automatically re-evaluated!</span>
              </div>
            )}

            {/* Attendance Threshold */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Statutory Minimum Attendance Threshold (%)
              </label>
              <div className="text-[11px] text-slate-400">
                Students falling below this threshold trigger an automatic Low Attendance Flag and risk score penalty.
              </div>
              <input
                type="number"
                min={50}
                max={95}
                step={0.5}
                value={config.minAttendanceThreshold}
                onChange={(e) => setConfig({ ...config, minAttendanceThreshold: Number(e.target.value) })}
                className="w-full sm:w-64 p-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Score Decline Threshold */}
            <div className="space-y-1.5 pt-3 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-200">
                Continuous Evaluation Decline Threshold (%)
              </label>
              <div className="text-[11px] text-slate-400">
                Downward drop between successive assessments (e.g. IA-1 to Mid-Term) that flags negative trajectory.
              </div>
              <input
                type="number"
                min={5}
                max={30}
                step={1}
                value={config.declinePercentageThreshold}
                onChange={(e) => setConfig({ ...config, declinePercentageThreshold: Number(e.target.value) })}
                className="w-full sm:w-64 p-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Score Variance / Volatility Threshold */}
            <div className="space-y-1.5 pt-3 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-200">
                Assessment Volatility / Variance Threshold (Std. Dev.)
              </label>
              <div className="text-[11px] text-slate-400">
                Standard deviation threshold across subject scores that triggers an Inconsistent Assessment signal.
              </div>
              <input
                type="number"
                min={5}
                max={30}
                step={1}
                value={config.varianceThreshold}
                onChange={(e) => setConfig({ ...config, varianceThreshold: Number(e.target.value) })}
                className="w-full sm:w-64 p-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Classification Cutoffs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-rose-300">
                  High Risk Cutoff Score (&ge;)
                </label>
                <div className="text-[11px] text-slate-400">
                  Score at or above which student is classified as HIGH RISK (0-100 scale).
                </div>
                <input
                  type="number"
                  min={50}
                  max={90}
                  value={config.highRiskCutoff}
                  onChange={(e) => setConfig({ ...config, highRiskCutoff: Number(e.target.value) })}
                  className="w-full p-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-rose-300 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-amber-300">
                  Medium Risk Cutoff Score (&ge;)
                </label>
                <div className="text-[11px] text-slate-400">
                  Cutoff for MEDIUM RISK advisory classification.
                </div>
                <input
                  type="number"
                  min={20}
                  max={55}
                  value={config.mediumRiskCutoff}
                  onChange={(e) => setConfig({ ...config, mediumRiskCutoff: Number(e.target.value) })}
                  className="w-full p-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-md shadow-indigo-600/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Updating & Recalculating...' : 'Save & Trigger Live Re-evaluation'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* System Formulation Guidance */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>Risk Score Formula Specification</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The system employs a transparent, bounded composite scoring function (0–100):
          </p>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 leading-relaxed space-y-1">
            <div>RiskScore =</div>
            <div className="pl-3 text-slate-400">(AttDeficit × 0.35) +</div>
            <div className="pl-3 text-slate-400">(MarkDecline × 0.30) +</div>
            <div className="pl-3 text-slate-400">(ScoreVolatility × 0.15) +</div>
            <div className="pl-3 text-slate-400">(WeakSubjectCount × 0.20)</div>
          </div>

          <div className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800">
            <div className="font-semibold text-slate-300">Statutory Regulation:</div>
            <div>
              Per University Academic Regulations (A.Y. 2026–2027), any student with cumulative attendance below 75% without authorized medical exemption cannot be issued an End-Semester Examination Hall Ticket.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
