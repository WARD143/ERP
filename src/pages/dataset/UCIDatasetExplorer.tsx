import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { UCIRecord, UCIDatasetAnalytics, UCIPredictionResult } from '../../types';
import {
  Database,
  BarChart3,
  TrendingUp,
  BrainCircuit,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Wine,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  Sliders,
  Sparkles,
  X
} from 'lucide-react';

export const UCIDatasetExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'records' | 'analytics' | 'predictor'>('records');
  const [analytics, setAnalytics] = useState<UCIDatasetAnalytics | null>(null);
  const [records, setRecords] = useState<UCIRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<UCIRecord | null>(null);

  // Filters
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // ML Predictor State
  const [predG1, setPredG1] = useState(12);
  const [predG2, setPredG2] = useState(12);
  const [predStudyTime, setPredStudyTime] = useState(2);
  const [predFailures, setPredFailures] = useState(0);
  const [predAbsences, setPredAbsences] = useState(4);
  const [predWalc, setPredWalc] = useState(1);
  const [predHigher, setPredHigher] = useState('yes');
  const [predSchoolSup, setPredSchoolSup] = useState('no');
  const [predResult, setPredResult] = useState<UCIPredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [courseFilter, schoolFilter, riskFilter, searchTerm, page]);

  const fetchAnalytics = async () => {
    try {
      const data = await api.getDatasetAnalytics();
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to load dataset analytics', e);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.getDatasetRecords({
        course: courseFilter,
        school: schoolFilter,
        risk: riskFilter,
        search: searchTerm,
        page,
        limit: 15
      });
      setRecords(res.records);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      console.error('Failed to load dataset records', e);
    } finally {
      setLoading(false);
    }
  };

  const runPrediction = async () => {
    setPredicting(true);
    try {
      const result = await api.predictDatasetRisk({
        g1: predG1,
        g2: predG2,
        studytime: predStudyTime,
        failures: predFailures,
        absences: predAbsences,
        walc: predWalc,
        schoolsup: predSchoolSup,
        higher: predHigher
      });
      setPredResult(result);
    } catch (e) {
      console.error('Prediction failed', e);
    } finally {
      setPredicting(false);
    }
  };

  // Run initial prediction once
  useEffect(() => {
    runPrediction();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Database className="w-4 h-4" />
              <span>Benchmark Machine Learning Dataset Integration</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              UCI Student Performance Dataset & Analytics Engine
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              Real-world academic evaluation dataset (Cortez & Silva, 2008) tracking 33 demographic, 
              social, and continuous evaluation features across Mathematics and Portuguese courses.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/data/student-mat.csv"
              download="student-mat.csv"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Download Math Course CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>student-mat.csv</span>
            </a>
            <a
              href="/data/student-por.csv"
              download="student-por.csv"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Download Portuguese Course CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>student-por.csv</span>
            </a>
          </div>
        </div>

        {/* Stats Row */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="text-[11px] font-medium text-slate-400">Total Enrolled</div>
              <div className="text-lg font-bold text-white mt-0.5">{analytics.overview.totalRecords}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Math & Portuguese</div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="text-[11px] font-medium text-slate-400">Average Period 1 (G1)</div>
              <div className="text-lg font-bold text-indigo-300 mt-0.5">{analytics.overview.averageG1} / 20</div>
              <div className="text-[10px] text-indigo-400/80 mt-0.5">{Math.round((analytics.overview.averageG1 / 20) * 100)}% Equivalent</div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="text-[11px] font-medium text-slate-400">Average Period 2 (G2)</div>
              <div className="text-lg font-bold text-indigo-300 mt-0.5">{analytics.overview.averageG2} / 20</div>
              <div className="text-[10px] text-indigo-400/80 mt-0.5">{Math.round((analytics.overview.averageG2 / 20) * 100)}% Equivalent</div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="text-[11px] font-medium text-slate-400">Final Grade (G3)</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">{analytics.overview.averageG3} / 20</div>
              <div className="text-[10px] text-emerald-500/80 mt-0.5">Cohort Average</div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="text-[11px] font-medium text-slate-400">Mean Absences</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">{analytics.overview.averageAbsences} days</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Statutory Tracking</div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="text-[11px] font-medium text-slate-400">Study Time Index</div>
              <div className="text-lg font-bold text-white mt-0.5">Level {analytics.overview.averageStudyTimeLevel}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">2 to 5 hrs / week</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'records'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Dataset Records ({analytics?.overview.totalRecords || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Exploratory Data Analysis (EDA)</span>
        </button>

        <button
          onClick={() => setActiveTab('predictor')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'predictor'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Early Warning ML Predictor Sandbox</span>
        </button>
      </div>

      {/* TAB 1: DATASET RECORDS TABLE */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Controls & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Course */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Course:</span>
                <select
                  value={courseFilter}
                  onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Courses</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Portuguese">Portuguese</option>
                </select>
              </div>

              {/* School */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">School:</span>
                <select
                  value={schoolFilter}
                  onChange={(e) => { setSchoolFilter(e.target.value); setPage(1); }}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Schools</option>
                  <option value="GP">Gabriel Pereira (GP)</option>
                  <option value="MS">Mousinho da Silveira (MS)</option>
                </select>
              </div>

              {/* Risk */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Risk Status:</span>
                <select
                  value={riskFilter}
                  onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="HIGH">High Risk (G3 &lt; 10)</option>
                  <option value="MEDIUM">Medium Risk (10–13)</option>
                  <option value="LOW">Low Risk (14–20)</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Search job, reason..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4"># ID</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">School / Demographics</th>
                    <th className="py-3 px-4">Study Time</th>
                    <th className="py-3 px-4">Failures</th>
                    <th className="py-3 px-4">Absences</th>
                    <th className="py-3 px-4 text-center">G1</th>
                    <th className="py-3 px-4 text-center">G2</th>
                    <th className="py-3 px-4 text-center">G3 (Final)</th>
                    <th className="py-3 px-4 text-center">Risk Level</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-500">
                        Loading records from database...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-500">
                        No records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400">#{r.id}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            r.subject_course === 'Mathematics'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}>
                            {r.subject_course}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">School {r.school}</div>
                          <div className="text-[10px] text-slate-500">
                            {r.sex === 'F' ? 'Female' : 'Male'}, Age {r.age}, {r.address === 'U' ? 'Urban' : 'Rural'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {r.studytime === 1 && '< 2 hrs'}
                          {r.studytime === 2 && '2–5 hrs'}
                          {r.studytime === 3 && '5–10 hrs'}
                          {r.studytime === 4 && '> 10 hrs'}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {r.failures > 0 ? (
                            <span className="text-rose-400 font-bold">{r.failures}</span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className={r.absences > 10 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                            {r.absences}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-medium text-slate-300">{r.g1}</td>
                        <td className="py-3 px-4 text-center font-mono font-medium text-slate-300">{r.g2}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span className={r.g3 < 10 ? 'text-rose-400' : r.g3 <= 13 ? 'text-amber-300' : 'text-emerald-400'}>
                            {r.g3} / 20
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.risk_status === 'HIGH'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : r.risk_status === 'MEDIUM'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {r.risk_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedRecord(r)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-400 hover:text-white bg-indigo-950/60 hover:bg-indigo-600 rounded-lg border border-indigo-800/60 transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPLORATORY DATA ANALYSIS (EDA) */}
      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Study Time Impact */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase mb-1">
              <Clock className="w-4 h-4" />
              <span>Academic Effort Trajectory</span>
            </div>
            <h3 className="text-base font-bold text-white mb-4">Study Time vs Final Grade (G3)</h3>
            <div className="space-y-3">
              {analytics.studyImpact.map((item) => (
                <div key={item.studytime} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1.5">
                    <span>
                      {item.studytime === 1 && 'Level 1: < 2 Hours / week'}
                      {item.studytime === 2 && 'Level 2: 2 to 5 Hours / week'}
                      {item.studytime === 3 && 'Level 3: 5 to 10 Hours / week'}
                      {item.studytime === 4 && 'Level 4: > 10 Hours / week'}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">{item.avg_final_grade} / 20 ({item.avg_score_pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${item.avg_score_pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Sample cohort: {item.student_count} students</div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Failures Impact */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Failure Accumulation Penalty</span>
            </div>
            <h3 className="text-base font-bold text-white mb-4">Past Failures vs Risk Rate</h3>
            <div className="space-y-3">
              {analytics.failureImpact.map((item) => (
                <div key={item.failures} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1.5">
                    <span>{item.failures === 0 ? 'No Past Failures' : `${item.failures} Previous Class Failures`}</span>
                    <span className="font-mono text-rose-400 font-bold">{item.high_risk_pct}% High Risk</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${item.high_risk_pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Students: {item.count}</span>
                    <span>Avg Final Grade: {item.avg_final_grade}/20</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekend Alcohol Impact */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase mb-1">
              <Wine className="w-4 h-4" />
              <span>Lifestyle Behavioral Factors</span>
            </div>
            <h3 className="text-base font-bold text-white mb-4">Weekend Alcohol (Walc) vs Academic Grade</h3>
            <div className="space-y-3">
              {analytics.alcoholImpact.map((item) => (
                <div key={item.weekend_alcohol} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1.5">
                    <span>Consumption Rating: {item.weekend_alcohol} / 5</span>
                    <span className="font-mono text-slate-300">Grade: <strong className="text-emerald-400">{item.avg_final_grade}</strong> / 20</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Average recorded absences: <strong className="text-amber-400">{item.avg_absences} days</strong> ({item.count} students)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cohort Risk Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Cohort Risk Classification</span>
            </div>
            <h3 className="text-base font-bold text-white mb-4">Risk Distribution in UCI Cohort</h3>
            <div className="space-y-3">
              {analytics.riskDistribution.map((item) => (
                <div key={item.risk_status} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className={item.risk_status === 'HIGH' ? 'text-rose-400' : item.risk_status === 'MEDIUM' ? 'text-amber-300' : 'text-emerald-400'}>
                      {item.risk_status} RISK ({item.risk_status === 'HIGH' ? 'G3 < 10' : item.risk_status === 'MEDIUM' ? '10 ≤ G3 ≤ 13' : 'G3 ≥ 14'})
                    </span>
                    <span className="font-mono text-white">{item.percentage}% ({item.count} students)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.risk_status === 'HIGH' ? 'bg-rose-500' : item.risk_status === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EARLY WARNING ML PREDICTOR SANDBOX */}
      {activeTab === 'predictor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase mb-1">
              <Sliders className="w-4 h-4" />
              <span>Multi-Variable Simulation Controls</span>
            </div>
            <h2 className="text-lg font-bold text-white">Student Predictive Attribute Tuning</h2>
            <p className="text-xs text-slate-400">
              Adjust continuous evaluation scores, behavioral patterns, and attendance to simulate the ML early warning outcome.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* G1 */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Period 1 Grade (G1)</span>
                  <span className="font-mono text-indigo-400 font-bold">{predG1} / 20</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={predG1}
                  onChange={(e) => setPredG1(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* G2 */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Period 2 Grade (G2)</span>
                  <span className="font-mono text-indigo-400 font-bold">{predG2} / 20</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={predG2}
                  onChange={(e) => setPredG2(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Study Time */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Weekly Study Time</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {predStudyTime === 1 ? '< 2 hrs' : predStudyTime === 2 ? '2-5 hrs' : predStudyTime === 3 ? '5-10 hrs' : '> 10 hrs'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={predStudyTime}
                  onChange={(e) => setPredStudyTime(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Past Failures */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Past Class Failures</span>
                  <span className="font-mono text-rose-400 font-bold">{predFailures}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={predFailures}
                  onChange={(e) => setPredFailures(parseInt(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              {/* Absences */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Semester Absences</span>
                  <span className="font-mono text-amber-400 font-bold">{predAbsences} days</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={predAbsences}
                  onChange={(e) => setPredAbsences(parseInt(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Weekend Alcohol */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Weekend Alcohol Rating</span>
                  <span className="font-mono text-indigo-400 font-bold">{predWalc} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={predWalc}
                  onChange={(e) => setPredWalc(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Aspires Higher Education</label>
                <select
                  value={predHigher}
                  onChange={(e) => setPredHigher(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="yes">Yes (Positive Motivation)</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Extra Educational Support</label>
                <select
                  value={predSchoolSup}
                  onChange={(e) => setPredSchoolSup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="no">Standard Curriculum</option>
                  <option value="yes">Extra Support Enrolled</option>
                </select>
              </div>
            </div>

            <button
              onClick={runPrediction}
              disabled={predicting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{predicting ? 'Evaluating Regression Model...' : 'Calculate Predicted Final Grade & Risk'}</span>
            </button>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            {predResult ? (
              <div className="space-y-5">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Model Output & Risk Probability
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-4xl font-black text-white">{predResult.predictedG3}</span>
                    <span className="text-slate-400 font-mono text-sm">/ 20</span>
                    <span className="text-indigo-400 font-mono text-xs">({predResult.predictedPercentage}%)</span>
                  </div>
                </div>

                {/* Risk Badge */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  predResult.riskLevel === 'HIGH'
                    ? 'bg-rose-950/50 border-rose-800/80 text-rose-200'
                    : predResult.riskLevel === 'MEDIUM'
                    ? 'bg-amber-950/50 border-amber-800/80 text-amber-200'
                    : 'bg-emerald-950/50 border-emerald-800/80 text-emerald-200'
                }`}>
                  {predResult.riskLevel === 'HIGH' ? (
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wide">
                      {predResult.riskLevel} RISK CLASSIFICATION
                    </div>
                    <div className="text-xs mt-1 leading-relaxed text-slate-300">
                      {predResult.recommendation}
                    </div>
                  </div>
                </div>

                {/* Contributing Factors */}
                {predResult.contributingFactors && (
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block mb-2">
                      Factor Weight Breakdown (Feature Importance)
                    </span>
                    <div className="space-y-2">
                      {predResult.contributingFactors.map((f, i) => (
                        <div key={i} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-200 font-semibold">{f.factor}</span>
                            <span className="text-[10px] text-slate-500 block">{f.weight}</span>
                          </div>
                          <span className="font-mono text-indigo-300 font-bold">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Run prediction to generate outputs.
              </div>
            )}

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-500 mt-4">
              <strong>Mathematical Formulation:</strong> Evaluated using multivariable linear regression models calibrated against empirical UCI Math & Portuguese student cohorts.
            </div>
          </div>
        </div>
      )}

      {/* Inspect Record Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Student Record #{selectedRecord.id} — Full UCI Attributes
                </h3>
                <span className="text-xs text-indigo-400 font-medium">Course: {selectedRecord.subject_course} · School {selectedRecord.school}</span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Demographics</span>
                <span className="font-semibold text-slate-200">{selectedRecord.sex === 'F' ? 'Female' : 'Male'}, {selectedRecord.age} yrs</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Address Type</span>
                <span className="font-semibold text-slate-200">{selectedRecord.address === 'U' ? 'Urban' : 'Rural'}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Family Size</span>
                <span className="font-semibold text-slate-200">{selectedRecord.famsize === 'GT3' ? '> 3 members' : '≤ 3 members'}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Parents Cohabitation</span>
                <span className="font-semibold text-slate-200">{selectedRecord.pstatus === 'T' ? 'Together' : 'Apart'}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Mother Job</span>
                <span className="font-semibold text-slate-200 capitalize">{selectedRecord.mjob}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Father Job</span>
                <span className="font-semibold text-slate-200 capitalize">{selectedRecord.fjob}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Study Time</span>
                <span className="font-semibold text-slate-200">Level {selectedRecord.studytime}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Past Failures</span>
                <span className="font-semibold text-slate-200">{selectedRecord.failures}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Absences</span>
                <span className="font-semibold text-slate-200">{selectedRecord.absences} days</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Family Relation</span>
                <span className="font-semibold text-slate-200">{selectedRecord.famrel} / 5</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Health Status</span>
                <span className="font-semibold text-slate-200">{selectedRecord.health} / 5</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Weekend Alcohol</span>
                <span className="font-semibold text-slate-200">{selectedRecord.walc} / 5</span>
              </div>
            </div>

            {/* Evaluation Marks */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Evaluation Performance</span>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs">G1: <strong className="text-slate-200">{selectedRecord.g1}/20</strong></span>
                  <span className="text-xs">G2: <strong className="text-slate-200">{selectedRecord.g2}/20</strong></span>
                  <span className="text-xs">G3 (Final): <strong className="text-emerald-400 font-bold">{selectedRecord.g3}/20</strong></span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                selectedRecord.risk_status === 'HIGH'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : selectedRecord.risk_status === 'MEDIUM'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {selectedRecord.risk_status} RISK
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
