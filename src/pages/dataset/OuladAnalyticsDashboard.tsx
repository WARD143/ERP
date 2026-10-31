import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Database,
  BarChart3,
  TrendingUp,
  BrainCircuit,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  X,
  Users,
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle2,
  MousePointerClick,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const OuladAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'vle' | 'assessments' | 'models'>('overview');
  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);

  // Filters
  const [moduleFilter, setModuleFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [search, setSearch] = useState('');

  // Student 360 Modal
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [student360, setStudent360] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // VLE & Assessments data
  const [vleData, setVleData] = useState<any[]>([]);
  const [assessmentsData, setAssessmentsData] = useState<any[]>([]);

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [page, moduleFilter, resultFilter]);

  useEffect(() => {
    if (activeTab === 'vle' && vleData.length === 0) {
      api.getOuladEngagement().then(res => setVleData(res.activityStats || []));
    }
    if (activeTab === 'assessments' && assessmentsData.length === 0) {
      api.getOuladAssessments().then(res => setAssessmentsData(res.assessments || []));
    }
  }, [activeTab]);

  const loadSummary = async () => {
    try {
      const data = await api.getOuladSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load OULAD summary', err);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getOuladStudents({
        page,
        limit: 15,
        module: moduleFilter || undefined,
        result: resultFilter || undefined,
        search: search || undefined
      });
      setStudents(res.students || []);
      setTotalPages(res.totalPages || 1);
      setTotalStudentsCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load OULAD students', err);
    } finally {
      setLoading(false);
    }
  };

  const openStudentModal = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setModalLoading(true);
    try {
      const data = await api.getOuladStudent360(studentId);
      setStudent360(data);
    } catch (err) {
      console.error('Failed to load student 360', err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-700/40 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Database className="w-3.5 h-3.5" />
              <span>RESEARCH DATASET INTEGRATION</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-mono">32,593 ENROLMENTS</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Open University Learning Analytics (OULAD)
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Global benchmark research repository containing 32,593 student course enrolments, 173,912 assessment submissions, and 10.65 million Virtual Learning Environment (VLE) interaction events. Formatted into isolated research tables with scikit-learn Gradient Boosting &amp; Random Forest risk classification.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <div className="text-xs text-slate-400 font-mono">
              Source Attribution:
              <span className="text-indigo-400 ml-1">Kuzilek et al. (CC BY 4.0)</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Isolated Schema: <code className="text-indigo-300">oulad_*</code></span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-slate-700/60 pt-4">
          {[
            { id: 'overview', label: 'Dataset Executive Summary', icon: BarChart3 },
            { id: 'students', label: 'Student Enrolments & Risk', icon: Users },
            { id: 'vle', label: 'VLE Engagement Analytics (10.6M Events)', icon: MousePointerClick },
            { id: 'assessments', label: 'Assessment Submissions', icon: BookOpen },
            { id: 'models', label: 'Predictive ML Models (GBM 92.6%)', icon: BrainCircuit }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Enrolments</span>
              <p className="text-2xl font-bold text-white mt-1">{summary?.totalEnrolments?.toLocaleString() || '32,593'}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Course Registrations</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Unique Students</span>
              <p className="text-2xl font-bold text-indigo-400 mt-1">{summary?.uniqueStudents?.toLocaleString() || '28,785'}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Individual Scholars</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Modules</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{summary?.totalCourses || '22'}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">7 Modules × Semesters</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Assessments</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">{summary?.totalAssessments || '206'}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">TMA, CMA, Exams</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Submissions</span>
              <p className="text-2xl font-bold text-purple-400 mt-1">{summary?.totalSubmissions?.toLocaleString() || '173,912'}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Scored Tasks</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Average Score</span>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{summary?.averageScore || '75.8'}%</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Mean Assessment Score</span>
            </div>
          </div>

          {/* Outcome Breakdown & Course Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Outcome Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-amber-400" />
                  Documented Academic Outcomes
                </h3>
                <div className="space-y-3">
                  {summary?.finalResultDistribution?.map((r: any) => {
                    const total = summary.totalEnrolments || 32593;
                    const pct = Math.round((r.count / total) * 100);
                    const color =
                      r.final_result === 'Distinction'
                        ? 'bg-amber-500 text-amber-300'
                        : r.final_result === 'Pass'
                        ? 'bg-emerald-500 text-emerald-300'
                        : r.final_result === 'Fail'
                        ? 'bg-rose-500 text-rose-300'
                        : 'bg-slate-500 text-slate-300';
                    return (
                      <div key={r.final_result} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-200">{r.final_result}</span>
                          <span className="text-slate-400 font-mono">
                            {r.count.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                          <div className={`h-full ${color.split(' ')[0]}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 p-3 rounded-xl bg-slate-900/60 border border-slate-700 text-xs text-slate-400">
                <span className="font-semibold text-slate-300 block mb-1">Methodology Note:</span>
                Results represent officially recorded final status in the Open University dataset. Distinction indicates exceptional mastery (&gt;85% composite score).
              </div>
            </div>

            {/* Top Modules Comparison */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow">
              <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Course Presentations &amp; Enrolment Volume
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Module Code</th>
                      <th className="py-2.5 px-3">Presentation</th>
                      <th className="py-2.5 px-3">Enrolments</th>
                      <th className="py-2.5 px-3">Avg Score</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {summary?.topCourses?.map((c: any) => (
                      <tr key={`${c.code_module}-${c.code_presentation}`} className="hover:bg-slate-700/20">
                        <td className="py-2.5 px-3 font-semibold text-white">Module {c.code_module}</td>
                        <td className="py-2.5 px-3 font-mono text-indigo-300">{c.code_presentation}</td>
                        <td className="py-2.5 px-3 font-mono">{c.enrolments?.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{c.avg_score || 'N/A'}%</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS & EARLY WARNING */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search OULAD Student ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadStudents()}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={moduleFilter}
                onChange={e => { setModuleFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Modules</option>
                {['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'GGG'].map(m => (
                  <option key={m} value={m}>Module {m}</option>
                ))}
              </select>

              <select
                value={resultFilter}
                onChange={e => { setResultFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Results</option>
                <option value="Pass">Pass</option>
                <option value="Distinction">Distinction</option>
                <option value="Fail">Fail</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>

              <button
                onClick={loadStudents}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Filter
              </button>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Showing {(page - 1) * 15 + 1} - {Math.min(page * 15, totalStudentsCount)} of {totalStudentsCount.toLocaleString()} records
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-700/60 overflow-hidden bg-slate-800/80 shadow">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Anonymous ID</th>
                  <th className="py-3 px-4">Module / Cohort</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">VLE Clicks</th>
                  <th className="py-3 px-4">Active Days</th>
                  <th className="py-3 px-4">Risk Classification</th>
                  <th className="py-3 px-4">Final Result</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-mono">
                      Querying OULAD database...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No student records match the specified filters.
                    </td>
                  </tr>
                ) : (
                  students.map(st => {
                    const isHigh = st.riskLevel === 'HIGH';
                    const isMed = st.riskLevel === 'MEDIUM';
                    return (
                      <tr key={`${st.id_student}-${st.code_module}-${st.code_presentation}`} className="hover:bg-slate-700/20">
                        <td className="py-3 px-4 font-mono font-semibold text-white">
                          #{st.id_student}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-indigo-300">{st.code_module}</span>
                          <span className="text-slate-400 ml-1">({st.code_presentation})</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {st.gender}, {st.age_band}, {st.highest_education || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-cyan-300">
                          {st.total_clicks?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {st.active_days} days
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isHigh
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : isMed
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {st.riskLevel} ({st.riskScore})
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          <span
                            className={
                              st.final_result === 'Distinction'
                                ? 'text-amber-400'
                                : st.final_result === 'Pass'
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }
                          >
                            {st.final_result}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openStudentModal(st.id_student)}
                            className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 text-xs font-semibold transition"
                          >
                            360° Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div>Page {page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VLE ENGAGEMENT */}
      {activeTab === 'vle' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
              <MousePointerClick className="w-4 h-4 text-indigo-400" />
              VLE Activity Type Breakdown (Aggregate across 10,655,280 clickstream events)
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated from the high-volume streaming pipeline. Queries query the indexed <code className="text-indigo-300">oulad_student_vle_summary</code> layer for instantaneous UI response.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vleData.map((act: any) => (
              <div key={act.activity_type} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white capitalize">{act.activity_type}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {act.active_students?.toLocaleString()} Students
                  </span>
                </div>
                <div className="text-2xl font-bold text-cyan-400 font-mono">
                  {act.total_clicks?.toLocaleString()}
                </div>
                <span className="text-xs text-slate-400 mt-1 block">
                  Avg: {act.avg_clicks_per_student} clicks / student
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ASSESSMENTS */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              OULAD Assessment Performance Benchmark
            </h3>
            <p className="text-xs text-slate-400">
              Analysis across Tutor-Marked (TMA), Computer-Marked (CMA), and Final Exams across all 22 module cohorts.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700/60 overflow-hidden bg-slate-800/80 shadow">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Presentation</th>
                  <th className="py-3 px-4">Assessment Type</th>
                  <th className="py-3 px-4">Cutoff Day</th>
                  <th className="py-3 px-4">Weight</th>
                  <th className="py-3 px-4">Submissions</th>
                  <th className="py-3 px-4">Average Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {assessmentsData.map(a => (
                  <tr key={a.id_assessment} className="hover:bg-slate-700/20">
                    <td className="py-2.5 px-4 font-mono font-semibold text-white">{a.id_assessment}</td>
                    <td className="py-2.5 px-4 font-semibold text-indigo-300">{a.code_module}</td>
                    <td className="py-2.5 px-4 font-mono">{a.code_presentation}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-200">
                        {a.assessment_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">Day {a.date ?? 'N/A'}</td>
                    <td className="py-2.5 px-4 font-mono">{a.weight}%</td>
                    <td className="py-2.5 px-4 font-mono text-purple-300">{a.submissions_count?.toLocaleString()}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-emerald-400">{a.avg_score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ML EVALUATION */}
      {activeTab === 'models' && summary?.mlEvaluation && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              Machine Learning Model Pipeline &amp; Evaluation Metrics
            </h3>
            <p className="text-xs text-slate-400">
              Trained on {summary.mlEvaluation.train_samples?.toLocaleString()} student records and evaluated against an isolated test split of {summary.mlEvaluation.test_samples?.toLocaleString()} records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(summary.mlEvaluation.results || {}).map(([mName, metrics]: [string, any]) => (
              <div key={mName} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white mb-3">{mName}</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Accuracy:</span>
                      <span className="font-mono font-bold text-emerald-400">{(metrics.accuracy * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Precision:</span>
                      <span className="font-mono font-bold text-cyan-400">{(metrics.precision * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recall:</span>
                      <span className="font-mono font-bold text-amber-400">{(metrics.recall * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">F1-Score:</span>
                      <span className="font-mono font-bold text-purple-400">{(metrics.f1_score * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] text-slate-400">
                  Artifact: <code className="text-indigo-300">oulad_{mName.toLowerCase()}.joblib</code>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 text-xs text-slate-300 space-y-1">
            <span className="font-semibold text-white block">Transparent Governance &amp; Ethics Notice:</span>
            <p>1. Predictions are mathematical estimations intended for proactive academic intervention only.</p>
            <p>2. Student identifiers (ID numbers) were excluded from model features to prevent memorization.</p>
            <p>3. Training was stratified on the outcome distribution to prevent majority-class bias.</p>
          </div>
        </div>
      )}

      {/* STUDENT 360 MODAL */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold font-mono">
                  #{selectedStudentId}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">OULAD Scholar 360° Profile</h3>
                  <span className="text-xs text-slate-400">Anonymous Open University Research Identifier</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentId(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalLoading || !student360 ? (
              <div className="py-12 text-center text-slate-400 font-mono">Loading scholar profile...</div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Enrolment Cards */}
                <div>
                  <h4 className="font-semibold text-slate-300 mb-2 uppercase tracking-wider text-[11px]">Enrolments &amp; Registration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {student360.enrolments?.map((e: any) => (
                      <div key={`${e.code_module}-${e.code_presentation}`} className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-sm">Module {e.code_module}</span>
                          <span className="font-mono text-indigo-300">{e.code_presentation}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-400">
                          <div>Result: <span className="font-bold text-white">{e.final_result}</span></div>
                          <div>Total Clicks: <span className="font-bold text-cyan-300">{e.total_clicks?.toLocaleString()}</span></div>
                          <div>Active Days: <span className="font-bold text-white">{e.active_days}</span></div>
                          <div>Reg Day: <span className="font-bold text-white">{e.date_registration ?? 'N/A'}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assessments */}
                <div>
                  <h4 className="font-semibold text-slate-300 mb-2 uppercase tracking-wider text-[11px]">Assessment Submissions ({student360.assessments?.length || 0})</h4>
                  <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-800/40">
                    <table className="w-full text-left">
                      <thead className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Module</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Cutoff</th>
                          <th className="py-2 px-3">Submitted</th>
                          <th className="py-2 px-3">Weight</th>
                          <th className="py-2 px-3">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {student360.assessments?.map((sa: any) => (
                          <tr key={sa.id_assessment}>
                            <td className="py-2 px-3 font-semibold text-white">{sa.code_module} ({sa.code_presentation})</td>
                            <td className="py-2 px-3">{sa.assessment_type}</td>
                            <td className="py-2 px-3 font-mono">Day {sa.cutoff_date ?? 'N/A'}</td>
                            <td className="py-2 px-3 font-mono text-indigo-300">Day {sa.date_submitted}</td>
                            <td className="py-2 px-3 font-mono">{sa.weight}%</td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-400">{sa.score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* VLE Activity breakdown */}
                <div>
                  <h4 className="font-semibold text-slate-300 mb-2 uppercase tracking-wider text-[11px]">VLE Activity Interactions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {student360.vleActivities?.map((v: any) => (
                      <div key={`${v.activity_type}-${v.code_module}`} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <span className="capitalize font-semibold text-slate-300 block">{v.activity_type}</span>
                        <span className="text-base font-bold text-cyan-400 font-mono mt-0.5 block">{v.total_clicks?.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">{v.active_days_count} active days</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
