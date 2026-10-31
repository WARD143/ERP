import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { RiskDistributionDonut } from '../../components/charts/RiskDistributionDonut';
import { StudentDetailModal } from './StudentDetailModal';
import { Users, AlertTriangle, ShieldAlert, ClipboardList, BookOpen, ArrowRight, Bell, HeartHandshake, Database, Search } from 'lucide-react';

interface FacultyDashboardProps {
  onNavigateTab: (tabId: string) => void;
  onOpenInterventionModal?: (studentId: string) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  onNavigateTab,
  onOpenInterventionModal
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchRoll, setSearchRoll] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!searchRoll.trim()) return;
    
    try {
      const res = await api.getFacultyStudentProfileByRoll(searchRoll.trim());
      if (res.student) {
        setSelectedStudentId(res.student.id);
        setSearchRoll('');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Student not found or not assigned to you.');
    }
  };

  const fetchData = async () => {
    try {
      const res = await api.getFacultyDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !data) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading Faculty Academic Operations Dashboard...</div>;
  }

  const { summary, students, subjects, alerts, interventions } = data;
  const highRiskStudents = students.filter((s: any) => s.risk_level === 'HIGH');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-indigo-400 font-mono">
            <span>FACULTY & MENTOR ANALYTICS PORTAL</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Department of CSE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            Class Performance Monitoring & Early Warning Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cohort tracking across Section A & B, multi-factor risk detection, and academic counseling triage
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateTab('uci-dataset')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 rounded-xl border border-emerald-800/60 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>UCI Dataset & ML</span>
          </button>
          <button
            onClick={() => onNavigateTab('mentoring-portal')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 rounded-lg border border-indigo-800/60 transition-colors"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-indigo-400" />
            <span>Proctorial Mentee Desk</span>
          </button>
          <button
            onClick={() => onNavigateTab('interventions')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Manage Interventions</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Assigned Student by Roll Number (e.g., 2420030520)"
              value={searchRoll}
              onChange={(e) => setSearchRoll(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Find Profile
          </button>
        </form>
        {searchError && <p className="text-rose-400 text-xs mt-2">{searchError}</p>}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Students"
          value={summary.totalStudents}
          subtitle="Section A & B Enrolled"
          icon={Users}
          statusColor="indigo"
        />

        <StatCard
          title="High-Risk Early Warnings"
          value={summary.highRiskCount}
          subtitle="Requires immediate counseling"
          trend={summary.highRiskCount > 0 ? 'DOWN' : 'NEUTRAL'}
          trendText={summary.highRiskCount > 0 ? 'Action Required' : 'Clear'}
          icon={AlertTriangle}
          statusColor="rose"
        />

        <StatCard
          title="Medium-Risk Advisories"
          value={summary.mediumRiskCount}
          subtitle="Performance volatility / deficits"
          icon={ShieldAlert}
          statusColor="amber"
        />

        <StatCard
          title="Active Interventions"
          value={summary.activeInterventionsCount}
          subtitle="Counseling sessions scheduled"
          icon={ClipboardList}
          statusColor="indigo"
        />
      </div>

      {/* Cohort Risk Breakdown + Critical Alert Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Cohort Risk Distribution</h2>
            <p className="text-xs text-slate-400">Class balance across Low, Medium, and High risk categories</p>
          </div>

          <RiskDistributionDonut
            distribution={{
              high: summary.highRiskCount,
              medium: summary.mediumRiskCount,
              low: summary.lowRiskCount
            }}
            total={summary.totalStudents}
          />
        </div>

        {/* High Risk Students Triage */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Immediate Attention Students (High Risk)</span>
              </h2>
              <p className="text-xs text-slate-400">Identified by declining marks, attendance &lt; 75%, or continuous evaluation failures</p>
            </div>
            <button
              onClick={() => onNavigateTab('student-list')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View All Students</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {highRiskStudents.map((s: any) => {
              let reasons: string[] = [];
              try {
                reasons = s.explanation_reasons ? JSON.parse(s.explanation_reasons) : [];
              } catch (e) {}

              return (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-100">{s.name}</span>
                      <span className="font-mono text-[11px] text-slate-400">({s.roll_number})</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                        Score {s.overall_risk_score}/100
                      </span>
                    </div>
                    <div className="text-xs text-rose-300 mt-1 max-w-xl truncate">
                      {reasons[0] || 'Multi-factor academic risk indicators detected.'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedStudentId(s.id)}
                      className="px-3 py-1.5 text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                    >
                      Inspect Profile
                    </button>
                    {onOpenInterventionModal && (
                      <button
                        onClick={() => onOpenInterventionModal(s.id)}
                        className="px-3 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                      >
                        Intervene
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cohort Analytics & Reports */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Cohort Analytics & Reports</span>
            </h2>
            <p className="text-xs text-slate-400">Class-wide academic insights and downloadable reports</p>
          </div>
          <div className="flex gap-2">
            <a href="/api/reports/at-risk?export=csv" target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors">
              Export At-Risk CSV
            </a>
            <a href="/api/reports/cohort?export=csv" target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors">
              Export Cohort CSV
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col items-center justify-center text-center h-24">
            <div className="text-2xl font-bold text-slate-100">{summary.totalStudents}</div>
            <div className="text-xs text-slate-400">Total Assigned Students</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col items-center justify-center text-center h-24">
            <div className="text-2xl font-bold text-amber-400">{summary.mediumRiskCount + summary.highRiskCount}</div>
            <div className="text-xs text-slate-400">Students Requiring Attention</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col items-center justify-center text-center h-24">
            <div className="text-2xl font-bold text-indigo-400">{summary.activeInterventionsCount}</div>
            <div className="text-xs text-slate-400">Active Mentor Cases</div>
          </div>
        </div>
      </div>

      <StudentDetailModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        onScheduleIntervention={onOpenInterventionModal}
      />
    </div>
  );
};
