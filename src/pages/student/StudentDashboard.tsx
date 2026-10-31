import React from 'react';
import {
  StudentAnalytics,
  RiskAssessment,
  Alert,
  Recommendation,
  ForecastResult
} from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { RiskBadge } from '../../components/common/RiskBadge';
import { TrendLineChart } from '../../components/charts/TrendLineChart';
import { SubjectBarChart } from '../../components/charts/SubjectBarChart';
import { AttendanceGauge } from '../../components/charts/AttendanceGauge';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  LineChart,
  HeartHandshake,
  FileText,
  Calendar,
  Sparkles,
  Database,
  User,
  GraduationCap,
  Clock,
  ChevronRight,
  Zap
} from 'lucide-react';

interface StudentDashboardProps {
  analytics: StudentAnalytics;
  risk: RiskAssessment;
  recommendations: Recommendation[];
  forecast: ForecastResult;
  alerts: Alert[];
  onNavigateTab: (tabId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  analytics,
  risk,
  recommendations = [],
  forecast,
  alerts = [],
  onNavigateTab
}) => {
  // Safe field access
  const currentGpa = analytics.currentGpa ?? (analytics as any).currentGPA ?? 8.5;
  const prevGpa = analytics.comparisons?.prevSemesterGpa ?? (analytics as any).previousGPA ?? 8.0;
  const gpaDelta = analytics.comparisons?.gpaDelta ?? (currentGpa - prevGpa);
  const attendancePct = analytics.attendanceAverage ?? (analytics as any).attendancePercentage ?? 80;
  const rank = analytics.rankInSection ?? 1;
  const totalStudents = analytics.totalStudentsInSection ?? 60;
  const trajectory = analytics.trendStatus ?? (analytics as any).trajectory ?? 'IMPROVING';

  const isUp = gpaDelta > 0;
  const isDown = gpaDelta < 0;

  const unresolvedAlerts = alerts?.filter(a => a.is_resolved === 0) || [];

  // Time-aware greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = analytics?.name ? (analytics.name.split(' ')[0] || analytics.name) : 'Student';

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* 1. Welcome & Academic Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Student Avatar */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-[2px] shadow-md shadow-indigo-500/20">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-2xl sm:text-3xl text-indigo-600 dark:text-indigo-400 font-mono">
                  {firstName[0]}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-900 rounded-full shadow-2xs">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 block border-2 border-white dark:border-slate-900" />
              </div>
            </div>

            {/* Greeting & Identity */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Academic Intelligence
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{todayStr}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 sm:gap-3 flex-wrap">
                <span>{timeGreeting}, {firstName}</span>
                <span className="text-xl">👋</span>
              </h1>

              <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-600 dark:text-slate-400">
                <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {analytics.rollNumber}
                </span>
                <span>Section {analytics.section || 'A'}</span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span>Computer Science & Engineering</span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Rank <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">#{rank}</span> / {totalStudents}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
            <RiskBadge level={risk?.riskLevel || 'LOW'} score={risk?.overallRiskScore} size="lg" />
            <button
              onClick={() => onNavigateTab('what-if')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-sm shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Simulate What-If</span>
            </button>
            <button
              onClick={() => onNavigateTab('mentoring-portal')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4 text-indigo-500" />
              <span>Mentor Desk</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Indicators (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Semester GPA */}
        <StatCard
          title="Current Semester GPA"
          value={typeof currentGpa === 'number' ? currentGpa.toFixed(2) : currentGpa}
          subtitle={`Previous: ${typeof prevGpa === 'number' ? prevGpa.toFixed(2) : prevGpa}`}
          icon={Award}
          trend={isUp ? 'UP' : isDown ? 'DOWN' : 'NEUTRAL'}
          trendText={`${Math.abs(gpaDelta).toFixed(2)} GPA points`}
          statusColor={currentGpa >= 8.5 ? 'emerald' : currentGpa >= 7.0 ? 'indigo' : 'rose'}
          progress={(currentGpa / 10) * 100}
          badgeText="Target: 9.0+"
        />

        {/* KPI 2: Attendance Rate */}
        <StatCard
          title="Attendance Rate"
          value={`${typeof attendancePct === 'number' ? attendancePct.toFixed(1) : attendancePct}%`}
          subtitle="Mandatory threshold: 75%"
          icon={Calendar}
          trend={attendancePct >= 75 ? 'UP' : 'DOWN'}
          trendText={attendancePct >= 75 ? 'Hall Ticket Eligible' : 'Condonation Required'}
          statusColor={attendancePct >= 75 ? 'emerald' : attendancePct >= 65 ? 'amber' : 'rose'}
          progress={attendancePct}
          badgeText={attendancePct >= 75 ? 'Verified' : 'Action Needed'}
        />

        {/* KPI 3: Trajectory & Momentum */}
        <StatCard
          title="Performance Trajectory"
          value={trajectory}
          subtitle={`Class Rank: #${rank} of ${totalStudents}`}
          icon={trajectory === 'IMPROVING' ? TrendingUp : trajectory === 'DECLINING' ? TrendingDown : Minus}
          trend={trajectory === 'IMPROVING' ? 'UP' : trajectory === 'DECLINING' ? 'DOWN' : 'NEUTRAL'}
          trendText={trajectory}
          statusColor={trajectory === 'IMPROVING' ? 'emerald' : trajectory === 'DECLINING' ? 'rose' : 'blue'}
          progress={85}
          badgeText="Semester VI"
        />

        {/* KPI 4: Early Warning Risk Score */}
        <StatCard
          title="Risk Index Score"
          value={`${risk?.overallRiskScore ?? 12} / 100`}
          subtitle={`Classification: ${risk?.riskLevel ?? 'LOW'} Risk`}
          icon={ShieldCheck}
          trend={risk?.riskLevel === 'LOW' ? 'UP' : 'DOWN'}
          trendText={`${unresolvedAlerts.length} Active Notice${unresolvedAlerts.length === 1 ? '' : 's'}`}
          statusColor={risk?.riskLevel === 'LOW' ? 'emerald' : risk?.riskLevel === 'MEDIUM' ? 'amber' : 'rose'}
          progress={risk?.overallRiskScore ?? 12}
          badgeText={risk?.riskLevel ?? 'LOW'}
        />
      </div>

      {/* 3. Advanced Analytics Section (Interactive Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Performance Over Time & Forecast Area */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Academic Trajectory & ML Forecast</span>
                <span className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Continuous internal assessment curve projected to End-Semester Examination
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                <span>Actual Marks</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-purple-600 dark:text-purple-400">
                <span className="w-2.5 h-0.5 bg-purple-500 inline-block" />
                <span>ML Projected</span>
              </div>
              <button
                onClick={() => onNavigateTab('performance-trends')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 ml-2 cursor-pointer"
              >
                <span>View Full Detail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="w-full">
            <TrendLineChart
              dataPoints={forecast?.chronologicalTrend || []}
              height={260}
              benchmarkPercentage={75}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Predicted End-Sem Range: <strong className="text-slate-900 dark:text-white font-mono text-sm">
                {forecast?.predictedGPARange?.min?.toFixed(2) ?? '8.20'} – {forecast?.predictedGPARange?.max?.toFixed(2) ?? '9.10'}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Forecast Confidence: <strong>{forecast?.confidenceLevel ?? 'High'}</strong></span>
            </div>
          </div>
        </div>

        {/* Attendance Gauge & Hall Ticket Status */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Attendance Analytics</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                A.Y. 2026-27
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Institutional regulation requires min. 75% for exam clearance without condonation fee.
            </p>
          </div>

          <AttendanceGauge
            percentage={attendancePct}
            totalClasses={120}
            attendedClasses={Math.round((attendancePct / 100) * 120)}
          />

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Hall Ticket Clearance</span>
              <span className={`font-semibold flex items-center gap-1 ${
                attendancePct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{attendancePct >= 75 ? 'Eligible' : 'Condonation Review'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Subject-Wise Analytics & Academic Intelligence Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject-Wise Performance Breakdown */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Subject-Wise Performance</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Internal assessments, labs, and attendance per registered course
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('subject-analytics')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Detailed Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <SubjectBarChart subjects={analytics?.subjects || []} />
        </div>

        {/* Academic Intelligence, Mentor & AI Plan Card */}
        <div className="space-y-4">
          {/* Assigned Faculty Mentor Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Assigned Proctorial Mentor
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                Active
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                PM
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dr. Pratusha Mam</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Associate Professor, CSE · Capstone Guide</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('mentoring-portal')}
              className="w-full mt-3.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Open Mentoring Desk</span>
            </button>
          </div>

          {/* AI Personalized Study Recommendations Preview */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Study Focus</h3>
              </div>
              <button
                onClick={() => onNavigateTab('recommendations')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {(recommendations || []).slice(0, 2).map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {rec.category}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      rec.priority === 'HIGH' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {rec.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
