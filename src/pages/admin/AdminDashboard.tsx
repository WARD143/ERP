import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { RiskDistributionDonut } from '../../components/charts/RiskDistributionDonut';
import { CsvImportModal } from '../../components/common/CsvImportModal';
import {
  Users,
  Award,
  ShieldAlert,
  Upload,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  BarChart3,
  Sparkles
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tabId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await api.recalculateRisks();
      alert(`Risk Engine successfully re-evaluated for ${res.evaluatedCount} students.`);
      await fetchDashboard();
    } catch (err: any) {
      alert('Recalculation error: ' + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading || !data) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading Administrator Intelligence Dashboard...</div>;
  }

  const { totalStudents, totalFaculty, totalSubjects, averageAttendance, riskDistribution, gpaBuckets, config } = data;

  return (
    <div className="space-y-6">
      {/* Admin Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-indigo-400 font-mono">
            <span>INSTITUTIONAL ADMINISTRATION & ANALYTICS</span>
            <span className="text-slate-600">·</span>
            <span>CSE Department (2026–2027)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            Cohort Academic Intelligence & Risk Threshold Governance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Departmental overview, risk distribution governance, policy threshold configuration, and continuous evaluation data ingestion
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{recalculating ? 'Evaluating...' : 'Recalculate Cohort Risk'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Monitored Cohort"
          value={totalStudents}
          subtitle="Section A & B Enrolled"
          icon={Users}
          statusColor="indigo"
        />

        <StatCard
          title="Department Attendance Average"
          value={`${averageAttendance}%`}
          subtitle="Statutory Minimum: 75.0%"
          trend={averageAttendance >= 75 ? 'UP' : 'DOWN'}
          trendText={averageAttendance >= 75 ? 'Healthy' : 'Below Target'}
          icon={Award}
          statusColor={averageAttendance >= 75 ? 'emerald' : 'rose'}
        />

        <StatCard
          title="High Risk Students"
          value={riskDistribution.high}
          subtitle="Requires faculty intervention"
          icon={ShieldAlert}
          statusColor={riskDistribution.high > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Configured Risk Cutoff"
          value={`≥ ${config.highRiskCutoff}`}
          subtitle={`Medium Cutoff: ≥ ${config.mediumRiskCutoff}`}
          icon={SlidersHorizontal}
          statusColor="indigo"
        />
      </div>

      {/* Visual Analytics: Risk Donut + GPA Distribution Buckets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100">Cohort Risk Distribution</h2>
            <button
              onClick={() => onNavigateTab('risk-config')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Adjust Cutoffs
            </button>
          </div>

          <RiskDistributionDonut distribution={riskDistribution} total={totalStudents} />
        </div>

        {/* GPA Distribution Histogram */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">GPA Distribution Curve</h2>
              <p className="text-xs text-slate-400">Class performance spread based on continuous evaluation</p>
            </div>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="space-y-3">
            {gpaBuckets.map((b: any) => {
              const pct = ((b.count / (totalStudents || 1)) * 100).toFixed(0);
              return (
                <div key={b.label} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{b.label}</span>
                    <span className="font-mono tabular-nums font-semibold text-indigo-300">
                      {b.count} students ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CsvImportModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onImportComplete={fetchDashboard}
      />
    </div>
  );
};
